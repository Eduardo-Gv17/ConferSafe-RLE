/**
 * assistantService.js — conectado al backend FastAPI real.
 *
 * Reemplaza el archivo original en src/engine/assistantService.js
 *
 * Si el backend no está disponible, cae en el modo simulado original
 * para que el frontend siga funcionando en desarrollo sin el servidor.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// ── Conversation history (kept in memory per session) ────────────────────────
let conversationHistory = []

export function clearConversationHistory() {
  conversationHistory = []
}

// ── Main analyze function ────────────────────────────────────────────────────

export async function analyze(query, nodes, projectId = null) {
  // Detect project from localStorage if not passed
  const project_id =
    projectId ||
    localStorage.getItem('confersafe_project') ||
    'edificio-mirador'

  conversationHistory.push({ role: 'user', content: query })

  try {
    const response = await fetch(`${API_BASE}/agent/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        project_id,
        nodes,
        conversation_history: conversationHistory.slice(-8),
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || `HTTP ${response.status}`)
    }

    const result = await response.json()

    conversationHistory.push({ role: 'assistant', content: result.summary })
    // Keep history bounded
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20)
    }

    return result

  } catch (error) {
    console.warn('[ConferSafe] Backend no disponible, usando modo offline:', error.message)
    // Fall back to the original mock logic so the app still works
    return await _offlineFallback(query, nodes)
  }
}

// ── Sync nodes to backend (call after any state change) ─────────────────────
export async function syncNodes(projectId, nodes) {
  try {
    await fetch(`${API_BASE}/nodes/${projectId}/batch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes }),
    })
  } catch {
    // Silent — offline mode, localStorage handles persistence
  }
}

// ── Load nodes from backend (call on app startup) ────────────────────────────
export async function loadNodes(projectId) {
  try {
    const res = await fetch(`${API_BASE}/nodes/${projectId}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    return null // will use localStorage fallback
  }
}

// ── Offline fallback (original mock logic, kept for resilience) ──────────────

import { urgencyOf, getCriticalPending, totalImpact } from './decisionGraph'
import { fmt } from '../data'

const INTENTS = [
  { intent: 'contratista', keywords: ['contratista', 'empresa', 'constructor', 'adjudicaci', 'licitaci', 'propuesta'] },
  { intent: 'proveedor',   keywords: ['proveedor', 'concreto', 'acero', 'material', 'suministro', 'insumo', 'compra'] },
  { intent: 'permisos',    keywords: ['permiso', 'licencia', 'municipal', 'autoriza', 'tramite', 'trámite', 'legal'] },
  { intent: 'riesgo',      keywords: ['riesgo', 'problema', 'retraso', 'demora', 'peligro', 'vence', 'venci'] },
  { intent: 'resumen',     keywords: ['resumen', 'estado', 'overview', 'cómo', 'como', 'semana', 'hoy', 'situaci'] },
]

function detectIntent(query) {
  const q = query.toLowerCase()
  for (const { intent, keywords } of INTENTS)
    if (keywords.some(kw => q.includes(kw))) return intent
  return 'resumen'
}

async function _offlineFallback(query, nodes) {
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 600))

  const intent = detectIntent(query)
  const critical = getCriticalPending(nodes)
  const done = nodes.filter(n => n.status === 'approved' || n.status === 'done').length
  const { days: riskDays, cost: riskCost } = totalImpact(
    nodes.filter(n => n.status === 'risk' || n.status === 'pending')
  )

  const criticalDecisions = critical
    .slice(0, 3)
    .map(n => ({ ...n, urgency: urgencyOf(n) }))

  return {
    query,
    intent,
    summary: `[Modo offline] El proyecto lleva un ${Math.round(done / nodes.length * 100)}% de decisiones cerradas. Hay ${critical.length} nodos críticos pendientes.`,
    criticalDecisions,
    riskPrediction: {
      message: `Riesgo acumulado: ${riskDays} días / S/ ${fmt(riskCost)}. Conecta el backend para análisis detallado con IA.`,
      affectedDays: riskDays,
      affectedCost: riskCost,
    },
    suggestions: [
      'Inicia el backend (uvicorn main:app --reload) para activar Confi con IA real.',
      'Agrega tu GEMINI_API_KEY en el archivo .env del backend.',
      'Consulta la documentación en http://localhost:8000/docs.',
    ],
    actions: [],
    timestamp: new Date().toISOString(),
  }
}
