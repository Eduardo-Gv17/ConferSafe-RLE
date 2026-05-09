import { STATUS, fmt } from '../data'
import { Icon, StatusBadge } from '../components/ui'
import AlertsList from '../components/AlertsList'

function MiniTree({ nodes }) {
  const levels = [
    [nodes.find(n => n.id === 'root')],
    nodes.filter(n => n.parent === 'root'),
    nodes.filter(n => ['n1', 'n2', 'n3'].includes(n.parent)),
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      {levels.map((level, li) => (
        <div key={li} style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          {level.filter(Boolean).map(n => (
            <div key={n.id} style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 10, fontWeight: 500,
              background: STATUS[n.status].bg, border: `1px solid ${STATUS[n.status].border}`,
              color: STATUS[n.status].color, maxWidth: 130, textAlign: 'center',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {n.code} · {n.title.split(' ').slice(0, 2).join(' ')}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function ViewResumen({ nodes }) {
  const riskNodes = nodes.filter(n => n.status === 'risk')
  const approvedNodes = nodes.filter(n => n.status === 'approved' || n.status === 'done')
  const totalImpactDays = nodes.filter(n => n.status === 'risk' || n.status === 'pending').reduce((a, n) => a + n.impactDays, 0)
  const totalImpactCost = nodes.filter(n => n.status === 'risk' || n.status === 'pending').reduce((a, n) => a + n.impactCost, 0)
  const progress = Math.round((approvedNodes.length / nodes.length) * 100)
  const criticalPending = nodes.filter(n => n.critical && n.status !== 'approved' && n.status !== 'done')

  const kpis = [
    { label: 'Decisiones en riesgo', value: riskNodes.length,          unit: 'nodos',      color: '#EF4444', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.2)',    icon: 'M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
    { label: 'Impacto en días',       value: totalImpactDays,           unit: 'días',       color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.2)',   icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Costo en riesgo',       value: `S/ ${fmt(totalImpactCost)}`, unit: 'soles',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',   border: 'rgba(139,92,246,0.2)',   icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Avance del proyecto',   value: `${progress}%`,            unit: 'completado', color: '#10B981', bg: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.2)',   icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#F3F4F6', letterSpacing: -0.3 }}>Resumen del Proyecto</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>Edificio Mirador — San Isidro · Actualizado hoy, 4 may 2025</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#A5B4FC', fontSize: 11.5, fontWeight: 600 }}>Proyecto Privado</span>
          <span style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#60A5FA', fontSize: 11.5, fontWeight: 600 }}>San Isidro, Lima</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ padding: '16px 18px', borderRadius: 10, background: '#141826', border: `1px solid ${k.border}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: 14, top: 14, opacity: 0.25 }}>
              <Icon d={k.icon} size={28} color={k.color} stroke={1.4} />
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color, letterSpacing: -0.5, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 10.5, color: '#6B7280', marginTop: 4 }}>{k.unit}</div>
          </div>
        ))}
      </div>

      {/* Mid row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#141826', border: '1px solid #1c2030', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#D1D5DB', marginBottom: 12 }}>Árbol de decisiones — Vista rápida</div>
          <MiniTree nodes={nodes} />
        </div>

        <div style={{ background: '#141826', border: '1px solid #1c2030', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#D1D5DB' }}>Ruta Crítica Activa</div>
            <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', fontSize: 10, fontWeight: 600 }}>{criticalPending.length} nodos</span>
          </div>
          {criticalPending.slice(0, 5).map((n, i) => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: i % 2 === 0 ? 'rgba(239,68,68,0.04)' : 'transparent', borderRadius: 6, marginBottom: 2 }}>
              <div style={{ width: 2, height: 28, borderRadius: 2, background: '#EF4444', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 500, color: '#E5E7EB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{n.owner} · {n.role}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: n.remaining < 0 ? '#EF4444' : n.remaining <= 3 ? '#F59E0B' : '#9CA3AF' }}>
                  {n.remaining === null ? '—' : n.remaining < 0 ? `${Math.abs(n.remaining)}d vencido` : `${n.remaining}d`}
                </div>
                <div style={{ fontSize: 10, color: '#6B7280' }}>+{n.impactDays}d riesgo</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div style={{ background: '#141826', border: '1px solid #1c2030', borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#D1D5DB', marginBottom: 12 }}>Alertas recientes</div>
        <AlertsList nodes={nodes} compact />
      </div>
    </div>
  )
}
