"""
gemini_service.py — Confi's brain powered by Google Gemini.

v2 — Intent Routing:
  CASO A: Consulta de datos del proyecto → RAG Local (datos reales del XML/nodos)
  CASO B: Consulta técnica de ingeniería → Conocimiento general + contexto obra
  BLOQUEO: Consultas pre-operativas → Rechazo amable con redireccionamiento
"""

import os
import json
import re
from datetime import datetime
from typing import List, Optional, Dict
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

print(f"[ConferSafe] .env path: {Path(__file__).parent / '.env'}")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
print(f"[ConferSafe] GEMINI_API_KEY cargada: {'SI ✔' if GEMINI_API_KEY else 'NO ✘'}")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    _model = genai.GenerativeModel(
        model_name="gemini-3.1-flash-lite",
        generation_config=genai.GenerationConfig(
            temperature=0.4,
            top_p=0.9,
            max_output_tokens=2048,
        ),
    )
    print("[ConferSafe] Modelo Gemini inicializado ✔")
else:
    _model = None
    print("[ConferSafe] Modo fallback — sin Gemini")


# ── Clasificación de intents ────────────────────────────────────────────────────

# CASO A: consultas sobre datos específicos del proyecto
PROJECT_DATA_KEYWORDS = [
    "partida", "excavaci", "cimentaci", "estructura", "sotano", "sotano",
    "piso", "nivel", "fase", "cronograma", "plazo", "fecha", "termina",
    "cuándo", "cuando", "cuánto cuesta", "presupuesto", "costo", "recurso",
    "rendimiento", "cuadrilla", "avance", "porcentaje", "tarea", "hito",
    "instalaci", "acabado", "concreto", "acero", "vaciado", "encofrado",
    "hvac", "sanitaria", "electrica", "contraincendio", "muro pantalla",
    "topografia", "replanteo", "mileston", "wbs", "ruta critica", "holgura",
    "inicio de obra", "entrega", "semana", "dias", "dias restantes",
    "cuántas semanas", "cuántos dias", "cuántos dias",
]

# CASO B: consultas técnicas de ingeniería (conocimiento general)
ENGINEERING_KEYWORDS = [
    "norma", "rne", "e.030", "e.060", "e.020", "astm", "aci", "iso",
    "segregacion", "curado", "fragua", "slump", "asentamiento", "concreto en clima",
    "patologia", "fisura", "grieta", "corrosion", "refuerzo", "diseño estructural",
    "calculo", "formula", "especificacion", "procedimiento constructivo",
    "encofrado tipo", "vibrado", "compactacion", "proctor", "cbr",
    "nivel freatico", "estabilizacion", "geotecnia", "ensayo",
    "como se hace", "como resuelvo", "que dice la norma", "que recomienda",
    "mejores practicas", "tecnica", "metodo",
]

# BLOQUEO: fases pre-operativas (fuera del scope del MVP)
PRE_OPERATIVE_KEYWORDS = [
    "diseño arquitectonico", "diseño arquitectónico", "planos arquitectonicos",
    "licencia de construccion", "licencia municipal", "tramite municipal",
    "permiso de construccion", "expediente tecnico", "estudio de suelos fase",
    "anteproyecto", "proyecto de inversion", "snip", "invierte.pe fase",
    "estudios previos", "factibilidad", "perfil de proyecto",
    "licitacion de diseño", "concurso de diseño",
]

CONSTRUCTION_INTENTS = [
    ("contratista", ["contratista", "empresa", "constructor", "adjudicaci", "licitaci", "propuesta"]),
    ("proveedor",   ["proveedor", "concreto", "acero", "material", "suministro", "insumo", "compra"]),
    ("riesgo",      ["riesgo", "problema", "retraso", "demora", "peligro", "vence", "venci", "alert", "critico"]),
    ("resumen",     ["resumen", "estado", "overview", "cómo", "como", "semana", "hoy", "situaci", "hola", "quien eres"]),
]


def classify_query(query: str) -> str:
    """
    Clasifica la consulta en uno de tres routing modes:
    - 'rag_local': consulta de datos del proyecto (Caso A)
    - 'engineering': consulta técnica de ingeniería (Caso B)
    - 'blocked': consulta pre-operativa (bloquear)
    - 'general': consulta general del proyecto
    """
    q = query.lower()

    # Primero verificar bloqueo
    if any(kw in q for kw in PRE_OPERATIVE_KEYWORDS):
        return "blocked"

    # Luego verificar si es técnica de ingeniería
    if any(kw in q for kw in ENGINEERING_KEYWORDS):
        return "engineering"

    # Luego verificar si es sobre datos del proyecto
    if any(kw in q for kw in PROJECT_DATA_KEYWORDS):
        return "rag_local"

    return "general"


