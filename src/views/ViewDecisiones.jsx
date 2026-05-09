import { useState, useRef, useEffect, useMemo } from 'react'
import { STATUS, fmt } from '../data'
import { Avatar } from '../components/ui'

const COLS = [
  { key: 'pending',  label: 'Pendiente',   color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { key: 'review',   label: 'En revisión', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { key: 'risk',     label: 'En riesgo',   color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', colBg: '#FFFCFC' },
  { key: 'approved', label: 'Completado',  color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
]

const STATUS_OPTIONS = [
  { key: 'pending',  label: 'Pendiente'   },
  { key: 'review',   label: 'En revisión' },
  { key: 'risk',     label: 'En riesgo'   },
  { key: 'approved', label: 'Aprobada'    },
  { key: 'done',     label: 'Completada'  },
]

/* ── helpers ───────────────────────────────────────────────────────── */
function parseRemaining(dueStr) {
  if (!dueStr) return null
  const parts = dueStr.split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(Number)
  if (!d || !m || !y) return null
  const due = new Date(y, m - 1, d)
  const now  = new Date(); now.setHours(0, 0, 0, 0)
  return Math.round((due - now) / 86400000)
}

function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row  = Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
    const remaining = parseRemaining(row.due || row.vencimiento || '')
    return {
      id:         'csv_' + Date.now() + Math.random().toString(36).slice(2),
      code:       'CSV-' + Math.floor(Math.random() * 900 + 100),
      title:      row.titulo || row.title || row.decision || 'Sin título',
      owner:      row.responsable || row.owner || 'Sin asignar',
      status:     ['pending','review','risk','approved','done'].includes(row.estado || row.status) ? (row.estado || row.status) : 'pending',
      due:        row.due || row.vencimiento || null,
      remaining,
      impactDays: Number(row.impacto_dias || row.impactdays || 0) || 0,
      impactCost: Number(row.impacto_costo || row.impactcost || 0) || 0,
      critical:   (row.critica || row.critical || '').toLowerCase() === 'true',
      desc:       row.descripcion || row.description || row.desc || '',
      parent:     null, x: 200, y: 200,
    }
  }).filter(n => n.title !== 'Sin título' || true)
}

/* ── UI atoms ──────────────────────────────────────────────────────── */
function DaysBadge({ remaining }) {
  if (remaining === null || remaining === undefined) return null
  if (remaining < 0)  return <Pill text={`${Math.abs(remaining)}d vencido`} c="#DC2626" b="#FEF2F2" br="#FECACA" />
  if (remaining <= 3) return <Pill text={`${remaining}d`}                   c="#D97706" b="#FFFBEB" br="#FDE68A" />
  if (remaining <= 7) return <Pill text={`${remaining}d`}                   c="#64748B" b="#F8FAFC" br="#E2E8F0" />
  return <Pill text={`${remaining}d`} c="#94A3B8" b="#F8FAFC" br="#F1F5F9" />
}

function Pill({ text, c, b, br }) {
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 8, whiteSpace: 'nowrap',
      background: b, border: `1px solid ${br}`, color: c,
    }}>{text}</span>
  )
}

