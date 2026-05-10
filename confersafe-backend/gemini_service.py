"""
gemini_service.py — Confi's brain powered by Google Gemini.

Responsibilities:
  1. Build a rich system prompt with construction-specific expertise.
  2. Inject project context (nodes, risks, deadlines) into every call.
  3. Parse Gemini's response into the structured AgentResponse format.
  4. Detect intent and classify urgency (matching the frontend's logic).
"""

import os
import json
import re
from datetime import datetime
from typing import List, Optional
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

# ── Config ─────────────────────────────────────────────────────────────────────
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

# 3. (Opcional) Agregar impresiones de confirmación para depuración
print(f"[ConferSafe] .env path: {Path(__file__).parent / '.env'}")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Confirmar si la clave se cargó correctamente
print(f"[ConferSafe] GEMINI_API_KEY cargada: {'SI ✔' if GEMINI_API_KEY else 'NO ✘'}")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    _model = genai.GenerativeModel(
        model_name="gemini-3-flash-preview",
        generation_config=genai.GenerationConfig(
            temperature=0.4,
            top_p=0.9,
            max_output_tokens=2048,
        ),
    )
else:
    _model = None

# ── Urgency helper (mirrors frontend decisionGraph.js) ─────────────────────────

def urgency_of(node: dict) -> str:
    status    = node.get("status", "pending")
    remaining = node.get("remaining") if node.get("remaining") is not None else node.get("remaining")
    if status == "risk" or (remaining is not None and remaining < 0):
        return "critical"
    if remaining is not None and remaining <= 4:
        return "soon"
    if remaining is not None and remaining <= 10:
        return "review"
    return "ok"


def total_impact(nodes: List[dict]) -> dict:
    days = sum(n.get("impactDays", n.get("impact_days", 0)) for n in nodes)
    cost = sum(n.get("impactCost", n.get("impact_cost", 0)) for n in nodes)
    return {"days": int(days), "cost": float(cost)}


def fmt_soles(n: float) -> str:
    return f"{int(n):,}".replace(",", ".")


# ── Intent detection (mirrors frontend assistantService.js) ───────────────────

INTENTS = [
    ("contratista", ["contratista", "empresa", "constructor", "adjudicaci", "licitaci", "propuesta"]),
    ("proveedor",   ["proveedor", "concreto", "acero", "material", "suministro", "insumo", "compra"]),
    ("permisos",    ["permiso", "licencia", "municipal", "autoriza", "tramite", "trámite", "legal"]),
    ("riesgo",      ["riesgo", "problema", "retraso", "demora", "peligro", "vence", "venci", "alert"]),
    ("resumen",     ["resumen", "estado", "overview", "cómo", "como", "semana", "hoy", "situaci"]),
]

def detect_intent(query: str) -> str:
    q = query.lower()
    for intent, keywords in INTENTS:
        if any(kw in q for kw in keywords):
            return intent
    return "resumen"


# ── System prompt ──────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """Eres **Confi**, el asesor experto en gestión de proyectos de construcción civil de ConferSafe.

## Tu personalidad
- Hablas en español, con un tono profesional pero **conversacional y fluido**.
- No saludes siempre de la misma forma. Si te preguntan tu nombre, responde amablemente y luego pasa al análisis.
- **Evita sonar como un robot que lee datos.** En lugar de decir "El avance es 33%", di "Vamos por un tercio del camino, pero tenemos algunos cuellos de botella".
- Eres directo y  concreto si hay alguna falta grave o algo urgente.
- Conoces profundamente la normativa peruana de construcción (RNE, INVIERTE.PE, OSCE, SUNARP).
- Entiendes la metodología de Ruta Crítica (CPM/PERT) y gestión de riesgos en obra.

## Tu objetivo
Analizar el estado actual del proyecto y dar recomendaciones accionables para evitar retrasos y sobrecostos.

## Formato de respuesta
Responde SIEMPRE con un JSON válido con esta estructura exacta (sin markdown, sin explicaciones fuera del JSON):

{
  "intent": "<contratista|proveedor|permisos|riesgo|resumen>",
  "summary": "<resumen ejecutivo de 2-3 oraciones>",
  "critical_decisions": [
    {
      "id": "<node_id>",
      "urgency_reason": "<por qué es urgente>",
      "suggested_action": "<acción concreta esta semana>"
    }
  ],
  "risk_message": "<predicción de riesgo específica con números>",
  "affected_days": <número>,
  "affected_cost": <número>,
  "suggestions": [
    "<paso concreto 1>",
    "<paso concreto 2>",
    "<paso concreto 3>"
  ],
  "actions": [
    {
      "nodeId": "<id>",
      "newStatus": "<pending|review|approved|risk|done>",
      "label": "<etiqueta del botón>"
    }
  ]
}

