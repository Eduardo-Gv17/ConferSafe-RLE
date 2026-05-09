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

const INTENT_RESPONSES = {
  contratista: (nodes) => {
    const relevant = nodes.filter(n => ['n1', 'n11', 'n12', 'n111'].includes(n.id))
    const risk = relevant.filter(n => urgencyOf(n) === 'critical')
    const soon = relevant.filter(n => urgencyOf(n) === 'soon')
    return {
      summary: 'El proceso de selección del contratista tiene una alerta activa y dos decisiones urgentes. El retraso en la verificación de referencias puede bloquear la adjudicación esta semana.',
      highlight: relevant,
      riskMessage: risk.length
        ? `La verificación de referencias (${risk[0].code}) está vencida. Si no se cierra hoy, la adjudicación del contratista se corre ${risk[0].impactDays} días y puede costar S/ ${fmt(risk[0].impactCost)} adicionales.`
        : `La evaluación de propuestas vence en ${soon[0]?.remaining ?? '?'} días. Definir al contratista esta semana es clave para no perder la ventana de excavación.`,
      suggestions: [
        'Pedir a Daniela Cáceres el informe de referencias hoy antes de las 5pm.',
        'Convocar al comité técnico para dictamen de propuestas antes del ' + (soon[0]?.due ?? 'viernes') + '.',
        'Revisar cláusulas de penalidad en los contratos tipo antes de adjudicar.',
      ],
      actions: [
        { type: 'changeStatus', nodeId: 'n12', newStatus: 'review', label: 'Activar seguimiento — Verificación de referencias' },
        { type: 'changeStatus', nodeId: 'n11', newStatus: 'review', label: 'Iniciar revisión de propuestas técnicas' },
      ],
    }
  },

  proveedor: (nodes) => {
    const relevant = nodes.filter(n => ['n22', 'n32'].includes(n.id))
    return {
      summary: 'Hay dos proveedores pendientes de confirmar: acero corrugado y concreto premezclado. Ambos impactan directamente el inicio de vaciado de cimientos.',
      highlight: relevant,
      riskMessage: `Si el proveedor de concreto (${relevant.find(n => n.id === 'n32')?.code}) no se confirma en ${relevant.find(n => n.id === 'n32')?.remaining ?? 5} días, el inicio de excavación puede postergarse hasta 9 días. Riesgo económico: S/ ${fmt(relevant.reduce((a, n) => a + n.impactCost, 0))}.`,
      suggestions: [
        'Pedir a Andrea Núñez el cuadro comparativo de cotizaciones de concreto.',
        'Negociar precio fijo por m³ para los primeros 3 meses con la planta más cercana.',
        'Confirmar el proveedor de acero antes del 12/05 para no afectar el cronograma.',
      ],
      actions: [
        { type: 'changeStatus', nodeId: 'n32', newStatus: 'review', label: 'Activar revisión — Proveedor de concreto' },
        { type: 'changeStatus', nodeId: 'n22', newStatus: 'review', label: 'Activar revisión — Proveedor de acero' },
      ],
    }
  },

  permisos: (nodes) => {
    const relevant = nodes.filter(n => ['n3', 'n31', 'n311'].includes(n.id))
    return {
      summary: 'Los permisos municipales están en revisión. La licencia de edificación depende de los parámetros urbanísticos, que aún no están cerrados.',
      highlight: relevant,
      riskMessage: `Si los parámetros urbanísticos (${relevant.find(n => n.id === 'n311')?.code}) no se obtienen en ${relevant.find(n => n.id === 'n311')?.remaining ?? 9} días, la licencia se corre mínimo 2 semanas. Impacto: S/ ${fmt(relevant.reduce((a, n) => a + n.impactCost, 0))}.`,
      suggestions: [
        'Validar con Valeria Torres si el expediente fue admitido sin observaciones.',
        'Solicitar reunión con el revisor de la Municipalidad de San Isidro esta semana.',
        'Preparar planos de conformidad antes de que la licencia entre a revisión de campo.',
      ],
      actions: [
        { type: 'changeStatus', nodeId: 'n311', newStatus: 'review', label: 'Activar trámite — Parámetros urbanísticos' },
      ],
    }
  },

  riesgo: (nodes) => {
    const atRisk = nodes.filter(n => urgencyOf(n) === 'critical')
    const { days, cost } = totalImpact(atRisk)
    return {
      summary: `Hay ${atRisk.length} decisión${atRisk.length !== 1 ? 'es' : ''} en estado crítico. El impacto acumulado si no se actúa hoy es de ${days} días y S/ ${fmt(cost)}.`,
      highlight: atRisk,
      riskMessage: atRisk[0]
        ? `El mayor riesgo activo es "${atRisk[0].title}" (${atRisk[0].code}), a cargo de ${atRisk[0].owner}. Lleva ${Math.abs(atRisk[0].remaining ?? 0)} días vencido sin cierre.`
        : 'No hay decisiones críticas activas en este momento.',
      suggestions: [
        `Contactar a ${atRisk[0]?.owner ?? 'el responsable'} para obtener un estado actualizado hoy.`,
        'Escalar al director de proyecto si no hay respuesta antes del mediodía.',
        'Revisar el árbol de decisiones para ver qué tareas quedan bloqueadas.',
      ],
      actions: atRisk.slice(0, 2).map(n => ({
        type: 'changeStatus', nodeId: n.id, newStatus: 'review',
        label: `Reactivar — ${n.title.slice(0, 35)}${n.title.length > 35 ? '…' : ''}`,
      })),
    }
  },

  resumen: (nodes) => {
    const critical = getCriticalPending(nodes)
    const done = nodes.filter(n => n.status === 'approved' || n.status === 'done').length
    const { days: riskDays, cost: riskCost } = totalImpact(nodes.filter(n => n.status === 'risk' || n.status === 'pending'))
    return {
      summary: `El proyecto lleva un ${Math.round(done / nodes.length * 100)}% de decisiones cerradas. Esta semana hay ${critical.length} nodos en la ruta crítica que necesitan atención.`,
      highlight: critical.slice(0, 3),
      riskMessage: `El riesgo acumulado no resuelto es de ${riskDays} días y S/ ${fmt(riskCost)}. La decisión más urgente es "${critical[0]?.title ?? '—'}" (${critical[0]?.code ?? '—'}), vencida o a punto de vencer.`,
      suggestions: [
        'Enfocarse primero en cerrar la verificación de referencias del contratista.',
        'Confirmar el proveedor de concreto para no dejar sin materiales el inicio de obra.',
        'Solicitar avance de la licencia de edificación a la gestora legal.',
      ],
      actions: [
        { type: 'changeStatus', nodeId: 'n12', newStatus: 'review', label: 'Reactivar — Verificación de referencias' },
        { type: 'changeStatus', nodeId: 'n32', newStatus: 'review', label: 'Iniciar revisión — Proveedor de concreto' },
      ],
    }
  },
}