/* ── Quick-add form ────────────────────────────────────────────────── */
function QuickAdd({ colKey, onAdd, onCancel }) {
  const [title, setTitle] = useState('')
  const [owner, setOwner] = useState('')
  const [due,   setDue]   = useState('')
  const titleRef = useRef(null)
  useEffect(() => { titleRef.current?.focus() }, [])

  const submit = (e) => {
    e?.preventDefault()
    if (!title.trim()) return
    onAdd({
      id:         'n' + Date.now(),
      code:       'D-' + Math.floor(Math.random() * 900 + 100),
      title:      title.trim(),
      owner:      owner.trim() || 'Sin asignar',
      status:     colKey,
      remaining:  parseRemaining(due),
      due:        due || null,
      desc:       '',
      impactDays: 0,
      impactCost: 0,
      critical:   false,
      parent:     null,
      x: 200, y: 200,
    })
  }

  const inp = {
    width: '100%', boxSizing: 'border-box',
    padding: '6px 9px', borderRadius: 7,
    border: '1.5px solid var(--border)', background: 'var(--bg-surface)',
    fontSize: 12, color: 'var(--text-1)', outline: 'none',
    fontFamily: 'inherit',
  }

  return (
    <form onSubmit={submit} style={{
      background: 'var(--bg-surface)', borderRadius: 10,
      border: '1.5px solid var(--blue-border)',
      padding: '11px 12px',
      boxShadow: '0 4px 16px rgba(59,130,246,0.10)',
      display: 'flex', flexDirection: 'column', gap: 7,
    }}>
      <input ref={titleRef} value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Título de la decisión…" style={{ ...inp, fontWeight: 600 }}
        onKeyDown={e => e.key === 'Escape' && onCancel()} />
      <input value={owner} onChange={e => setOwner(e.target.value)}
        placeholder="Responsable" style={inp}
        onKeyDown={e => e.key === 'Escape' && onCancel()} />
      <input value={due} onChange={e => setDue(e.target.value)}
        placeholder="Vence DD/MM/AAAA" style={inp}
        onKeyDown={e => e.key === 'Escape' && onCancel()} />
      <div style={{ display: 'flex', gap: 7 }}>
        <button type="submit" style={{
          flex: 1, padding: '6px 0', borderRadius: 7,
          background: 'var(--gradient-primary)',
          border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>Agregar</button>
        <button type="button" onClick={onCancel} style={{
          padding: '6px 10px', borderRadius: 7,
          background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
          fontSize: 12, color: 'var(--text-3)', cursor: 'pointer', fontWeight: 600,
        }}>✕</button>
      </div>
    </form>
  )
}

/* ── Kanban card ───────────────────────────────────────────────────── */
function KanbanCard({ node, isDragging, onDragStart, onDragEnd, onClick }) {
  const s = STATUS[node.status] || STATUS.pending
  return (
    <div
      draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}
      style={{
        background: 'var(--bg-surface)', borderRadius: 10,
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${s.border}`,
        padding: '11px 13px',
        cursor: isDragging ? 'grabbing' : 'pointer',
        opacity: isDragging ? 0.4 : 1,
        boxShadow: isDragging ? '0 10px 28px rgba(59,130,246,0.18)' : 'var(--shadow-sm)',
        transition: 'opacity 0.15s, box-shadow 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={e => { if (!isDragging) e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = isDragging ? '0 10px 28px rgba(59,130,246,0.18)' : 'var(--shadow-sm)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 9 }}>
        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.35 }}>
          {node.title}
        </span>
        {node.critical && (
          <span style={{ fontSize: 9, fontWeight: 800, color: '#DC2626', flexShrink: 0, marginTop: 1, background: '#FEF2F2', border: '1px solid #FECACA', padding: '1px 5px', borderRadius: 4 }}>RC</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar name={node.owner} size={20} color={node.critical ? '#DC2626' : '#3B82F6'} />
          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{node.owner.split(' ')[0]}</span>
        </div>
        <DaysBadge remaining={node.remaining} />
      </div>
    </div>
  )
}

/* ── Detail panel ──────────────────────────────────────────────────── */
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
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
        background: 'var(--bg-surface)', zIndex: 41,
        boxShadow: '-8px 0 40px rgba(59,130,246,0.12)',
        display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid var(--border)',
        animation: 'slideInPanel 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <style>{`@keyframes slideInPanel{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}`}</style>

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: s.bg, border: `1.5px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
            {node.critical ? '🔴' : node.status === 'approved' || node.status === 'done' ? '✅' : '📋'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-4)', fontWeight: 600, marginBottom: 2 }}>{node.code}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.3 }}>{node.title}</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', cursor: 'pointer', fontSize: 14, color: 'var(--text-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: s.bg, border: `1.5px solid ${s.border}`, color: s.color }}>{s.label}</span>
            {node.critical && <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>Ruta crítica</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <InfoCard label="Responsable" value={node.owner} icon="👤" />
            <InfoCard label="Vencimiento" value={node.due ?? '—'} icon="📅" />
            <InfoCard label="Días restantes" icon="⏱️"
              value={node.remaining == null ? '—' : node.remaining < 0 ? `${Math.abs(node.remaining)}d vencido` : `${node.remaining} días`}
              highlight={node.remaining != null && node.remaining < 0 ? '#DC2626' : undefined} />
            <InfoCard label="Impacto" icon="📊"
              value={node.impactDays ? `${node.impactDays}d · S/ ${fmt(node.impactCost)}` : '—'} />
          </div>

          {node.desc && (
            <div style={{ background: 'var(--bg-surface-3)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-4)', marginBottom: 6 }}>DESCRIPCIÓN</div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>{node.desc}</p>
            </div>
          )}

          {/* Change status */}
          <div style={{ background: 'var(--bg-surface-3)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-4)', marginBottom: 10 }}>CAMBIAR ESTADO</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {STATUS_OPTIONS.map(opt => {
                const st = STATUS[opt.key] || STATUS.pending
                const active = editStatus === opt.key
                return (
                  <button key={opt.key} onClick={() => setEditStatus(opt.key)} style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s',
                    background: active ? st.bg : 'var(--bg-surface-2)',
                    border: active ? `2px solid ${st.border}` : '2px solid transparent',
                    color: active ? st.color : 'var(--text-4)',
                  }}>{opt.label}</button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 10 }}>
          <button onClick={apply} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'linear-gradient(135deg,#3B82F6,#6366F1)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--gradient-shadow)' }}>
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

function InfoCard({ label, value, icon, highlight }) {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 9, padding: '10px 12px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600, marginBottom: 4 }}>{icon} {label}</div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: highlight || 'var(--text-1)' }}>{value}</div>
    </div>
  )
}

/* ── Main view ─────────────────────────────────────────────────────── */
export default function ViewDecisiones({ nodes, setNodes }) {
  const [dragNode,   setDragNode]   = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const [adding,     setAdding]     = useState(null)  // colKey | null
  const [selected,   setSelected]   = useState(null)  // node | null
  const [search,     setSearch]     = useState('')
  const [ownerFilter,setOwnerFilter]= useState('all')
  const [onlyCritical, setOnlyCritical] = useState(false)
  const csvRef = useRef(null)

  const owners = useMemo(() => {
    const all = [...new Set(nodes.map(n => n.owner))].sort()
    return all
  }, [nodes])

  const filtered = useMemo(() => {
    return nodes.filter(n => {
      if (onlyCritical && !n.critical) return false
      if (ownerFilter !== 'all' && n.owner !== ownerFilter) return false
      if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [nodes, search, ownerFilter, onlyCritical])

  const grouped = {
    pending:  filtered.filter(n => n.status === 'pending'),
    review:   filtered.filter(n => n.status === 'review'),
    risk:     filtered.filter(n => n.status === 'risk'),
    approved: filtered.filter(n => n.status === 'approved' || n.status === 'done' || n.status === 'rejected'),
  }

  const handleDragStart = (e, node) => { setDragNode(node); e.dataTransfer.effectAllowed = 'move' }
  const handleDrop = (colKey) => {
    if (dragNode && dragNode.status !== colKey)
      setNodes(prev => prev.map(n => n.id === dragNode.id ? { ...n, status: colKey } : n))
    setDragNode(null); setDropTarget(null)
  }
  const handleAdd = (newNode) => { setNodes(prev => [...prev, newNode]); setAdding(null) }
  const handleStatusChange = (nodeId, newStatus) =>
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: newStatus } : n))

  const handleCSV = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const newNodes = parseCSV(ev.target.result)
      if (newNodes.length > 0) setNodes(prev => [...prev, ...newNodes])
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const totalRiskDays = grouped.risk.reduce((a, n) => a + (n.impactDays || 0), 0)
  const totalRiskCost = grouped.risk.reduce((a, n) => a + (n.impactCost || 0), 0)
  const hasFilters = search || ownerFilter !== 'all' || onlyCritical

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', padding: '20px 24px 0', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ marginBottom: 14, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: -0.3 }}>Decisiones</h1>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-4)' }}>
              {hasFilters ? `${filtered.length} de ${nodes.length} decisiones` : 'Arrastra o haz clic para editar'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {totalRiskDays > 0 && (
              <div style={{ padding: '6px 12px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 12, fontWeight: 700, color: '#DC2626' }}>
                ⚠️ {totalRiskDays}d · S/ {fmt(totalRiskCost)}
              </div>
            )}
            {/* CSV import */}
            <button onClick={() => csvRef.current?.click()} title="Importar CSV" style={{
              padding: '7px 13px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--bg-surface)', color: 'var(--text-3)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 14 }}>↑</span> Importar CSV
            </button>
            <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={handleCSV} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar decisión…"
              style={{
                width: '100%', padding: '8px 10px 8px 32px', borderRadius: 10,
                border: '1.5px solid var(--border)', background: 'var(--bg-surface)',
                fontSize: 12.5, color: 'var(--text-1)', outline: 'none', fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--blue-border)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <select value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)} style={{
            padding: '8px 10px', borderRadius: 10, border: '1.5px solid var(--border)',
            background: 'var(--bg-surface)', color: 'var(--text-2)', fontSize: 12.5,
            cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
          }}>
            <option value="all">Todos los responsables</option>
            {owners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <button onClick={() => setOnlyCritical(v => !v)} style={{
            padding: '7px 13px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: onlyCritical ? '1.5px solid #FECACA' : '1.5px solid var(--border)',
            background: onlyCritical ? '#FEF2F2' : 'var(--bg-surface)',
            color: onlyCritical ? '#DC2626' : 'var(--text-3)',
            transition: 'all 0.15s',
          }}>
            🔴 Solo críticas
          </button>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setOwnerFilter('all'); setOnlyCritical(false) }} style={{
              padding: '7px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-4)',
            }}>
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Board */}
      <div style={{ display: 'flex', gap: 14, flex: 1, overflow: 'hidden', paddingBottom: 20 }}>
        {COLS.map(col => {
          const cards   = grouped[col.key] || []
          const isOver  = dropTarget === col.key && dragNode?.status !== col.key
          const isAdding = adding === col.key

          return (
            <div
              key={col.key}
              onDragOver={e => { e.preventDefault(); setDropTarget(col.key) }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget(null) }}
              onDrop={e => { e.preventDefault(); handleDrop(col.key) }}
              style={{
                flex: '1 1 0', minWidth: 190, display: 'flex', flexDirection: 'column',
                borderRadius: 14,
                background: isOver ? 'var(--blue-bg)' : (col.colBg || 'transparent'),
                border: isOver ? '2px dashed var(--blue-border)' : '2px dashed transparent',
                transition: 'background 0.15s, border-color 0.15s',
                padding: '2px',
              }}
            >
              {/* Column header */}
              <div style={{ padding: '2px 6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', letterSpacing: 0.2 }}>{col.label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 800, minWidth: 22, textAlign: 'center',
                    padding: '1px 7px', borderRadius: 10,
                    background: cards.length > 0 ? col.bg : 'var(--bg-surface-2)',
                    border: `1px solid ${cards.length > 0 ? col.border : 'var(--border)'}`,
                    color: cards.length > 0 ? col.color : 'var(--text-5)',
                  }}>{cards.length}</span>
                </div>
                <button onClick={() => setAdding(isAdding ? null : col.key)} title="Agregar decisión" style={{
                  width: 24, height: 24, borderRadius: 7, border: 'none',
                  background: isAdding ? 'var(--blue-bg)' : 'transparent',
                  color: isAdding ? 'var(--blue)' : 'var(--text-5)',
                  fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.12s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue-bg)'; e.currentTarget.style.color = 'var(--blue)' }}
                  onMouseLeave={e => { if (!isAdding) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-5)' } }}
                >+</button>
              </div>

              {/* Cards */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '2px 4px 8px' }}>
                {isAdding && (
                  <QuickAdd colKey={col.key} onAdd={handleAdd} onCancel={() => setAdding(null)} />
                )}
                {cards.map(node => (
                  <KanbanCard key={node.id} node={node}
                    isDragging={dragNode?.id === node.id}
                    onDragStart={e => handleDragStart(e, node)}
                    onDragEnd={() => { setDragNode(null); setDropTarget(null) }}
                    onClick={() => setSelected(node)}
                  />
                ))}
                {cards.length === 0 && !isAdding && (
                  <div style={{ border: '1.5px dashed var(--border)', borderRadius: 10, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-5)' }}>
                    {isOver ? 'Soltar aquí' : 'Vacío'}
                  </div>
                )}
              </div>

              {col.key === 'risk' && cards.length > 0 && (
                <div style={{ padding: '8px 6px 4px', borderTop: '1px solid #FECACA', fontSize: 10.5, color: '#DC2626', fontWeight: 600, flexShrink: 0 }}>
                  {totalRiskDays}d · S/ {fmt(totalRiskCost)}
                </div>
              )}
              {col.key === 'approved' && cards.length > 0 && (
                <div style={{ padding: '8px 6px 4px', borderTop: '1px solid #A7F3D0', fontSize: 10.5, color: '#059669', fontWeight: 600, flexShrink: 0 }}>
                  {cards.length} cerradas ✓
                </div>
              )}
            </div>
          )
        })}
      </div>

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