## Reglas
- Tu `summary` debe ser la respuesta directa a lo que el usuario preguntó.
- Si el usuario solo dice "hola" o te pregunta quién eres, sé breve y amigable en el `summary`, pero igual llena los datos técnicos del JSON de forma silenciosa para que el frontend tenga qué mostrar.
- **IMPORTANTE**: No repitas datos que ya aparecen en los cuadros inferiores dentro de tu mensaje de texto principal.
- `affected_days` y `affected_cost` deben ser números, no strings.
- `actions` solo incluye nodos que realmente necesitan cambio de estado HOY.
- Máximo 3 elementos en `critical_decisions`.
- Máximo 3 elementos en `actions`.
- Las sugerencias deben ser específicas: menciona nombres de responsables, fechas concretas, normativa aplicable.
"""


# ── Context builder ────────────────────────────────────────────────────────────

def build_project_context(project_id: str, nodes: List[dict]) -> str:
    """
    Summarize the current project state into a compact text block
    that Gemini can reason about.
    """
    today = datetime.now().strftime("%d/%m/%Y")

    risk_nodes    = [n for n in nodes if n.get("status") == "risk"]
    pending_nodes = [n for n in nodes if n.get("status") == "pending"]
    review_nodes  = [n for n in nodes if n.get("status") == "review"]
    done_nodes    = [n for n in nodes if n.get("status") in ("approved", "done")]
    critical_nodes= [n for n in nodes if n.get("critical")]

    impact = total_impact([n for n in nodes if n.get("status") in ("risk", "pending")])

    lines = [
        f"=== PROYECTO: {project_id} | Fecha hoy: {today} ===",
        f"Total decisiones: {len(nodes)} | Completadas: {len(done_nodes)} | En riesgo: {len(risk_nodes)} | Pendientes: {len(pending_nodes)} | En revisión: {len(review_nodes)}",
        f"Impacto acumulado no resuelto: {impact['days']} días | S/ {fmt_soles(impact['cost'])}",
        "",
        "--- DECISIONES EN RIESGO (CRÍTICAS) ---",
    ]

    for n in sorted(risk_nodes, key=lambda x: x.get("remaining", 0) or 0):
        remaining = n.get("remaining")
        rem_txt = f"{abs(remaining)}d vencida" if remaining is not None and remaining < 0 else f"{remaining}d restantes"
        lines.append(
            f"  [{n.get('code','?')}] {n.get('title','')} | Resp: {n.get('owner','')} | {rem_txt} | "
            f"Impacto: {n.get('impactDays', n.get('impact_days',0))}d / S/{fmt_soles(n.get('impactCost', n.get('impact_cost',0)))}"
        )

    lines.append("")
    lines.append("--- DECISIONES URGENTES (≤ 7 días) ---")
    urgent = [n for n in pending_nodes + review_nodes
              if n.get("remaining") is not None and 0 <= n.get("remaining") <= 7]
    for n in sorted(urgent, key=lambda x: x.get("remaining", 0)):
        lines.append(
            f"  [{n.get('code','?')}] {n.get('title','')} | Resp: {n.get('owner','')} | "
            f"{n.get('remaining')}d restantes | Impacto: {n.get('impactDays', n.get('impact_days',0))}d"
        )

    lines.append("")
    lines.append("--- RUTA CRÍTICA ---")
    for n in critical_nodes:
        status = n.get("status", "?")
        remaining = n.get("remaining")
        rem_txt = "sin fecha" if remaining is None else (
            f"{abs(remaining)}d vencida" if remaining < 0 else f"{remaining}d"
        )
        lines.append(f"  [{n.get('code','?')}] {n.get('title','')} | Estado: {status} | {rem_txt}")

    lines.append("")
    lines.append("--- TODAS LAS DECISIONES (resumen) ---")
    for n in nodes:
        remaining = n.get("remaining")
        rem_txt = "—" if remaining is None else (
            f"{abs(remaining)}d vencida" if remaining < 0 else f"{remaining}d"
        )
        parent_id = n.get("parent") or n.get("parent_id")
        lines.append(
            f"  [{n.get('code','?')}] {n.get('title','')} | {n.get('status','')} | "
            f"Resp: {n.get('owner','')} | {rem_txt} | Padre: {parent_id or 'raíz'}"
        )

    return "\n".join(lines)


# ── Gemini call ────────────────────────────────────────────────────────────────

async def call_gemini(
    query: str,
    project_id: str,
    nodes: List[dict],
    conversation_history: Optional[List[dict]] = None,
) -> dict:
    """
    Main entry point. Returns a structured dict matching AgentResponse schema.
    Falls back to a deterministic response if Gemini is unavailable.
    """
    intent = detect_intent(query)

    if not _model:
        return _fallback_response(query, intent, nodes)

    context = build_project_context(project_id, nodes)

    # Build Gemini conversation history (last 4 turns for context)
    history = conversation_history or []
    history = history[-8:] if len(history) > 8 else history  # keep last 4 exchanges

    gemini_history = []
    for turn in history:
        role = "user" if turn.get("role") == "user" else "model"
        gemini_history.append({"role": role, "parts": [turn.get("content", "")]})

    full_prompt = f"{SYSTEM_PROMPT}\n\n{context}\n\nPREGUNTA DEL USUARIO: {query}"

    try:
        if gemini_history:
            chat = _model.start_chat(history=gemini_history)
            response = chat.send_message(full_prompt)
        else:
            response = _model.generate_content(full_prompt)

        raw_text = response.text.strip()
        print(f"[Gemini OK] {len(raw_text)} chars")
        print(f"[Gemini RAW] {raw_text[:400]}")
        return _parse_gemini_response(raw_text, query, intent, nodes)

    except Exception as e:
        import traceback
        print(f"[Gemini ERROR] {type(e).__name__}: {e}")
        traceback.print_exc()
        return _fallback_response(query, intent, nodes, error=str(e))


# ── Response parser ────────────────────────────────────────────────────────────

def _parse_gemini_response(raw: str, query: str, intent: str, nodes: List[dict]) -> dict:
    """
    Parse Gemini's JSON output and enrich with urgency classification.
    Falls back gracefully if parsing fails.
    """
    # Strip markdown code fences if present
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()

    # Find the JSON object
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        return _fallback_response(query, intent, nodes, raw=raw)

    try:
        data = json.loads(match.group())
    except json.JSONDecodeError:
        return _fallback_response(query, intent, nodes, raw=raw)

    node_map = {n.get("id"): n for n in nodes}

    # Enrich critical_decisions with real node data
    critical_decisions = []
    for cd in data.get("critical_decisions", []):
        node = node_map.get(cd.get("id"))
        if not node:
            # Try to find by matching title fragment
            for n in nodes:
                if cd.get("id", "").lower() in n.get("title", "").lower():
                    node = n
                    break
        if node:
            critical_decisions.append({
                "id": node["id"],
                "code": node.get("code"),
                "title": node.get("title", ""),
                "owner": node.get("owner", ""),
                "status": node.get("status", "pending"),
                "remaining": node.get("remaining"),
                "impactDays": node.get("impactDays", node.get("impact_days", 0)),
                "impactCost": node.get("impactCost", node.get("impact_cost", 0)),
                "urgency": urgency_of(node),
            })

    # If Gemini gave no critical decisions, auto-pick the most urgent
    if not critical_decisions:
        critical_decisions = _auto_pick_critical(nodes)

    # Build actions — validate nodes exist and state change makes sense
    actions = []
    for a in data.get("actions", []):
        node = node_map.get(a.get("nodeId"))
        if node and node.get("status") not in ("approved", "done") and node.get("status") != a.get("newStatus"):
            actions.append({
                "type": "changeStatus",
                "nodeId": a["nodeId"],
                "newStatus": a.get("newStatus", "review"),
                "label": a.get("label", f"Actualizar — {node.get('title','')[:30]}"),
            })

    impact = total_impact([n for n in nodes if n.get("status") in ("risk", "pending")])

    return {
        "query": query,
        "intent": data.get("intent", intent),
        "summary": data.get("summary", ""),
        "criticalDecisions": critical_decisions[:3],
        "riskPrediction": {
            "message": data.get("risk_message", ""),
            "affectedDays": int(data.get("affected_days", impact["days"])),
            "affectedCost": float(data.get("affected_cost", impact["cost"])),
        },
        "suggestions": data.get("suggestions", [])[:3],
        "actions": actions[:3],
        "timestamp": datetime.now().isoformat(),
        "raw_gemini_response": raw,
    }


def _auto_pick_critical(nodes: List[dict], max_n: int = 3) -> List[dict]:
    order = {"critical": 0, "soon": 1, "review": 2, "ok": 3}
    sorted_nodes = sorted(
        [n for n in nodes if n.get("status") not in ("approved", "done")],
        key=lambda n: (order.get(urgency_of(n), 3), n.get("remaining", 999) or 999)
    )
    result = []
    for n in sorted_nodes[:max_n]:
        result.append({
            "id": n["id"],
            "code": n.get("code"),
            "title": n.get("title", ""),
            "owner": n.get("owner", ""),
            "status": n.get("status", "pending"),
            "remaining": n.get("remaining"),
            "impactDays": n.get("impactDays", n.get("impact_days", 0)),
            "impactCost": n.get("impactCost", n.get("impact_cost", 0)),
            "urgency": urgency_of(n),
        })
    return result


# ── Fallback (when Gemini is not available) ────────────────────────────────────

def _fallback_response(
    query: str, intent: str, nodes: List[dict],
    error: str = "", raw: str = ""
) -> dict:
    """
    Deterministic response mirroring the original frontend logic.
    Used when GEMINI_API_KEY is missing or the API call fails.
    """
    risk_nodes = [n for n in nodes if n.get("status") == "risk"]
    impact = total_impact([n for n in nodes if n.get("status") in ("risk", "pending")])
    done   = [n for n in nodes if n.get("status") in ("approved", "done")]
    critical= [n for n in nodes if n.get("critical") and n.get("status") not in ("approved", "done")]

    progress_pct = round(len(done) / len(nodes) * 100) if nodes else 0

    critical_decisions = _auto_pick_critical(nodes)

    # Intent-specific messages
    summaries = {
        "contratista": "El proceso de selección del contratista tiene alertas activas. El retraso en la verificación de referencias puede bloquear la adjudicación esta semana.",
        "proveedor":   "Hay proveedores críticos pendientes de confirmar. El retraso en materiales puede impactar el inicio de obra.",
        "permisos":    "Los permisos municipales están en revisión. La licencia de edificación depende de trámites aún no cerrados.",
        "riesgo":      f"Hay {len(risk_nodes)} decisión(es) en estado crítico. Impacto acumulado si no se actúa: {impact['days']} días y S/ {fmt_soles(impact['cost'])}.",
        "resumen":     f"El proyecto lleva un {progress_pct}% de decisiones cerradas. Esta semana hay {len(critical)} nodos en la ruta crítica que necesitan atención.",
    }

    risk_msgs = {
        "contratista": f"La verificación de referencias vencida puede retrasar la adjudicación. Impacto acumulado: {impact['days']}d / S/{fmt_soles(impact['cost'])}.",
        "proveedor":   f"Sin proveedor de concreto confirmado, el inicio de vaciado se corre. Riesgo: {impact['days']}d / S/{fmt_soles(impact['cost'])}.",
        "permisos":    f"Los parámetros urbanísticos pendientes bloquean la licencia. Impacto: {impact['days']}d / S/{fmt_soles(impact['cost'])}.",
        "riesgo":      f"El mayor riesgo activo involucra {len(risk_nodes)} decisión(es) vencidas. Total: {impact['days']}d / S/{fmt_soles(impact['cost'])}.",
        "resumen":     f"El riesgo acumulado no resuelto es de {impact['days']} días y S/ {fmt_soles(impact['cost'])}.",
    }

    suggestions_map = {
        "contratista": [
            "Contactar a Daniela Cáceres hoy para obtener el informe de referencias.",
            "Convocar al comité técnico para dictamen de propuestas antes del viernes.",
            "Revisar cláusulas de penalidad en los contratos tipo antes de adjudicar.",
        ],
        "proveedor": [
            "Pedir a Andrea Núñez el cuadro comparativo de cotizaciones de concreto.",
            "Negociar precio fijo por m³ para los primeros 3 meses con la planta más cercana.",
            "Confirmar el proveedor de acero antes del plazo para no afectar el cronograma.",
        ],
        "permisos": [
            "Validar con Valeria Torres si el expediente fue admitido sin observaciones.",
            "Solicitar reunión con el revisor de la Municipalidad esta semana.",
            "Preparar planos de conformidad antes de que la licencia entre a revisión de campo.",
        ],
        "riesgo": [
            f"Contactar al responsable de la decisión más crítica para obtener un estado hoy.",
            "Escalar al director de proyecto si no hay respuesta antes del mediodía.",
            "Revisar el árbol de decisiones para ver qué tareas quedan bloqueadas.",
        ],
        "resumen": [
            "Enfocarse primero en cerrar la verificación de referencias del contratista.",
            "Confirmar el proveedor de concreto para no dejar sin materiales el inicio de obra.",
            "Solicitar avance de la licencia de edificación a la gestora legal.",
        ],
    }

    # Auto actions
    actions = []
    for n in risk_nodes[:2]:
        if n.get("status") != "review":
            actions.append({
                "type": "changeStatus",
                "nodeId": n["id"],
                "newStatus": "review",
                "label": f"Reactivar — {n.get('title','')[:35]}",
            })

    return {
        "query": query,
        "intent": intent,
        "summary": summaries.get(intent, summaries["resumen"]),
        "criticalDecisions": critical_decisions,
        "riskPrediction": {
            "message": risk_msgs.get(intent, risk_msgs["resumen"]),
            "affectedDays": impact["days"],
            "affectedCost": impact["cost"],
        },
        "suggestions": suggestions_map.get(intent, suggestions_map["resumen"]),
        "actions": actions[:3],
        "timestamp": datetime.now().isoformat(),
        "raw_gemini_response": raw or f"[Fallback — Gemini no disponible: {error}]",
    }