def detect_intent(query: str) -> str:
    q = query.lower()
    for intent, keywords in CONSTRUCTION_INTENTS:
        if any(kw in q for kw in keywords):
            return intent
    return "resumen"


# ── System prompts por modo ────────────────────────────────────────────────────

SYSTEM_PROMPT_RAG = """Eres **Confi**, el asistente de control de obra de ConferSafe.

## Modo activo: CONSULTA DE DATOS DEL PROYECTO (RAG Local)

En este modo, responde ÚNICAMENTE con información extraída de los datos reales del proyecto que se te proporcionan.
NO inventes fechas, costos, rendimientos ni recursos. Si no encuentras el dato, dilo claramente.

## Reglas de este modo
- Cita los datos exactos: fechas, costos en S/, rendimientos, nombres de recursos.
- Si preguntan por una partida específica, busca en el contexto y responde con precisión.
- Si el dato no está en el contexto, di "No tengo ese dato en el cronograma cargado".
- Sé específico: "La partida A08 Excavación masiva inicia el 10/09/2026 y termina el 26/10/2026, con la Cuadrilla de Excavación + Volquetes a S/ 1,116,356".

## Formato de respuesta (JSON estricto, sin markdown):
{
  "intent": "rag_local",
  "summary": "<respuesta directa con datos exactos del proyecto>",
  "critical_decisions": [],
  "risk_message": "<riesgos específicos si los hay>",
  "affected_days": 0,
  "affected_cost": 0,
  "suggestions": ["<acción concreta basada en los datos>"],
  "actions": []
}
"""

SYSTEM_PROMPT_ENGINEERING = """Eres **Confi**, el asistente de control de obra de ConferSafe.

## Modo activo: CONSULTA TÉCNICA DE INGENIERÍA

En este modo puedes usar tu conocimiento general de ingeniería civil y construcción, pero SIEMPRE aplicándolo al contexto específico de la obra en ejecución.

## Reglas de este modo
- Responde con fundamento técnico: cita normas (RNE, ACI, ASTM) cuando sea relevante.
- Aplica la respuesta al contexto de la obra que se describe en los datos del proyecto.
- Sé práctico: el PM necesita saber qué hacer HOY en campo, no un ensayo académico.
- Menciona riesgos específicos para el proyecto si la consulta los implica.
- Ejemplos de consultas válidas: "¿Cómo resuelvo una segregación en columna?", "¿Qué dice el RNE sobre curado en clima cálido?", "¿Cuál es el slump adecuado para losas de entrepiso?".

## Formato de respuesta (JSON estricto, sin markdown):
{
  "intent": "engineering",
  "summary": "<respuesta técnica directa aplicada al contexto de la obra>",
  "critical_decisions": [],
  "risk_message": "<implicaciones de riesgo para el proyecto si aplica>",
  "affected_days": 0,
  "affected_cost": 0,
  "suggestions": [
    "<paso 1 concreto para aplicar en campo>",
    "<paso 2 con referencia normativa si aplica>",
    "<paso 3>"
  ],
  "actions": []
}
"""

SYSTEM_PROMPT_GENERAL = """Eres **Confi**, el asesor experto en gestión de proyectos de construcción civil de ConferSafe.

## Tu personalidad
- Hablas en español, tono profesional pero conversacional y fluido.
- No saludes siempre de la misma forma. Sé natural.
- Eres directo y concreto, especialmente cuando hay algo urgente.
- Conoces la normativa peruana: RNE, INVIERTE.PE, OSCE, SUNARP.
- Dominas CPM/PERT y gestión de riesgos en obra.

## Tu objetivo
Analizar el estado actual del proyecto y dar recomendaciones accionables para evitar retrasos y sobrecostos en la EJECUCIÓN de obra.

## Scope del sistema
ConferSafe está optimizado para la FASE DE EJECUCIÓN (construcción). Si te preguntan sobre fases pre-operativas (diseño, licencias, permisos antes del inicio), redirige amablemente hacia el control de ejecución.

## Formato de respuesta (JSON estricto, sin markdown):
{
  "intent": "<contratista|proveedor|riesgo|resumen>",
  "summary": "<2-3 oraciones, respuesta directa a lo preguntado>",
  "critical_decisions": [
    {
      "id": "<node_id>",
      "urgency_reason": "<por qué es urgente>",
      "suggested_action": "<acción concreta>"
    }
  ],
  "risk_message": "<predicción de riesgo con números>",
  "affected_days": <número>,
  "affected_cost": <número>,
  "suggestions": ["<paso 1>", "<paso 2>", "<paso 3>"],
  "actions": [
    {
      "nodeId": "<id>",
      "newStatus": "<pending|review|approved|risk|done>",
      "label": "<etiqueta>"
    }
  ]
}

## Reglas
- Si el usuario solo saluda o pregunta quién eres, sé breve y amigable en summary.
- No repitas datos que ya aparecen en los cuadros del frontend.
- affected_days y affected_cost son números, no strings.
- Máximo 3 critical_decisions y 3 actions.
- Sugerencias con nombres reales de responsables y fechas concretas cuando estén disponibles.
"""

