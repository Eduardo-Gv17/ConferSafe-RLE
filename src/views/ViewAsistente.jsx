import { useState, useRef, useEffect } from 'react'
import { analyze } from '../engine/assistantService'
import { Icon } from '../components/ui'
import { STATUS, fmt } from '../data'

// ─── Urgency config ────────────────────────────────────────────────────────────
const URGENCY = {
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)', label: 'Sin margen', sub: 'Actuar hoy' },
  soon:     { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', label: 'Urgente',    sub: 'Esta semana' },
  review:   { color: '#3B82F6', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.25)', label: 'Revisar',   sub: 'Próximos días' },
  ok:       { color: '#10B981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)', label: 'Al día',    sub: 'Sin riesgo' },
}

// ─── Quick-start chips ─────────────────────────────────────────────────────────
const CHIPS = [
  { emoji: '🔴', text: '¿Qué decisiones son más urgentes esta semana?' },
  { emoji: '🏗️', text: '¿Cómo va el proceso de selección del contratista?' },
  { emoji: '📦', text: '¿Qué proveedores necesito confirmar pronto?' },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '12px 16px' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="5" r="2.2" /><circle cx="5" cy="18" r="2.2" /><circle cx="19" cy="18" r="2.2" />
          <path d="M12 7v3M10.5 11l-4.5 5M13.5 11l4.5 5" />
        </svg>
      </div>
      <div style={{
        padding: '10px 14px', borderRadius: '0 10px 10px 10px',
        background: '#141826', border: '1px solid #1c2030',
      }}>
        <style>{`
          @keyframes blink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
          .dot { width:6px; height:6px; borderRadius:50%; background:#6B7280; display:inline-block; animation: blink 1.2s infinite; }
          .dot:nth-child(2){animation-delay:.2s}
          .dot:nth-child(3){animation-delay:.4s}
        `}</style>
        <div style={{ display: 'flex', gap: 4 }}>
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </div>
    </div>
  )
}

function DecisionCard({ node, onNavigate }) {
  const u = URGENCY[node.urgency] ?? URGENCY.ok
  const s = STATUS[node.status]
  return (
    <div style={{
      flex: '1 1 0', minWidth: 0, padding: '14px 16px', borderRadius: 10,
      background: u.bg, border: `1px solid ${u.border}`,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* Urgency badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
          background: u.bg, border: `1px solid ${u.border}`, color: u.color,
          letterSpacing: 0.5, textTransform: 'uppercase',
        }}>{u.label}</span>
        <span style={{
          fontSize: 9.5, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
          background: s.bg, border: `1px solid ${s.border}`, color: s.color,
        }}>{s.label}</span>
      </div>

      {/* Code + title */}
      <div>
        <div style={{ fontSize: 9.5, color: '#6B7280', fontWeight: 600, marginBottom: 3 }}>Decisión {node.code}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#F3F4F6', lineHeight: 1.3 }}>{node.title}</div>
      </div>

      {/* Owner */}
      <div style={{ fontSize: 11, color: '#9CA3AF' }}>
        <span style={{ color: '#6B7280' }}>Responsable: </span>{node.owner}
      </div>

      {/* Remaining days */}
      <div style={{ marginTop: 'auto' }}>
        {node.remaining === null ? (
          <span style={{ fontSize: 11, color: '#6B7280' }}>Sin fecha límite</span>
        ) : node.remaining < 0 ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>
            {Math.abs(node.remaining)}d vencido
          </span>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 700, color: u.color }}>
            {node.remaining === 0 ? 'Vence hoy' : `${node.remaining}d restantes`}
          </span>
        )}
        {node.impactDays > 0 && (
          <span style={{ fontSize: 10.5, color: '#6B7280', marginLeft: 8 }}>
            · +{node.impactDays}d si se retrasa
          </span>
        )}
      </div>

      <button onClick={() => onNavigate('arbol')} style={{
        padding: '6px 0', borderRadius: 6, border: `1px solid ${u.border}`,
        background: 'transparent', color: u.color, fontSize: 11, fontWeight: 600,
        cursor: 'pointer', marginTop: 4,
      }}>
        Ver en árbol →
      </button>
    </div>
  )
}

