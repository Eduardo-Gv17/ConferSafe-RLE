import { useMemo } from 'react'
import { fmt } from '../data'
import { Icon, StatusBadge } from './ui'

const SEV = {
  critico: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  label: 'CRÍTICO', icon: 'M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', label: 'AVISO',   icon: 'M12 8v4m0 4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z' },
  info:    { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', label: 'INFO',    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
}

function buildAlerts(nodes) {
  const arr = []
  nodes.forEach(n => {
    if (n.status === 'risk') {
      arr.push({ severity: 'critico', title: `${n.code} — ${n.title}`, msg: `Vencido hace ${Math.abs(n.remaining || 0)} días. Impacto: ${n.impactDays}d / S/${fmt(n.impactCost)}`, node: n })
    } else if (n.remaining !== null && n.remaining <= 2 && n.remaining >= 0) {
      arr.push({ severity: 'critico', title: `Vence en ${n.remaining}d — ${n.title}`, msg: `Responsable: ${n.owner}. Impacto: ${n.impactDays}d / S/${fmt(n.impactCost)}`, node: n })
    } else if (n.remaining !== null && n.remaining <= 7 && n.remaining > 2) {
      arr.push({ severity: 'warning', title: `Próximo a vencer — ${n.title}`, msg: `${n.remaining} días restantes. Responsable: ${n.owner}`, node: n })
    } else if (n.critical && n.status === 'pending') {
      arr.push({ severity: 'info', title: `Ruta crítica pendiente — ${n.title}`, msg: `Código ${n.code} · Responsable: ${n.owner}`, node: n })
    }
  })
  const order = { critico: 0, warning: 1, info: 2 }
  return arr.sort((a, b) => order[a.severity] - order[b.severity])
}

export default function AlertsList({ nodes, compact }) {
  const alerts = useMemo(() => buildAlerts(nodes), [nodes])

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alerts.slice(0, 4).map((a, i) => {
          const s = SEV[a.severity]
          return (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 7, background: s.bg, border: `1px solid ${s.border}` }}>
              <Icon d={s.icon} size={13} color={s.color} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#E5E7EB' }}>{a.title}</div>
                <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 1 }}>{a.msg}</div>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: s.color, flexShrink: 0 }}>{s.label}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map((a, i) => {
        const s = SEV[a.severity]
        return (
          <div key={i} style={{ padding: '12px 16px', borderRadius: 9, background: '#141826', border: `1px solid ${s.border}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon d={s.icon} size={16} color={s.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
                  {s.label}
                </span>
                <StatusBadge status={a.node.status} small />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB', marginBottom: 3 }}>{a.title}</div>
              <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>{a.msg}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 3 }}>{a.node.due}</div>
              {a.node.impactDays > 0 && (
                <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>+{a.node.impactDays}d</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