export async function analyze(query, nodes) {
  await new Promise(r => setTimeout(r, 1400 + Math.random() * 800))

  const intent = detectIntent(query)
  const builder = INTENT_RESPONSES[intent] ?? INTENT_RESPONSES.resumen
  const base = builder(nodes)

  const criticalDecisions = base.highlight
    .map(n => ({ ...n, urgency: urgencyOf(n) }))
    .sort((a, b) => ({ critical: 0, soon: 1, review: 2, ok: 3 }[a.urgency] - { critical: 0, soon: 1, review: 2, ok: 3 }[b.urgency]))
    .slice(0, 3)

  if (criticalDecisions.length < 3) {
    const ids = new Set(criticalDecisions.map(n => n.id))
    const extras = nodes
      .filter(n => !ids.has(n.id) && urgencyOf(n) !== 'ok')
      .map(n => ({ ...n, urgency: urgencyOf(n) }))
      .sort((a, b) => (a.remaining ?? 999) - (b.remaining ?? 999))
    criticalDecisions.push(...extras.slice(0, 3 - criticalDecisions.length))
  }

  const { days: riskDays, cost: riskCost } = totalImpact(nodes.filter(n => n.status === 'risk' || n.status === 'pending'))

  return {
    query, intent,
    summary: base.summary,
    criticalDecisions,
    riskPrediction: { message: base.riskMessage, affectedDays: riskDays, affectedCost: riskCost },
    suggestions: base.suggestions,
    actions: (base.actions || []).filter(a => {
      // Only show actions that are relevant given the current node state
      if (a.type === 'changeStatus') {
        const n = nodes.find(nd => nd.id === a.nodeId)
        return n && n.status !== a.newStatus && n.status !== 'approved' && n.status !== 'done'
      }
      return true
    }),
    timestamp: new Date().toISOString(),
  }
}