function RiskCard({ prediction }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 10,
      background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          size={16} color="#F59E0B" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', letterSpacing: 0.5, marginBottom: 5 }}>
          PREDICCIÓN DE RIESGO
        </div>
        <div style={{ fontSize: 12.5, color: '#E5E7EB', lineHeight: 1.5 }}>{prediction.message}</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>Días en riesgo</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>{prediction.affectedDays}d</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>Costo en riesgo</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>S/ {fmt(prediction.affectedCost)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main view ─────────────────────────────────────────────────────────────────
export default function ViewAsistente({ nodes, setActive }) {
  const [query, setQuery]     = useState('')
  const [phase, setPhase]     = useState('idle')   // idle | loading | result
  const [result, setResult]   = useState(null)
  const [lastQuery, setLastQuery] = useState('')
  const textareaRef = useRef(null)

  // Auto-focus textarea on mount
  useEffect(() => { textareaRef.current?.focus() }, [])

  const handleSubmit = async (text) => {
    const q = (text || query).trim()
    if (!q) return
    setLastQuery(q)
    setPhase('loading')
    setQuery('')
    try {
      const res = await analyze(q, nodes)
      setResult(res)
      setPhase('result')
    } catch {
      setPhase('idle')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleReset = () => {
    setPhase('idle')
    setResult(null)
    setQuery('')
    setLastQuery('')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  // ── IDLE ────────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 32, overflow: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 620 }}>
          {/* Greeting */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px',
              background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="5" r="2.2" /><circle cx="5" cy="18" r="2.2" /><circle cx="19" cy="18" r="2.2" />
                <path d="M12 7v3M10.5 11l-4.5 5M13.5 11l4.5 5" />
              </svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F3F4F6', letterSpacing: -0.4, marginBottom: 8 }}>
              ¿En qué parte del proyecto
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F3F4F6', letterSpacing: -0.4, marginBottom: 10 }}>
              necesitas claridad hoy?
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', maxWidth: 380, margin: '0 auto' }}>
              Edificio Mirador — San Isidro · {nodes.filter(n => n.status === 'risk' || (n.remaining !== null && n.remaining <= 3)).length} decisiones urgentes esta semana
            </div>
          </div>

          {/* Input box */}
          <div style={{
            background: '#141826', border: '1px solid #1f2436', borderRadius: 12,
            padding: '4px 4px 4px 16px', display: 'flex', alignItems: 'flex-end', gap: 8,
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}>
            <textarea
              ref={textareaRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ej. ¿Cuál es el mayor riesgo esta semana?"
              rows={2}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#E5E7EB', fontSize: 14, resize: 'none', padding: '10px 0',
                fontFamily: 'inherit', lineHeight: 1.5,
              }}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!query.trim()}
              style={{
                width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                background: query.trim() ? 'linear-gradient(135deg,#3B82F6,#6366F1)' : '#1f2436',
                border: 'none', cursor: query.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 4, transition: 'background 0.2s',
              }}
            >
              <Icon d="M5 12h14M12 5l7 7-7 7" size={15} color={query.trim() ? '#fff' : '#4B5563'} stroke={2} />
            </button>
          </div>

          {/* Chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {CHIPS.map((chip, i) => (
              <button key={i} onClick={() => handleSubmit(chip.text)} style={{
                width: '100%', padding: '10px 16px', borderRadius: 8, textAlign: 'left',
                background: 'transparent', border: '1px solid #1c2030',
                color: '#9CA3AF', fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'border-color 0.15s, color 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a3050'; e.currentTarget.style.color = '#D1D5DB' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1c2030'; e.currentTarget.style.color = '#9CA3AF' }}
              >
                <span style={{ fontSize: 16 }}>{chip.emoji}</span>
                <span>{chip.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── LOADING ─────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 32,
      }}>
        <div style={{ width: '100%', maxWidth: 620, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* User bubble */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: '10px 0 10px 10px',
              background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)',
              fontSize: 13.5, color: '#E5E7EB', lineHeight: 1.5,
            }}>
              {lastQuery}
            </div>
          </div>
          {/* Dots */}
          <TypingDots />
        </div>
      </div>
    )
  }

  // ── RESULT ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Collapsed user query + reset */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            padding: '7px 14px', borderRadius: 8,
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
            fontSize: 12.5, color: '#9CA3AF', maxWidth: '70%',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            <span style={{ color: '#6B7280', marginRight: 8 }}>Tú:</span>"{lastQuery}"
          </div>
          <button onClick={handleReset} style={{
            padding: '6px 12px', borderRadius: 6, border: '1px solid #1c2030',
            background: 'transparent', color: '#6B7280', fontSize: 11.5, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500,
          }}>
            <Icon d="M3 12a9 9 0 109-9M3 3v5h5" size={12} stroke={2} />
            Nueva consulta
          </button>
        </div>

        {/* AI branding + summary */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,0.25)',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="5" r="2.2" /><circle cx="5" cy="18" r="2.2" /><circle cx="19" cy="18" r="2.2" />
              <path d="M12 7v3M10.5 11l-4.5 5M13.5 11l4.5 5" />
            </svg>
          </div>
          <div style={{
            flex: 1, padding: '12px 16px', borderRadius: '0 10px 10px 10px',
            background: '#141826', border: '1px solid #1c2030', fontSize: 13.5,
            color: '#D1D5DB', lineHeight: 1.6,
          }}>
            {result.summary}
          </div>
        </div>

        {/* Section title */}
        <div style={{ fontSize: 11, fontWeight: 600, color: '#4B5563', letterSpacing: 1, textTransform: 'uppercase' }}>
          Decisiones que necesitan atención
        </div>

        {/* Decision cards (horizontal row) */}
        {result.criticalDecisions.length > 0 ? (
          <div style={{ display: 'flex', gap: 12 }}>
            {result.criticalDecisions.map(node => (
              <DecisionCard key={node.id} node={node} onNavigate={setActive} />
            ))}
          </div>
        ) : (
          <div style={{ padding: 16, borderRadius: 8, background: '#141826', border: '1px solid #1c2030', color: '#6B7280', fontSize: 13 }}>
            No se encontraron decisiones urgentes para esta consulta.
          </div>
        )}

        {/* Risk prediction */}
        <RiskCard prediction={result.riskPrediction} />

        {/* Suggestions */}
        <div style={{ background: '#141826', border: '1px solid #1c2030', borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#D1D5DB', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={13} color="#9CA3AF" />
            Próximos pasos sugeridos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.suggestions.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#60A5FA',
                }}>{i + 1}</span>
                <span style={{ fontSize: 12.5, color: '#9CA3AF', lineHeight: 1.5, paddingTop: 2 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => setActive('arbol')} style={{
            padding: '9px 18px', borderRadius: 8,
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
            color: '#93C5FD', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icon d="M12 3v4M5 21v-6M19 21v-6M12 11v4M4 11h16" size={13} color="#93C5FD" />
            Ver árbol completo
          </button>
          <button onClick={() => setActive('ruta')} style={{
            padding: '9px 18px', borderRadius: 8,
            background: 'transparent', border: '1px solid #1c2030',
            color: '#6B7280', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icon d="M3 3v18h18 M7 16l4-4 4 4 6-6" size={13} color="#6B7280" />
            Ruta crítica
          </button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 10.5, color: '#374151' }}>
            Análisis generado · {new Date(result.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Follow-up input */}
        <div style={{
          background: '#141826', border: '1px solid #1f2436', borderRadius: 10,
          padding: '4px 4px 4px 14px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Hacer una pregunta de seguimiento..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#E5E7EB', fontSize: 13, padding: '8px 0', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!query.trim()}
            style={{
              width: 34, height: 34, borderRadius: 7, flexShrink: 0,
              background: query.trim() ? 'linear-gradient(135deg,#3B82F6,#6366F1)' : '#1f2436',
              border: 'none', cursor: query.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
          >
            <Icon d="M5 12h14M12 5l7 7-7 7" size={14} color={query.trim() ? '#fff' : '#4B5563'} stroke={2} />
          </button>
        </div>

      </div>
    </div>
  )
}
