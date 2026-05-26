"""
ms_project_parser.py — Parser de archivos XML de MS Project para ConferSafe.

Extrae:
  - Tareas (EDT/WBS), hitos, fases, dependencias
  - Recursos y sus rendimientos (desde Notes)
  - Asignaciones (qué recurso hace qué tarea)
  - Costos presupuestados y rendimientos diarios (campos extendidos)

Convierte todo al formato de nodos que usa ConferSafe.
"""

import xml.etree.ElementTree as ET
from datetime import datetime, date
from typing import List, Dict, Optional, Tuple
import re
import math

# Namespace del XML de MS Project
NS = {"ms": "http://schemas.microsoft.com/project"}

# Campos extendidos que usamos (FieldID → alias)
EXTENDED_FIELD_MAP = {
    "188743731": "fase_principal",        # Text1 → FasePrincipal
    "188743800": "presupuesto_cd_soles",  # Number1 → PresupuestoCD_Soles
    "188743801": "rendimiento_diario",    # Number2 → RendimientoDiario
    "188743802": "costo_presupuestado",   # Number3 → CostoPresupuestado_Soles
}

# Fases pre-operativas a marcar (el sistema las incluye pero las etiqueta)
PRE_OPERATIVE_KEYWORDS = [
    "licencia", "permiso", "municipal", "defensa civil", "autoriza",
    "constitucion de equipo", "plan de gestion", "gestion, permisos",
]


def _tag(name: str) -> str:
    return f"{{{NS['ms']}}}{name}"


def _parse_duration_hours(duration_str: str) -> float:
    """Convierte 'PT135H0M0S' → 135.0 horas"""
    if not duration_str:
        return 0.0
    match = re.match(r"PT(\d+)H(\d+)M(\d+)S", duration_str)
    if match:
        h, m, s = int(match.group(1)), int(match.group(2)), int(match.group(3))
        return h + m / 60 + s / 3600
    return 0.0


def _parse_date(date_str: str) -> Optional[date]:
    """Convierte '2026-08-08T16:00:00' → date object"""
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str).date()
    except Exception:
        return None


def _format_date(d: Optional[date]) -> Optional[str]:
    """Convierte date → 'DD/MM/YYYY' (formato frontend)"""
    if not d:
        return None
    return d.strftime("%d/%m/%Y")


def _calc_remaining(finish_date: Optional[date]) -> Optional[int]:
    """Calcula días restantes desde hoy hasta finish_date"""
    if not finish_date:
        return None
    today = date.today()
    return (finish_date - today).days


def _is_pre_operative(name: str) -> bool:
    name_lower = name.lower()
    return any(kw in name_lower for kw in PRE_OPERATIVE_KEYWORDS)


def _get_extended_attrs(task_elem) -> Dict[str, float]:
    """Extrae los campos extendidos (Number1, Number2, Number3, Text1) de una tarea"""
    attrs = {}
    for ea in task_elem.findall(_tag("ExtendedAttribute")):
        field_id = ea.findtext(_tag("FieldID"), "")
        value = ea.findtext(_tag("Value"), "")
        alias = EXTENDED_FIELD_MAP.get(field_id)
        if alias:
            try:
                attrs[alias] = float(value) if alias != "fase_principal" else value
            except (ValueError, TypeError):
                attrs[alias] = value
    return attrs


def _calc_layout_position(wbs: str, total_tasks: int) -> Tuple[float, float]:
    """
    Genera posición X/Y para el árbol visual basado en WBS.
    WBS "1" → nivel 0, "1.2" → nivel 1, "1.2.3" → nivel 2, etc.
    """
    parts = wbs.split(".")
    level = len(parts) - 1  # 0-based

    # Calcular índice en su nivel para distribuir horizontalmente
    # Usamos el último número del WBS como índice horizontal
    try:
        h_index = int(parts[-1]) - 1
    except (ValueError, IndexError):
        h_index = 0

    x_spacing = 220
    y_spacing = 160
    x_base = 100

    x = x_base + h_index * x_spacing
    y = 60 + level * y_spacing

    return float(x), float(y)


