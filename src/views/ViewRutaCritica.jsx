import { GANTT_ROWS, GANTT_TODAY, STATUS, fmt } from '../data'
import { Icon } from '../components/ui'

const DAYS = 30
const DAY_W = 28
const ROW_H = 34
const LABEL_W = 240

export default function ViewRutaCritica({ nodes }) {
  const totalImpactDays = nodes.filter(n => n.critical && (n.status === 'risk' || n.status === 'pending')).reduce((a, n) => a + n.impactDays, 0)
  const totalCostRisk = nodes.filter(n => n.critical && (n.status === 'risk' || n.status === 'pending')).reduce((a, n) => a + n.impactCost, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #1c2030' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F3F4F6' }}>Ruta Crítica — Gantt 30 días</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Mayo 2025 · Línea hoy = día {GANTT_TODAY}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>Retraso proyectado</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#EF4444' }}>{totalImpactDays}d</div>
            </div>
            <div style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>Costo en riesgo</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#A78BFA' }}>S/ {fmt(totalCostRisk)}</div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '0 8px' }}>
              {[{ color: '#EF4444', label: 'Ruta crítica' }, { color: '#3B82F6', label: 'Normal' }, { color: '#10B981', label: 'Aprobada' }].map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#9CA3AF' }}>
                  <div style={{ width: 20, height: 3, background: l.color, borderRadius: 2 }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
        <div style={{ minWidth: LABEL_W + DAYS * DAY_W + 20, padding: '0 16px 16px' }}>
          {/* Day header */}
          <div style={{ display: 'flex', marginLeft: LABEL_W, paddingTop: 12, marginBottom: 4 }}>
            {Array.from({ length: DAYS }, (_, i) => i + 1).map(d => (
              <div key={d} style={{ width: DAY_W, flexShrink: 0, textAlign: 'center', fontSize: 9.5, color: d === GANTT_TODAY ? '#F59E0B' : d % 5 === 0 ? '#6B7280' : '#374151', fontWeight: d === GANTT_TODAY ? 700 : 500 }}>{d}</div>
            ))}
          </div>

          {/* Rows */}
          {GANTT_ROWS.map((row, ri) => {
            const barColor = row.critical ? '#EF4444' : (row.status === 'approved' || row.status === 'done') ? '#10B981' : '#3B82F6'
            return (
              <div key={row.id} style={{ display: 'flex', alignItems: 'center', height: ROW_H, borderBottom: '1px solid #1c2030', background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <div style={{ width: LABEL_W, flexShrink: 0, padding: '0 12px', fontSize: 11.5, color: row.critical ? '#E5E7EB' : '#9CA3AF', fontWeight: row.critical ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {row.critical && <span style={{ width: 3, height: 16, borderRadius: 2, background: '#EF4444', flexShrink: 0 }} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</span>
                </div>
                <div style={{ position: 'relative', flex: 1, height: '100%', display: 'flex', alignItems: 'center' }}>
                  {Array.from({ length: DAYS }, (_, i) => i + 1).map(d => (
                    <div key={d} style={{ position: 'absolute', left: (d - 1) * DAY_W, width: 1, height: '100%', background: d === GANTT_TODAY ? 'rgba(245,158,11,0.25)' : 'rgba(28,32,48,0.6)' }} />
                  ))}
                  <div style={{ position: 'absolute', left: (GANTT_TODAY - 0.5) * DAY_W, width: 1.5, height: '100%', background: 'rgba(245,158,11,0.6)', zIndex: 2 }} />
                  <div style={{ position: 'absolute', left: (row.start - 1) * DAY_W + 2, width: (row.end - row.start + 1) * DAY_W - 4, height: 20, borderRadius: 4, zIndex: 1, background: `linear-gradient(90deg,${barColor}cc,${barColor}88)`, border: `1px solid ${barColor}60`, display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
                    <span style={{ fontSize: 9.5, color: '#fff', fontWeight: 600, opacity: 0.9 }}>{row.start}–{row.end}</span>
                  </div>
                </div>
              </div>
            )
          })}

          <div style={{ display: 'flex', marginLeft: LABEL_W, marginTop: 4 }}>
            <div style={{ marginLeft: (GANTT_TODAY - 0.5) * DAY_W - 14, fontSize: 9.5, color: '#F59E0B', fontWeight: 700 }}>▲ hoy</div>
          </div>
        </div>
      </div>
    </div>
  )
}
