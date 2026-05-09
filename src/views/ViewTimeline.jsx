import { useState, useMemo } from 'react'
import { STATUS, fmt } from '../data'

// ── Timeline config ────────────────────────────────────────────────
const DAYS_BEFORE  = 7    // days to show before today
const DAYS_AFTER   = 60   // days to show after today
const TOTAL_DAYS   = DAYS_BEFORE + DAYS_AFTER
const PX_PER_DAY   = 18
const TIMELINE_W   = TOTAL_DAYS * PX_PER_DAY
const TODAY_X      = DAYS_BEFORE * PX_PER_DAY
const LABEL_W      = 210  // fixed left column
const ROW_H        = 52

const STATUS_OPTIONS = [
  { key: 'pending',  label: 'Pendiente'   },
  { key: 'review',   label: 'En revisión' },
  { key: 'risk',     label: 'En riesgo'   },
  { key: 'approved', label: 'Aprobada'    },
  { key: 'done',     label: 'Completada'  },
]

// ── Utilities ───────────────────────────────────────────────────────
function getBarStyle(node) {
  const s = STATUS[node.status] || STATUS.pending
  if (node.status === 'approved' || node.status === 'done') return { bg: '#059669', border: '#34D399' }
  if (node.remaining < 0)  return { bg: '#DC2626', border: '#FCA5A5' }
  if (node.remaining <= 3) return { bg: '#D97706', border: '#FDE68A' }
  if (node.status === 'review') return { bg: '#2563EB', border: '#93C5FD' }
  return { bg: s.color, border: s.border }
}

function dayLabel(offsetFromToday) {
  const d = new Date()
  d.setDate(d.getDate() + offsetFromToday)
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }).replace('.', '')
}

function isMonthStart(offsetFromToday) {
  const d = new Date()
  d.setDate(d.getDate() + offsetFromToday)
  return d.getDate() === 1
}

function getMonthLabel(offsetFromToday) {
  const d = new Date()
  d.setDate(d.getDate() + offsetFromToday)
  return d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
}