BLOCKED_RESPONSE_TEMPLATE = {
    "intent": "blocked",
    "summary": "Esta consulta está relacionada con fases pre-operativas (diseño, licencias, trámites municipales previos al inicio de obra). ConferSafe está optimizado para el control de la EJECUCIÓN de obra — desde el Hito de Inicio hasta la Entrega Final. Para esa fase, puedo ayudarte a monitorear partidas, rendimientos, riesgos en campo y decisiones críticas de construcción.",
    "critical_decisions": [],
    "risk_message": "Redirige la consulta al control de ejecución para obtener valor real del sistema.",
    "affected_days": 0,
    "affected_cost": 0,
    "suggestions": [
        "Consulta el estado de las partidas de ejecución activas.",
        "Pregúntame por rendimientos de cuadrillas o costos de fases constructivas.",
        "Revisa qué decisiones críticas de obra están próximas a vencer.",
    ],
    "actions": [],
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def urgency_of(node: dict) -> str:
    status = node.get("status", "pending")
    remaining = node.get("remaining")
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


# ── Context builder ────────────────────────────────────────────────────────────

def build_project_context(project_id: str, nodes: List[dict], rag_context: Optional[str] = None) -> str:
    today = datetime.now().strftime("%d/%m/%Y")

    # Si hay contexto RAG del XML, úsalo como base
    if rag_context:
        lines = [
            f"=== DATOS DEL PROYECTO: {project_id} | Hoy: {today} ===",
            rag_context,
            "",
            "=== ESTADO ACTUAL DE DECISIONES ===",
        ]
    else:
        risk_nodes = [n for n in nodes if n.get("status") == "risk"]
        pending_nodes = [n for n in nodes if n.get("status") == "pending"]
        done_nodes = [n for n in nodes if n.get("status") in ("approved", "done")]
        impact = total_impact([n for n in nodes if n.get("status") in ("risk", "pending")])
        lines = [
            f"=== PROYECTO: {project_id} | Hoy: {today} ===",
            f"Decisiones: {len(nodes)} total | {len(done_nodes)} completadas | {len(risk_nodes)} en riesgo | {len(pending_nodes)} pendientes",
            f"Impacto acumulado: {impact['days']}d / S/{fmt_soles(impact['cost'])}",
            "",
        ]

    # Siempre incluir estado de nodos críticos
    risk_nodes = [n for n in nodes if n.get("status") == "risk"]
    urgent = [n for n in nodes if n.get("remaining") is not None and 0 <= (n.get("remaining") or 0) <= 7]
    critical = [n for n in nodes if n.get("critical")]

    if risk_nodes:
        lines.append("EN RIESGO:")
        for n in risk_nodes[:5]:
            rem = n.get("remaining", 0)
            rem_txt = f"{abs(rem)}d vencida" if rem is not None and rem < 0 else f"{rem}d"
            lines.append(f"  [{n.get('code','?')}] {n.get('title','')} | {n.get('owner','')} | {rem_txt} | S/{fmt_soles(n.get('impactCost', n.get('impact_cost', 0)))}")

    if urgent:
        lines.append("URGENTES (≤7d):")
        for n in urgent[:5]:
            lines.append(f"  [{n.get('code','?')}] {n.get('title','')} | {n.get('remaining')}d")

    if critical:
        lines.append("RUTA CRÍTICA:")
        for n in critical[:8]:
            rem = n.get("remaining")
            rem_txt = "—" if rem is None else (f"{abs(rem)}d vencida" if rem < 0 else f"{rem}d")
            lines.append(f"  [{n.get('code','?')}] {n.get('title','')} | {n.get('status','')} | {rem_txt}")

    return "\n".join(lines)


# ── Main Gemini call ───────────────────────────────────────────────────────────

async def call_gemini(
    query: str,
    project_id: str,
    nodes: List[dict],
    conversation_history: Optional[List[dict]] = None,
    rag_context: Optional[str] = None,
    attachments: Optional[List[dict]] = None,
) -> dict:
    """
    Punto de entrada principal con routing de intents.
    """
    routing_mode = classify_query(query)
    intent = detect_intent(query)

    print(f"[Confi] Query: '{query[:60]}' → Routing: {routing_mode}")

    # BLOQUEO: consultas pre-operativas
    if routing_mode == "blocked":
        response = dict(BLOCKED_RESPONSE_TEMPLATE)
        response["timestamp"] = datetime.now().isoformat()
        response["query"] = query
        return response

    if not _model:
        return _fallback_response(query, intent, nodes)

    # Seleccionar system prompt según routing
    if routing_mode == "rag_local":
        system_prompt = SYSTEM_PROMPT_RAG
    elif routing_mode == "engineering":
        system_prompt = SYSTEM_PROMPT_ENGINEERING
    else:
        system_prompt = SYSTEM_PROMPT_GENERAL

    context = build_project_context(project_id, nodes, rag_context)

    # Historial de conversación (últimos 4 turnos)
    history = (conversation_history or [])[-8:]
    gemini_history = [
        {"role": "user" if t.get("role") == "user" else "model", "parts": [t.get("content", "")]}
        for t in history
    ]

    full_prompt = f"{system_prompt}\n\n{context}\n\nPREGUNTA DEL USUARIO: {query}"

    # Preparar el contenido (multimodal si hay adjuntos)
    # Preparar el contenido (multimodal si hay adjuntos)
    if attachments:
        import base64
        contents = []
        for att in attachments:
            try:
                file_data = base64.b64decode(att["base64"])
                contents.append({
                    "mime_type": att["mime_type"],
                    "data": file_data
                })
            except Exception as e:
                print(f"[Attachment Error] Failed to decode base64: {e}")
        contents.append(full_prompt)
    else:
        contents = full_prompt

    try:
        if gemini_history:
            chat = _model.start_chat(history=gemini_history)
            response = chat.send_message(contents)
        else:
            response = _model.generate_content(contents)

        raw_text = response.text.strip()
        print(f"[Gemini OK] {routing_mode} | {len(raw_text)} chars")
        print(f"[Gemini RAW] {raw_text[:300]}...")
        return _parse_gemini_response(raw_text, query, intent, nodes)

    except Exception as e:
        import traceback
        print(f"[Gemini ERROR] {type(e).__name__}: {e}")
        traceback.print_exc()
        return _fallback_response(query, intent, nodes, error=str(e))


# ── Response parser ────────────────────────────────────────────────────────────

def _parse_gemini_response(raw: str, query: str, intent: str, nodes: List[dict]) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        return _fallback_response(query, intent, nodes, raw=raw)

    try:
        data = json.loads(match.group())
    except json.JSONDecodeError:
        return _fallback_response(query, intent, nodes, raw=raw)

    node_map = {n.get("id"): n for n in nodes}

    critical_decisions = []
    for cd in data.get("critical_decisions", []):
        node = node_map.get(cd.get("id"))
        if not node:
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

    if not critical_decisions and data.get("intent") not in ("rag_local", "engineering", "blocked"):
        critical_decisions = _auto_pick_critical(nodes)

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
    return [
        {
            "id": n["id"],
            "code": n.get("code"),
            "title": n.get("title", ""),
            "owner": n.get("owner", ""),
            "status": n.get("status", "pending"),
            "remaining": n.get("remaining"),
            "impactDays": n.get("impactDays", n.get("impact_days", 0)),
            "impactCost": n.get("impactCost", n.get("impact_cost", 0)),
            "urgency": urgency_of(n),
        }
        for n in sorted_nodes[:max_n]
    ]


# ── Fallback ───────────────────────────────────────────────────────────────────

def _fallback_response(query: str, intent: str, nodes: List[dict], error: str = "", raw: str = "") -> dict:
    risk_nodes = [n for n in nodes if n.get("status") == "risk"]
    impact = total_impact([n for n in nodes if n.get("status") in ("risk", "pending")])
    done = [n for n in nodes if n.get("status") in ("approved", "done")]
    critical = [n for n in nodes if n.get("critical") and n.get("status") not in ("approved", "done")]
    progress_pct = round(len(done) / len(nodes) * 100) if nodes else 0

    summaries = {
        "contratista": "El proceso de selección del contratista tiene alertas activas.",
        "proveedor": "Hay proveedores críticos pendientes de confirmar.",
        "riesgo": f"Hay {len(risk_nodes)} decisión(es) en estado crítico. Impacto: {impact['days']}d / S/{fmt_soles(impact['cost'])}.",
        "resumen": f"El proyecto lleva un {progress_pct}% de decisiones cerradas. Hay {len(critical)} nodos críticos pendientes.",
    }

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
        "criticalDecisions": _auto_pick_critical(nodes),
        "riskPrediction": {
            "message": f"Riesgo acumulado: {impact['days']}d / S/{fmt_soles(impact['cost'])}.",
            "affectedDays": impact["days"],
            "affectedCost": impact["cost"],
        },
        "suggestions": [
            "Conecta el backend para análisis con IA real.",
            "Verifica que GEMINI_API_KEY esté configurada en .env.",
            "Consulta el árbol de decisiones para ver el estado completo.",
        ],
        "actions": actions[:3],
        "timestamp": datetime.now().isoformat(),
        "raw_gemini_response": raw or f"[Fallback: {error}]",
    }
