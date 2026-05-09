import { useState, useMemo } from 'react'
import { STATUS, fmt } from '../data'
import { Icon, StatusBadge } from '../components/ui'

const NODE_W = 160
const NODE_H = 52
const SVG_W  = 1160
const SVG_H  = 560

function getAncestorPath(nodeId, nodes) {
  const map = Object.fromEntries(nodes.map(n => [n.id, n]))
  const path = []
  let cur = map[nodeId]
  while (cur) { path.unshift(cur); cur = cur.parent ? map[cur.parent] : null }
  return path
}

export default function ViewArbol({ nodes, setNodes }) {
  const [selected, setSelected] = useState(null)

  const edges = useMemo(() => {
    const arr = []
    nodes.forEach(n => {
      if (!n.parent) return
      const parent = nodes.find(p => p.id === n.parent)
      if (parent) arr.push({ from: parent, to: n, critical: n.critical && parent.critical })
    })
    return arr
  }, [nodes])

  const changeStatus = (id, newStatus) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, status: newStatus } : n))
    setSelected(prev => prev?.id === id ? { ...prev, status: newStatus } : prev)
  }

  const selNode = selected ? nodes.find(n => n.id === selected.id) : null

  const ancestorPath = useMemo(() =>
    selNode ? getAncestorPath(selNode.id, nodes) : []
  , [selNode, nodes])

  const ancestorIds   = useMemo(() => new Set(ancestorPath.map(n => n.id)), [ancestorPath])
  const pathEdgeKeys  = useMemo(() => {
    const keys = new Set()
    for (let i = 0; i < ancestorPath.length - 1; i++)
      keys.add(`${ancestorPath[i].id}-${ancestorPath[i + 1].id}`)
    return keys
  }, [ancestorPath])

  const hasSelection = !!selNode

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#F7FAFF' }}>

      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #E8EFFE',
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>Árbol de Decisiones</div>
            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
              {hasSelection
                ? `Secuencia: ${ancestorPath.map(n => n.code).join(' → ')}`
                : 'Edificio Mirador · Haz clic en un nodo para ver su secuencia'}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {Object.entries(STATUS).map(([k, v]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: v.color, fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: v.color, flexShrink: 0 }} />
                {v.label}
              </span>
            ))}
          </div>
        </div>

        {/* SVG */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 20px', background: '#F7FAFF' }}>
          <svg width={SVG_W} height={SVG_H} style={{ display: 'block', minWidth: SVG_W }}>
            <defs>
              <marker id="arrow" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="#CBD5E1" />
              </marker>
              <marker id="arrow-red" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="#FCA5A5" />
              </marker>
              <marker id="arrow-path" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="#3B82F6" />
              </marker>
              <filter id="glow-ancestor" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-selected" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <style>{`
                @keyframes flowDash { from{stroke-dashoffset:24} to{stroke-dashoffset:0} }
                .path-edge-flow { animation: flowDash 0.6s linear infinite; }
                @keyframes pulseRing { 0%{opacity:.5;r:10} 100%{opacity:0;r:20} }
                .pulse-ring { animation: pulseRing 1.4s ease-out infinite; }
              `}</style>
            </defs>

            {/* Background card */}
            <rect x={0} y={0} width={SVG_W} height={SVG_H} fill="#F7FAFF" rx={0} />

            {/* ── Dimmed edges ── */}
            {edges.map((e, i) => {
              const isPath = pathEdgeKeys.has(`${e.from.id}-${e.to.id}`)
              if (isPath) return null
              const x1 = e.from.x, y1 = e.from.y + NODE_H
              const x2 = e.to.x,   y2 = e.to.y
              const my = (y1 + y2) / 2
              return (
                <path key={`bg-${i}`}
                  d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`}
                  fill="none"
                  stroke={e.critical ? '#FCA5A5' : '#CBD5E1'}
                  strokeWidth={e.critical ? 1.5 : 1}
                  strokeDasharray={e.critical ? '6 3' : 'none'}
                  markerEnd={e.critical ? 'url(#arrow-red)' : 'url(#arrow)'}
                  opacity={hasSelection && !isPath ? 0.2 : e.critical ? 0.8 : 0.7}
                />
              )
            })}

            {/* ── Dimmed nodes ── */}
            {nodes.map(n => {
              const inPath = ancestorIds.has(n.id)
              if (inPath) return null
              const s = STATUS[n.status]
              const nx = n.x - NODE_W / 2
              const dimmed = hasSelection
              return (
                <g key={`dim-${n.id}`} onClick={() => setSelected(n)} style={{ cursor: 'pointer', opacity: dimmed ? 0.22 : 1 }}>
                  <rect x={nx} y={n.y} width={NODE_W} height={NODE_H} rx={8}
                    fill={s.bg} stroke={s.border} strokeWidth={1.5} />
                  {n.critical && <rect x={nx} y={n.y} width={3.5} height={NODE_H} rx={2} fill={s.color} opacity={0.7} />}
                  <text x={n.x} y={n.y + 16} textAnchor="middle" fill={s.color} fontSize={9} fontFamily="Inter" fontWeight={700} letterSpacing={0.5}>{n.code}</text>
                  <text x={n.x} y={n.y + 30} textAnchor="middle" fill="#1E293B" fontSize={10.5} fontFamily="Inter" fontWeight={600}>
                    {n.title.length > 20 ? n.title.slice(0, 19) + '…' : n.title}
                  </text>
                  <text x={n.x} y={n.y + 44} textAnchor="middle" fill={s.color} fontSize={9} fontFamily="Inter" fontWeight={600}>{s.label}</text>
                </g>
              )
            })}

            {/* ── Path edges (animated, blue) ── */}
            {edges.map((e, i) => {
              const isPath = pathEdgeKeys.has(`${e.from.id}-${e.to.id}`)
              if (!isPath) return null
              const x1 = e.from.x, y1 = e.from.y + NODE_H
              const x2 = e.to.x,   y2 = e.to.y
              const my = (y1 + y2) / 2
              const d  = `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`
              return (
                <g key={`path-edge-${i}`}>
                  <path d={d} fill="none" stroke="#BFDBFE" strokeWidth={8} opacity={0.5} strokeLinecap="round" />
                  <path d={d} fill="none" stroke="#3B82F6" strokeWidth={2} opacity={0.5} />
                  <path d={d} fill="none" stroke="#2563EB" strokeWidth={2}
                    strokeDasharray="8 6" markerEnd="url(#arrow-path)"
                    className="path-edge-flow" opacity={1} />
                </g>
              )
            })}

            {/* ── Path nodes (lit up) ── */}
            {ancestorPath.map((n, stepIndex) => {
              const s = STATUS[n.status]
              const isSelected = selNode?.id === n.id
              const isRoot = stepIndex === 0 && ancestorPath.length > 1
              const nx = n.x - NODE_W / 2
              const stepColor = isSelected ? '#2563EB' : '#3B82F6'

              return (
                <g key={`path-${n.id}`} onClick={() => setSelected(n)} style={{ cursor: 'pointer' }}
                  filter={isSelected ? 'url(#glow-selected)' : 'url(#glow-ancestor)'}>

                  {isSelected && (
                    <circle cx={n.x} cy={n.y + NODE_H / 2} r="10" fill="none"
                      stroke="#3B82F6" strokeWidth="1.5" className="pulse-ring" />
                  )}

                  {/* Outer glow ring */}
                  <rect x={nx - 4} y={n.y - 4} width={NODE_W + 8} height={NODE_H + 8} rx={12}
                    fill="none" stroke={stepColor} strokeWidth={isSelected ? 2 : 1}
                    opacity={isSelected ? 0.5 : 0.3} />

                  {/* Node body */}
                  <rect x={nx} y={n.y} width={NODE_W} height={NODE_H} rx={8}
                    fill={isSelected ? '#EFF6FF' : '#fff'}
                    stroke={stepColor} strokeWidth={isSelected ? 2 : 1.5} />

                  {/* Left status stripe */}
                  <rect x={nx} y={n.y} width={4} height={NODE_H} rx={2}
                    fill={isSelected ? '#3B82F6' : s.color} opacity={0.9} />

                  {/* Step badge */}
                  <circle cx={nx + NODE_W - 11} cy={n.y + 11} r={9}
                    fill={isSelected ? '#3B82F6' : '#EFF6FF'}
                    stroke={isSelected ? '#2563EB' : '#BFDBFE'} strokeWidth={1.5} />
                  <text x={nx + NODE_W - 11} y={n.y + 15} textAnchor="middle"
                    fill={isSelected ? '#fff' : '#2563EB'}
                    fontSize={8.5} fontFamily="Inter" fontWeight={800}>{stepIndex + 1}</text>

                  <text x={n.x - 7} y={n.y + 16} textAnchor="middle"
                    fill={isSelected ? '#2563EB' : s.color}
                    fontSize={9} fontFamily="Inter" fontWeight={700} letterSpacing={0.5}>{n.code}</text>
                  <text x={n.x - 7} y={n.y + 30} textAnchor="middle"
                    fill={isSelected ? '#1E293B' : '#1E293B'}
                    fontSize={10.5} fontFamily="Inter" fontWeight={700}>
                    {n.title.length > 20 ? n.title.slice(0, 19) + '…' : n.title}
                  </text>
                  <text x={n.x - 7} y={n.y + 44} textAnchor="middle"
                    fill={isSelected ? '#3B82F6' : s.color}
                    fontSize={9} fontFamily="Inter" fontWeight={600}>{s.label}</text>

                  {isRoot && (
                    <text x={n.x} y={n.y - 9} textAnchor="middle"
                      fill="#3B82F6" fontSize={8} fontFamily="Inter" fontWeight={800} letterSpacing={1}>
                      INICIO
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Detail panel */}
      {selNode && (
        <div style={{
          width: 300, background: '#fff', borderLeft: '1px solid #E8EFFE',
          display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0,
          boxShadow: '-2px 0 12px rgba(59,130,246,0.06)',
        }}>
          {/* Panel header */}
          <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid #F0F5FF', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                Decisión {selNode.code}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1E293B', lineHeight: 1.35 }}>{selNode.title}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{
              width: 26, height: 26, borderRadius: 7, border: '1px solid #E8EFFE',
              background: '#F7FAFF', color: '#94A3B8', cursor: 'pointer',
              fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>✕</button>
          </div>

          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <StatusBadge status={selNode.status} />

            <p style={{ margin: 0, fontSize: 12.5, color: '#64748B', lineHeight: 1.55 }}>{selNode.desc}</p>

            {/* Sequence */}
            {ancestorPath.length > 1 && (
              <div style={{ borderTop: '1px solid #F0F5FF', paddingTop: 14 }}>
                <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                  Secuencia ({ancestorPath.length} pasos)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {ancestorPath.map((n, i) => {
                    const s = STATUS[n.status]
                    const isCur = n.id === selNode.id
                    return (
                      <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 20 }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                            background: isCur ? 'var(--blue-bg)' : 'var(--bg-surface-2)',
                            border: `1.5px solid ${isCur ? 'var(--blue-border)' : 'var(--border)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, fontWeight: 800, color: isCur ? '#2563EB' : '#94A3B8',
                          }}>{i + 1}</div>
                          {i < ancestorPath.length - 1 && (
                            <div style={{ width: 1.5, height: 10, background: '#E2E8F0', marginTop: 2 }} />
                          )}
                        </div>
                        <div style={{
                          flex: 1, padding: '6px 10px', borderRadius: 8,
                          background: isCur ? '#EFF6FF' : '#F8FAFC',
                          border: `1px solid ${isCur ? '#BFDBFE' : '#E2E8F0'}`,
                        }}>
                          <div style={{ fontSize: 11.5, fontWeight: isCur ? 700 : 500, color: isCur ? '#1E293B' : '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 10, color: s.color, fontWeight: 600 }}>{s.label}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Details grid */}
            <div style={{ borderTop: '1px solid #F0F5FF', paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Responsable', value: selNode.owner },
                { label: 'Rol',         value: selNode.role },
                { label: 'Fecha límite',value: selNode.due },
                { label: 'Días rest.',  value: selNode.remaining === null ? '—' : selNode.remaining < 0 ? `${Math.abs(selNode.remaining)}d vencido` : `${selNode.remaining}d` },
              ].map((f, i) => (
                <div key={i}>
                  <div style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: '#1E293B', fontWeight: 600 }}>{f.value}</div>
                </div>
              ))}
            </div>

            {/* Impact */}
            {selNode.impactDays > 0 && (
              <div style={{ borderTop: '1px solid #F0F5FF', paddingTop: 14 }}>
                <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Impacto estimado</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#D97706' }}>{selNode.impactDays}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>días retraso</div>
                  </div>
                  <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#2563EB' }}>S/{fmt(selNode.impactCost)}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>costo en riesgo</div>
                  </div>
                </div>
              </div>
            )}

            {/* Change status */}
            <div style={{ borderTop: '1px solid #F0F5FF', paddingTop: 14 }}>
              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Cambiar estado</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { key:'approved', label:'Aprobar',       icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',    color:'#059669' },
                  { key:'review',   label:'Enviar a revisión', icon:'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', color:'#2563EB' },
                  { key:'risk',     label:'Marcar en riesgo',  icon:'M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z', color:'#DC2626' },
                ].map(btn => {
                  const active = selNode.status === btn.key
                  const s = STATUS[btn.key]
                  return (
                    <button key={btn.key} onClick={() => !active && changeStatus(selNode.id, btn.key)}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 8,
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: active ? s.bg : '#fff',
                        border: `1px solid ${active ? s.border : '#E8EFFE'}`,
                        color: active ? btn.color : '#64748B',
                        cursor: active ? 'default' : 'pointer',
                        fontSize: 12.5, fontWeight: 600, textAlign: 'left',
                        transition: 'all 0.15s',
                      }}>
                      <Icon d={btn.icon} size={13} color={active ? btn.color : '#94A3B8'} />
                      {btn.label}
                      {active && <span style={{ marginLeft: 'auto', fontSize: 10, color: btn.color }}>✓ actual</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