// ── Detail panel ────────────────────────────────────────────────────
function DetailPanel({ node, onClose, onStatusChange }) {
  const s = STATUS[node.status] || STATUS.pending
  const [editStatus, setEditStatus] = useState(node.status)

  const apply = () => {
    if (editStatus !== node.status) onStatusChange(node.id, editStatus)
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.22)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 360,
        background: 'var(--bg-surface)', zIndex: 41,
        boxShadow: '-8px 0 40px rgba(59,130,246,0.12)',
        display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid var(--border)',
        animation: 'slideIn 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}`}</style>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, border: `1.5px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
            {node.critical ? '🔴' : node.status === 'approved' || node.status === 'done' ? '✅' : '📋'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-4)', fontWeight: 600, marginBottom: 2 }}>{node.code}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.3 }}>{node.title}</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', cursor: 'pointer', fontSize: 14, color: 'var(--text-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: s.bg, border: `1.5px solid ${s.border}`, color: s.color }}>{s.label}</span>
            {node.critical && <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>Ruta crítica</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            {[
              { label: '👤 Responsable', val: node.owner },
              { label: '📅 Vencimiento', val: node.due ?? '—' },
              { label: '⏱️ Días restantes', val: node.remaining == null ? '—' : node.remaining < 0 ? `${Math.abs(node.remaining)}d vencido` : `${node.remaining}d`, red: node.remaining != null && node.remaining < 0 },
              { label: '📊 Impacto', val: node.impactDays ? `${node.impactDays}d · S/ ${fmt(node.impactCost)}` : '—' },
            ].map(({ label, val, red }) => (
              <div key={label} style={{ background: 'var(--bg-surface-3)', borderRadius: 9, padding: '10px 12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: red ? '#DC2626' : 'var(--text-1)' }}>{val}</div>
              </div>
            ))}
          </div>
          {node.desc && (
            <div style={{ background: 'var(--bg-surface-3)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-4)', marginBottom: 6 }}>DESCRIPCIÓN</div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>{node.desc}</p>
            </div>
          )}
          <div style={{ background: 'var(--bg-surface-3)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-4)', marginBottom: 10 }}>CAMBIAR ESTADO</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {STATUS_OPTIONS.map(opt => {
                const st = STATUS[opt.key] || STATUS.pending
                const active = editStatus === opt.key
                return (
                  <button key={opt.key} onClick={() => setEditStatus(opt.key)} style={{
                    padding: '5px 11px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    background: active ? st.bg : 'var(--bg-surface-2)',
                    border: active ? `2px solid ${st.border}` : '2px solid transparent',
                    color: active ? st.color : 'var(--text-4)', transition: 'all 0.12s',
                  }}>{opt.label}</button>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 10 }}>
          <button onClick={apply} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'var(--gradient-primary)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Guardar cambios
          </button>
          <button onClick={onClose} style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-3)', cursor: 'pointer', fontWeight: 600 }}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  )
}

// ── Gantt row ───────────────────────────────────────────────────────
function GanttRow({ node, onClick, isSelected }) {
  const s = STATUS[node.status] || STATUS.pending
  const bar = getBarStyle(node)
  const isDone = node.status === 'approved' || node.status === 'done'

  // Compute bar geometry
  const impactDays = Math.max(node.impactDays || 0, 3)
  let dueX = TODAY_X + (node.remaining ?? 0) * PX_PER_DAY
  // Clamp dueX to [0, TIMELINE_W]
  dueX = Math.max(0, Math.min(TIMELINE_W, dueX))

  let barStart = dueX - impactDays * PX_PER_DAY
  barStart = Math.max(0, barStart)
  const barW = Math.max(24, dueX - barStart)

  const noDate = node.remaining === null

  return (
    <div
      onClick={() => onClick(node)}
      style={{
        display: 'flex', alignItems: 'center', height: ROW_H,
        cursor: 'pointer',
        background: isSelected ? 'var(--blue-bg)' : 'transparent',
        borderBottom: '1px solid var(--border-light)',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-surface-3)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      {/* Left label — fixed */}
      <div style={{
        width: LABEL_W, flexShrink: 0,
        padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 3,
        borderRight: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {node.critical && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626', flexShrink: 0 }}/>}
          <span style={{
            fontSize: 12, fontWeight: 700, color: isDone ? 'var(--text-4)' : 'var(--text-1)',
            textDecoration: isDone ? 'line-through' : 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1,
          }}>{node.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
            {s.label}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.owner.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Timeline bar — scrollable area */}
      <div style={{ flex: 1, position: 'relative', height: '100%', overflow: 'hidden' }}>
        {noDate ? (
          <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: TODAY_X + 8, fontSize: 11, color: 'var(--text-5)', fontStyle: 'italic' }}>
            Sin fecha
          </div>
        ) : (
          <>
            {/* Bar */}
            <div style={{
              position: 'absolute',
              left: barStart,
              width: barW,
              top: '50%', transform: 'translateY(-50%)',
              height: 22, borderRadius: 5,
              background: `${bar.bg}22`,
              border: `1.5px solid ${bar.border}`,
              display: 'flex', alignItems: 'center', overflow: 'hidden',
            }}>
              {/* Fill up to due */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: '100%',
                background: `${bar.bg}44`,
                borderRadius: 4,
              }} />
              {/* Due marker */}
              <div style={{
                position: 'absolute', right: 0, top: -2, bottom: -2,
                width: 4, borderRadius: 2,
                background: bar.bg,
              }} />
            </div>

            {/* Due date label */}
            {node.due && (
              <div style={{
                position: 'absolute',
                left: Math.max(barStart, dueX - 28),
                top: '50%', transform: 'translateY(calc(-50% + 16px))',
                fontSize: 10, color: bar.bg, fontWeight: 700, whiteSpace: 'nowrap',
              }}>
                {node.due}
              </div>
            )}

            {/* Remaining badge on bar */}
            {node.remaining !== null && (
              <div style={{
                position: 'absolute',
                left: barStart + 4,
                top: '50%', transform: 'translateY(-50%)',
                fontSize: 10, fontWeight: 700,
                color: node.remaining < 0 ? '#DC2626' : bar.bg,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}>
                {node.remaining < 0 ? `−${Math.abs(node.remaining)}d` : node.remaining === 0 ? 'hoy' : `${node.remaining}d`}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────
export default function ViewTimeline({ nodes, setNodes }) {
  const [selected, setSelected] = useState(null)

  // Sort: critical first, then by remaining (ascending)
  const sorted = useMemo(() => {
    const active = nodes.filter(n => n.status !== 'approved' && n.status !== 'done')
    const done   = nodes.filter(n => n.status === 'approved' || n.status === 'done')
    const sortFn = (a, b) => {
      if (a.critical && !b.critical) return -1
      if (!a.critical && b.critical) return 1
      const ra = a.remaining ?? 999
      const rb = b.remaining ?? 999
      return ra - rb
    }
    return [...active.sort(sortFn), ...done.sort(sortFn)]
  }, [nodes])

  // Build week header marks
  const weekMarks = useMemo(() => {
    const marks = []
    for (let d = -DAYS_BEFORE; d <= DAYS_AFTER; d += 7) {
      marks.push({ offset: d, x: TODAY_X + d * PX_PER_DAY, label: dayLabel(d) })
    }
    return marks
  }, [])

  // Build month boundaries
  const monthMarks = useMemo(() => {
    const seen = new Set()
    const marks = []
    for (let d = -DAYS_BEFORE; d <= DAYS_AFTER; d++) {
      if (isMonthStart(d)) {
        const label = getMonthLabel(d)
        if (!seen.has(label)) {
          seen.add(label)
          marks.push({ x: TODAY_X + d * PX_PER_DAY, label })
        }
      }
    }
    return marks
  }, [])

  const handleStatusChange = (nodeId, newStatus) =>
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: newStatus } : n))

  const totalH = sorted.length * ROW_H
  const HEADER_H = 52

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', overflow: 'hidden' }}>

      {/* Legend */}
      <div style={{ padding: '16px 24px 8px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: -0.3 }}>Timeline</h1>
        <div style={{ display: 'flex', gap: 12, marginLeft: 8 }}>
          {[
            { color: '#DC2626', label: 'Vencido' },
            { color: '#D97706', label: '≤ 3 días' },
            { color: '#2563EB', label: 'En revisión' },
            { color: '#64748B', label: 'Pendiente' },
            { color: '#059669', label: 'Completado' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-4)' }}>
          Haz clic en una fila para editar · Barra = ventana de impacto
        </div>
      </div>

      {/* Main grid — label col fixed + timeline scrolls */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Fixed label column header */}
        <div style={{ width: LABEL_W, flexShrink: 0, display: 'flex', flexDirection: 'column', zIndex: 2 }}>
          <div style={{
            height: HEADER_H, background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
            display: 'flex', alignItems: 'flex-end', padding: '0 14px 10px',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', letterSpacing: 0.5 }}>
              DECISIÓN · ESTADO
            </span>
          </div>
          {/* Row labels */}
          <div style={{ flex: 1, overflowY: 'hidden' }}>
            {sorted.map(node => (
              <div key={node.id} style={{ height: ROW_H }} /> // height spacer only, content in GanttRow
            ))}
          </div>
        </div>

        {/* Scrollable timeline area */}
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', position: 'relative' }}>
          <div style={{ width: TIMELINE_W, minHeight: '100%', position: 'relative' }}>

            {/* Header row */}
            <div style={{
              height: HEADER_H, position: 'sticky', top: 0, zIndex: 3,
              background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}>
              {/* Month labels */}
              <div style={{ position: 'relative', height: 20, flexShrink: 0 }}>
                {monthMarks.map(({ x, label }) => (
                  <div key={label} style={{
                    position: 'absolute', left: x + 4, top: 0,
                    fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
                    textTransform: 'capitalize', whiteSpace: 'nowrap',
                  }}>{label}</div>
                ))}
              </div>
              {/* Week marks */}
              <div style={{ position: 'relative', height: 28, flexShrink: 0 }}>
                {weekMarks.map(({ x, label, offset }) => (
                  <div key={offset} style={{ position: 'absolute', left: x, top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 1, height: 6, background: 'var(--border)' }} />
                    <span style={{ fontSize: 10, color: offset === 0 ? 'var(--blue)' : 'var(--text-4)', fontWeight: offset === 0 ? 800 : 500, whiteSpace: 'nowrap', marginTop: 2 }}>
                      {offset === 0 ? 'Hoy' : label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Today vertical line + grid lines */}
            <div style={{ position: 'absolute', top: HEADER_H, bottom: 0, left: TODAY_X, width: 2, background: 'var(--blue)', opacity: 0.35, zIndex: 1 }} />
            {weekMarks.map(({ x, offset }) => (
              <div key={offset} style={{ position: 'absolute', top: HEADER_H, bottom: 0, left: x, width: 1, background: 'var(--border)', opacity: 0.5, zIndex: 0 }} />
            ))}

            {/* Gantt rows */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              {sorted.map(node => (
                <GanttRow
                  key={node.id}
                  node={node}
                  onClick={setSelected}
                  isSelected={selected?.id === node.id}
                />
              ))}
            </div>

            {sorted.length === 0 && (
              <div style={{ position: 'absolute', top: HEADER_H + 60, left: '50%', transform: 'translateX(-50%)', fontSize: 14, color: 'var(--text-5)' }}>
                No hay decisiones para mostrar
              </div>
            )}
          </div>
        </div>

        {/* Fixed label rows — OVERLAY on left, synced scroll */}
        <div style={{
          position: 'absolute', top: HEADER_H, left: 0, width: LABEL_W,
          zIndex: 2, pointerEvents: 'none',
        }}>
          {/* Labels rendered inside GanttRow already */}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          node={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(id, status) => {
            handleStatusChange(id, status)
            setSelected(prev => prev?.id === id ? { ...prev, status } : prev)
          }}
        />
      )}
    </div>
  )
}