def parse_ms_project_xml(xml_content: bytes) -> Dict:
    """
    Parsea el XML de MS Project y retorna un dict con:
      - project_info: metadata del proyecto
      - nodes: lista de nodos en formato ConferSafe
      - resources: lista de recursos con sus rendimientos
      - summary: resumen estadístico
    """
    root = ET.fromstring(xml_content)

    # ── Metadata del proyecto ─────────────────────────────────────────────────
    project_info = {
        "title": root.findtext(_tag("Title")) or root.findtext(_tag("Name")) or "Proyecto sin nombre",
        "company": root.findtext(_tag("Company")) or "",
        "manager": root.findtext(_tag("Manager")) or "",
        "start_date": _format_date(_parse_date(root.findtext(_tag("StartDate")) or "")),
        "finish_date": _format_date(_parse_date(root.findtext(_tag("FinishDate")) or "")),
        "currency": root.findtext(_tag("CurrencyCode")) or "PEN",
        "currency_symbol": root.findtext(_tag("CurrencySymbol")) or "S/",
    }

    # ── Recursos ──────────────────────────────────────────────────────────────
    resource_map: Dict[str, Dict] = {}
    resources_section = root.find(_tag("Resources"))
    if resources_section:
        for res in resources_section.findall(_tag("Resource")):
            uid = res.findtext(_tag("UID"), "")
            is_null = res.findtext(_tag("IsNull"), "0")
            if is_null == "1" or uid == "0":
                continue
            name = res.findtext(_tag("Name"), "Sin nombre")
            notes = res.findtext(_tag("Notes"), "")
            rate = res.findtext(_tag("StandardRate"), "0")
            group = res.findtext(_tag("Group"), "")
            res_type = res.findtext(_tag("Type"), "1")  # 1=Work, 3=Material/Equipment

            # Extraer rendimiento de las notas (ej: "Rendimiento: 25 m3/dia")
            rendimiento = ""
            match = re.search(r"[Rr]endimiento[:\s]+(.+?)(?:;|$)", notes)
            if match:
                rendimiento = match.group(1).strip()

            resource_map[uid] = {
                "uid": uid,
                "name": name,
                "group": group,
                "type": "equipment" if res_type == "3" else "labor",
                "standard_rate": float(rate) if rate else 0,
                "notes": notes,
                "rendimiento": rendimiento,
            }

    # ── Asignaciones (tarea → recursos) ──────────────────────────────────────
    assignments_map: Dict[str, List[Dict]] = {}  # task_uid → [recursos]
    assignments_section = root.find(_tag("Assignments"))
    if assignments_section:
        for assign in assignments_section.findall(_tag("Assignment")):
            task_uid = assign.findtext(_tag("TaskUID"), "")
            res_uid = assign.findtext(_tag("ResourceUID"), "")
            work = assign.findtext(_tag("Work"), "")
            cost = assign.findtext(_tag("Cost"), "0")
            if task_uid not in assignments_map:
                assignments_map[task_uid] = []
            if res_uid in resource_map:
                assignments_map[task_uid].append({
                    "resource": resource_map[res_uid]["name"],
                    "group": resource_map[res_uid]["group"],
                    "rendimiento": resource_map[res_uid]["rendimiento"],
                    "work_hours": _parse_duration_hours(work),
                    "cost": float(cost) if cost else 0,
                })

    # ── Tareas → Nodos ConferSafe ─────────────────────────────────────────────
    nodes = []
    tasks_section = root.find(_tag("Tasks"))
    if not tasks_section:
        return {"project_info": project_info, "nodes": [], "resources": list(resource_map.values()), "summary": {}}

    # Mapa uid → task para resolver dependencias
    uid_to_task = {}
    for task in tasks_section.findall(_tag("Task")):
        uid = task.findtext(_tag("UID"), "")
        is_null = task.findtext(_tag("IsNull"), "0")
        if is_null == "1":
            continue
        uid_to_task[uid] = task

    for uid, task in uid_to_task.items():
        task_id = task.findtext(_tag("ID"), "0")
        name = task.findtext(_tag("Name"), "Sin nombre")
        wbs = task.findtext(_tag("WBS"), "")
        outline_level = int(task.findtext(_tag("OutlineLevel"), "1"))
        is_summary = task.findtext(_tag("Summary"), "0") == "1"
        is_milestone = task.findtext(_tag("Milestone"), "0") == "1"
        is_critical = task.findtext(_tag("Critical"), "0") == "1"
        percent_complete = int(task.findtext(_tag("PercentComplete"), "0"))

        start_str = task.findtext(_tag("Start"), "")
        finish_str = task.findtext(_tag("Finish"), "")
        duration_str = task.findtext(_tag("Duration"), "")
        cost_str = task.findtext(_tag("Cost"), "0")
        remaining_work_str = task.findtext(_tag("RemainingWork"), "")
        total_slack = int(task.findtext(_tag("TotalSlack"), "0"))

        finish_date = _parse_date(finish_str)
        start_date = _parse_date(start_str)
        duration_hours = _parse_duration_hours(duration_str)
        duration_days = math.ceil(duration_hours / 9) if duration_hours > 0 else 0  # 9h/día obra

        # Campos extendidos
        ext_attrs = _get_extended_attrs(task)
        rendimiento_diario = ext_attrs.get("rendimiento_diario", 0)
        costo_presupuestado = ext_attrs.get("costo_presupuestado", 0)
        fase_principal = ext_attrs.get("fase_principal", "")

        # Determinar estado inicial
        if percent_complete == 100 or is_milestone and finish_date and finish_date < date.today():
            status = "done"
        elif percent_complete > 0:
            status = "review"
        elif is_milestone:
            status = "pending"
        else:
            status = "pending"

        # Calcular días restantes
        remaining = _calc_remaining(finish_date)

        # Si está vencido y no completado → en riesgo
        if remaining is not None and remaining < 0 and status not in ("done", "approved"):
            status = "risk"

        # Dependencias (nodo padre = primer predecesor o nodo resumen padre)
        predecessors = []
        for pred_link in task.findall(_tag("PredecessorLink")):
            pred_uid = pred_link.findtext(_tag("PredecessorUID"), "")
            if pred_uid and pred_uid != "0":
                predecessors.append(pred_uid)

        # Parent: usar el primer predecesor directo como padre en el árbol
        # Para nodos de nivel 2+ que tienen padre summary, buscar el summary padre
        parent_id = None
        if outline_level > 1 and predecessors:
            parent_id = f"task_{predecessors[0]}"
        elif outline_level == 1:
            parent_id = None
        else:
            parent_id = None

        # Construir descripción enriquecida
        assigned_resources = assignments_map.get(uid, [])
        resource_names = [r["resource"] for r in assigned_resources]
        rendimientos = [r["rendimiento"] for r in assigned_resources if r["rendimiento"]]

        desc_parts = []
        if fase_principal:
            desc_parts.append(f"Fase: {fase_principal}")
        if duration_days > 0:
            desc_parts.append(f"Duración: {duration_days} días hábiles")
        if rendimiento_diario:
            desc_parts.append(f"Rendimiento diario: {rendimiento_diario}")
        if rendimientos:
            desc_parts.append(f"Productividad: {' | '.join(rendimientos)}")
        if resource_names:
            desc_parts.append(f"Recursos: {', '.join(resource_names[:3])}")
        if costo_presupuestado:
            desc_parts.append(f"Costo presupuestado: S/ {int(costo_presupuestado):,}")
        if is_summary:
            desc_parts.append("(Tarea resumen / fase)")
        if is_milestone:
            desc_parts.append("(Hito de control)")
        if _is_pre_operative(name):
            desc_parts.append("⚠️ Etapa pre-operativa — gestión antes del inicio de obra")

        desc = " | ".join(desc_parts) if desc_parts else name

        # Calcular impacto estimado (días de holgura libre = 0 en ruta crítica)
        impact_days = duration_days if is_critical and total_slack == 0 else max(0, duration_days // 3)
        impact_cost = float(cost_str) if cost_str else 0

        # Posición en el árbol visual
        x, y = _calc_layout_position(wbs, len(uid_to_task))

        # Determinar owner principal
        main_owner = ""
        if assigned_resources:
            # Preferir rol de gerencia/supervisión
            for r in assigned_resources:
                if r["group"] in ("Gerencia", "Tecnico", "Comision."):
                    main_owner = r["resource"]
                    break
            if not main_owner:
                main_owner = assigned_resources[0]["resource"]

        node = {
            "id": f"task_{uid}",
            "code": wbs,
            "title": name,
            "owner": main_owner or project_info["manager"] or "Sin asignar",
            "role": assigned_resources[0]["group"] if assigned_resources else "Equipo de obra",
            "due": _format_date(finish_date),
            "remaining": remaining,
            "status": status,
            "impactDays": impact_days,
            "impactCost": impact_cost,
            "critical": is_critical,
            "desc": desc,
            "parent": parent_id,
            "x": x,
            "y": y,
            # Metadatos extra para el agente RAG
            "_meta": {
                "wbs": wbs,
                "outline_level": outline_level,
                "is_summary": is_summary,
                "is_milestone": is_milestone,
                "is_pre_operative": _is_pre_operative(name),
                "fase": fase_principal,
                "duration_days": duration_days,
                "duration_hours": duration_hours,
                "rendimiento_diario": rendimiento_diario,
                "costo_presupuestado": costo_presupuestado,
                "percent_complete": percent_complete,
                "resources": assigned_resources,
                "predecessors": [f"task_{p}" for p in predecessors],
                "total_slack": total_slack,
            }
        }
        nodes.append(node)

    # ── Ordenar nodos por WBS ─────────────────────────────────────────────────
    def wbs_sort_key(n):
        parts = n["code"].split(".")
        return [int(p) if p.isdigit() else 0 for p in parts]

    nodes.sort(key=wbs_sort_key)

    # ── Estadísticas del proyecto ─────────────────────────────────────────────
    leaf_nodes = [n for n in nodes if not n["_meta"]["is_summary"]]
    critical_nodes = [n for n in leaf_nodes if n["critical"]]
    risk_nodes = [n for n in leaf_nodes if n["status"] == "risk"]
    milestone_nodes = [n for n in nodes if n["_meta"]["is_milestone"]]

    total_cost = sum(n["impactCost"] for n in leaf_nodes)
    total_duration = max((n["_meta"]["duration_days"] for n in leaf_nodes), default=0)

    summary = {
        "total_tasks": len(leaf_nodes),
        "total_phases": len([n for n in nodes if n["_meta"]["is_summary"] and n["_meta"]["outline_level"] == 2]),
        "total_milestones": len(milestone_nodes),
        "critical_tasks": len(critical_nodes),
        "risk_tasks": len(risk_nodes),
        "total_budget": total_cost,
        "project_start": project_info["start_date"],
        "project_finish": project_info["finish_date"],
        "resources_count": len(resource_map),
    }

    # ── RAG context — texto compacto para el agente ──────────────────────────
    rag_lines = [
        f"PROYECTO: {project_info['title']}",
        f"Empresa: {project_info['company']} | Director: {project_info['manager']}",
        f"Periodo: {project_info['start_date']} → {project_info['finish_date']}",
        f"Presupuesto total: S/ {int(total_cost):,}",
        "",
        "FASES Y TAREAS PRINCIPALES:",
    ]

    for n in nodes:
        if n["_meta"]["outline_level"] <= 3:
            indent = "  " * (n["_meta"]["outline_level"] - 1)
            milestone_tag = " [HITO]" if n["_meta"]["is_milestone"] else ""
            critical_tag = " [CRÍTICO]" if n["critical"] else ""
            pre_op_tag = " [PRE-OPERATIVO]" if n["_meta"]["is_pre_operative"] else ""
            rend = f" | Rend: {n['_meta']['rendimiento_diario']}" if n["_meta"]["rendimiento_diario"] else ""
            cost = f" | S/{int(n['_meta']['costo_presupuestado']):,}" if n["_meta"]["costo_presupuestado"] else ""
            rag_lines.append(
                f"{indent}{n['code']} {n['title']}{milestone_tag}{critical_tag}{pre_op_tag}"
                f" | {n['due'] or 'sin fecha'}{rend}{cost}"
            )

    rag_lines.append("")
    rag_lines.append("RECURSOS Y RENDIMIENTOS:")
    for r in resource_map.values():
        if r["rendimiento"]:
            rag_lines.append(f"  {r['name']} ({r['group']}): {r['rendimiento']}")

    return {
        "project_info": project_info,
        "nodes": nodes,
        "resources": list(resource_map.values()),
        "summary": summary,
        "rag_context": "\n".join(rag_lines),
    }


def nodes_to_frontend_format(nodes: List[Dict]) -> List[Dict]:
    """
    Limpia los metadatos internos (_meta) antes de enviar al frontend.
    """
    clean = []
    for n in nodes:
        node_copy = {k: v for k, v in n.items() if k != "_meta"}
        clean.append(node_copy)
    return clean
