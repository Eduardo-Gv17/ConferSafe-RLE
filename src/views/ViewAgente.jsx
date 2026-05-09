import { useState, useRef, useEffect, useId } from 'react'
import { analyze } from '../engine/assistantService'
import { Icon } from '../components/ui'
import { STATUS, fmt } from '../data'

// ─── Design tokens ─────────────────────────────────────────────────────────────
const URGENCY = {
  critical: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Sin margen' },
  soon:     { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Urgente'    },
  review:   { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'Revisar'    },
  ok:       { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', label: 'Al día'     },
}

const CHIPS = [
  { emoji: '🔴', text: '¿Qué decisiones son más urgentes esta semana?' },
  { emoji: '🏗️', text: '¿Cómo va la selección del contratista?' },
  { emoji: '📦', text: '¿Qué proveedores necesito confirmar pronto?' },
]

// ─── Confi robot mascot ───────────────────────────────────────────────────────
function Confi({ mood = 'idle', size = 88 }) {
  const uid = useId().replace(/:/g, 'x')

  // Eye LED positions per mood
  const eyes = {
    idle:     { lx: 29, ly: 34, rx: 51, ry: 34 },
    thinking: { lx: 31, ly: 32, rx: 53, ry: 32 },
    happy:    { lx: 29, ly: 35, rx: 51, ry: 35 },
    alert:    { lx: 28, ly: 33, rx: 52, ry: 33 },
  }
  const mouths = {
    idle:     'M 30 47 Q 40 53 50 47',
    thinking: 'M 31 49 Q 40 47 49 49',
    happy:    'M 27 45 Q 40 56 53 45',
    alert:    'M 30 50 Q 40 46 50 50',
  }
  const { lx, ly, rx, ry } = eyes[mood] ?? eyes.idle
  const bobStyle = mood === 'idle' ? { animation: 'confi-bob 3.2s ease-in-out infinite' } : {}

  return (
    <>
      <style>{`
        @keyframes confi-bob   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes confi-blink { 0%,90%,100%{transform:scaleY(1)} 95%{transform:scaleY(0.1)} }
        @keyframes confi-glow  { 0%,100%{opacity:.7} 50%{opacity:1} }
        @keyframes confi-scan  { 0%{opacity:.9} 50%{opacity:.3} 100%{opacity:.9} }
      `}</style>
      <svg width={size} height={size} viewBox="0 0 80 80" style={{ ...bobStyle, display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`gh-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#2D7A9A"/>
            <stop offset="100%" stopColor="#1A4260"/>
          </linearGradient>
          <linearGradient id={`gb-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#235069"/>
            <stop offset="100%" stopColor="#162F40"/>
          </linearGradient>
          <linearGradient id={`ge-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#7FD4F0"/>
            <stop offset="100%" stopColor="#3AACCE"/>
          </linearGradient>
          <filter id={`glow-${uid}`}>
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Antenna base */}
        <rect x="37" y="9" width="6" height="3" rx="1.5" fill="#2D7A9A"/>
        {/* Antenna pole */}
        <line x1="40" y1="9" x2="40" y2="4" stroke="#4AAECC" strokeWidth="1.8" strokeLinecap="round"/>
        {/* Antenna ball with pulse */}
        <circle cx="40" cy="3.5" r="2.5" fill={`url(#ge-${uid})`} filter={`url(#glow-${uid})`}>
          <animate attributeName="opacity" values="1;0.5;1" dur="1.8s" repeatCount="indefinite"/>
        </circle>
        {mood !== 'thinking' && (
          <circle cx="40" cy="3.5" r="2.5" fill="none" stroke="#7FD4F0" strokeWidth="1">
            <animate attributeName="r"       values="2.5;6"   dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.7;0"   dur="2s" repeatCount="indefinite"/>
          </circle>
        )}

        {/* ── HEAD (rounded rectangle) ─────────────────────── */}
        <rect x="14" y="12" width="52" height="44" rx="11" fill={`url(#gh-${uid})`}/>
        {/* Head top shine */}
        <rect x="20" y="14" width="36" height="6" rx="4" fill="white" opacity="0.08"/>
        {/* Head side bolts */}
        <circle cx="18" cy="22" r="2.8" fill="#1A4260" stroke="#3AACCE" strokeWidth="1"/>
        <circle cx="62" cy="22" r="2.8" fill="#1A4260" stroke="#3AACCE" strokeWidth="1"/>
        <circle cx="18" cy="48" r="2.8" fill="#1A4260" stroke="#3AACCE" strokeWidth="1"/>
        <circle cx="62" cy="48" r="2.8" fill="#1A4260" stroke="#3AACCE" strokeWidth="1"/>

        {/* ── EYES (LED screens) ───────────────────────────── */}
        {/* Eye frames */}
        <rect x="22" y="24" width="14" height="13" rx="3.5" fill="#0F2535" stroke="#3AACCE" strokeWidth="1.2"/>
        <rect x="44" y="24" width="14" height="13" rx="3.5" fill="#0F2535" stroke="#3AACCE" strokeWidth="1.2"/>

        {/* Eye glow / LED */}
        {mood === 'thinking' ? (
          <>
            {/* Spinning arc for thinking */}
            <circle cx={lx} cy={ly} r="4" fill="none" stroke="#7FD4F0" strokeWidth="1.5" strokeDasharray="8 4">
              <animateTransform attributeName="transform" type="rotate" values={`0 ${lx} ${ly};360 ${lx} ${ly}`} dur="1.2s" repeatCount="indefinite"/>
            </circle>
            <circle cx={rx} cy={ry} r="4" fill="none" stroke="#7FD4F0" strokeWidth="1.5" strokeDasharray="8 4">
              <animateTransform attributeName="transform" type="rotate" values={`0 ${rx} ${ry};360 ${rx} ${ry}`} dur="1.2s" repeatCount="indefinite"/>
            </circle>
          </>
        ) : mood === 'happy' ? (
          <>
            {/* Happy arc eyes */}
            <path d={`M ${lx-4} ${ly+1} Q ${lx} ${ly-4} ${lx+4} ${ly+1}`} fill="none" stroke="#7FD4F0" strokeWidth="2" strokeLinecap="round"/>
            <path d={`M ${rx-4} ${ry+1} Q ${rx} ${ry-4} ${rx+4} ${ry+1}`} fill="none" stroke="#7FD4F0" strokeWidth="2" strokeLinecap="round"/>
          </>
        ) : mood === 'alert' ? (
          <>
            <circle cx={lx} cy={ly} r="4.5" fill="#FF6B6B" opacity="0.9" filter={`url(#glow-${uid})`}>
              <animate attributeName="opacity" values="0.9;0.3;0.9" dur="0.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx={rx} cy={ry} r="4.5" fill="#FF6B6B" opacity="0.9" filter={`url(#glow-${uid})`}>
              <animate attributeName="opacity" values="0.9;0.3;0.9" dur="0.5s" repeatCount="indefinite"/>
            </circle>
          </>
        ) : (
          <>
            {/* Normal LED eyes */}
            <circle cx={lx} cy={ly} r="4.5" fill={`url(#ge-${uid})`} filter={`url(#glow-${uid})`}>
              <animate attributeName="opacity" values="1;0.7;1" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx={rx} cy={ry} r="4.5" fill={`url(#ge-${uid})`} filter={`url(#glow-${uid})`}>
              <animate attributeName="opacity" values="1;0.7;1" dur="3s" repeatCount="indefinite"/>
            </circle>
            {/* Pupils */}
            <circle cx={lx+1} cy={ly+1} r="2" fill="#0A1F2E"/>
            <circle cx={rx+1} cy={ry+1} r="2" fill="#0A1F2E"/>
            {/* Shine dot */}
            <circle cx={lx+2} cy={ly-1} r="1" fill="white" opacity="0.9"/>
            <circle cx={rx+2} cy={ry-1} r="1" fill="white" opacity="0.9"/>
          </>
        )}

        {/* ── MOUTH / DISPLAY BAR ──────────────────────────── */}
        <rect x="25" y="42" width="30" height="8" rx="3" fill="#0F2535" stroke="#2D7A9A" strokeWidth="0.8"/>
        {mood === 'thinking' ? (
          /* Scanning line animation */
          <rect x="26" y="43" width="28" height="6" rx="2" fill="#3AACCE" opacity="0.15">
            <animate attributeName="opacity" values="0.15;0.5;0.15" dur="1s" repeatCount="indefinite"/>
          </rect>
        ) : (
          <path d={mouths[mood] ?? mouths.idle}
            fill="none" stroke="#7FD4F0" strokeWidth="2" strokeLinecap="round"/>
        )}

        {/* ── NECK ──────────────────────────────────────────── */}
        <rect x="34" y="56" width="12" height="6" rx="2" fill="#1A4260"/>
        <rect x="36" y="57" width="8" height="2" rx="1" fill="#2D7A9A" opacity="0.5"/>

        {/* ── BODY ──────────────────────────────────────────── */}
        <rect x="20" y="62" width="40" height="16" rx="7" fill={`url(#gb-${uid})`}/>
        {/* Chest panel */}
        <rect x="27" y="66" width="26" height="8" rx="3" fill="#0F2535" stroke="#2D7A9A" strokeWidth="0.8"/>
        {/* Status LEDs on chest */}
        <circle cx="32" cy="70" r="2" fill="#3AACCE">
          <animate attributeName="opacity" values="1;0.3;1" dur="2.1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="40" cy="70" r="2" fill={mood === 'alert' ? '#FF6B6B' : mood === 'happy' ? '#4ADE80' : '#3AACCE'}>
          <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.4s" repeatCount="indefinite"/>
        </circle>
        <circle cx="48" cy="70" r="2" fill="#3AACCE">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite"/>
        </circle>

        {/* Happy stars */}
        {mood === 'happy' && <>
          <text x="4"  y="24" fontSize="9" fill="#7FD4F0" opacity="0.8">✦</text>
          <text x="68" y="20" fontSize="7" fill="#7FD4F0" opacity="0.7">✦</text>
        </>}
      </svg>
    </>
  )
}

// Mini Confi robot for conversation avatar
function ConfiMini() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" style={{ display: 'block', flexShrink: 0 }}>
      {/* Head */}
      <rect x="4" y="5" width="22" height="18" rx="5" fill="#235069"/>
      {/* Antenna */}
      <line x1="15" y1="5" x2="15" y2="2" stroke="#4AAECC" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="15" cy="1.5" r="1.5" fill="#7FD4F0"/>
      {/* Eyes */}
      <rect x="7" y="10" width="6" height="5" rx="1.5" fill="#0F2535" stroke="#3AACCE" strokeWidth="0.8"/>
      <rect x="17" y="10" width="6" height="5" rx="1.5" fill="#0F2535" stroke="#3AACCE" strokeWidth="0.8"/>
      <circle cx="10" cy="12.5" r="1.8" fill="#7FD4F0"/>
      <circle cx="20" cy="12.5" r="1.8" fill="#7FD4F0"/>
      {/* Mouth */}
      <rect x="9" y="18" width="12" height="3" rx="1.2" fill="#0F2535" stroke="#2D7A9A" strokeWidth="0.6"/>
      <path d="M 10 19.5 Q 15 21.5 20 19.5" fill="none" stroke="#7FD4F0" strokeWidth="1" strokeLinecap="round"/>
      {/* Body */}
      <rect x="8" y="24" width="14" height="5" rx="3" fill="#1A4260"/>
    </svg>
  )
}

// ─── Mic button ───────────────────────────────────────────────────────────────
function MicButton({ onTranscript, disabled }) {
  const [recording, setRecording] = useState(false)
  const recRef = useRef(null)

  const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  if (!supported) return null

  const toggle = () => {
    if (recording) {
      recRef.current?.stop()
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'es'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = e => { onTranscript(e.results[0][0].transcript); setRecording(false) }
    rec.onerror  = () => setRecording(false)
    rec.onend    = () => setRecording(false)
    rec.start()
    recRef.current = rec
    setRecording(true)
  }

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={recording ? 'Detener' : 'Hablar'}
      style={{
        width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0,
        background: recording ? '#FEF2F2' : '#F1F5F9',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', transition: 'background 0.2s',
      }}
    >
      {recording && (
        <span style={{
          position: 'absolute', inset: -3, borderRadius: 12,
          border: '2px solid #FCA5A5',
          animation: 'mic-pulse 1s ease-out infinite',
        }}/>
      )}
      <style>{`@keyframes mic-pulse{0%{opacity:.8;transform:scale(1)}100%{opacity:0;transform:scale(1.5)}}`}</style>
      <Icon
        d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3zM19 10a7 7 0 01-14 0M12 19v3M8 22h8"
        size={16}
        color={recording ? '#DC2626' : '#64748B'}
        stroke={1.8}
      />
    </button>
  )
}

// ─── Input row ────────────────────────────────────────────────────────────────
function InputRow({ value, onChange, onSubmit, disabled, placeholder, autoFocus }) {
  const ref = useRef(null)
  useEffect(() => { if (autoFocus) ref.current?.focus() }, [autoFocus])
  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() } }
  const active = value.trim() && !disabled

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 6,
      background: '#fff', border: '1.5px solid',
      borderColor: disabled ? '#E8EFFE' : '#BFDBFE',
      borderRadius: 16, padding: '6px 6px 6px 16px',
      boxShadow: disabled ? 'none' : '0 2px 14px rgba(59,130,246,0.10)',
      transition: 'box-shadow 0.2s, border-color 0.2s',
    }}>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKey}
        disabled={disabled}
        placeholder={disabled ? 'Analizando...' : placeholder}
        rows={1}
        style={{
          flex: 1, border: 'none', outline: 'none', resize: 'none',
          background: 'transparent', color: '#1E293B', fontSize: 14,
          fontFamily: 'inherit', lineHeight: 1.5, padding: '6px 0',
          opacity: disabled ? 0.5 : 1,
        }}
      />
      <MicButton onTranscript={t => { onChange(t) }} disabled={disabled} />
      <button
        onClick={onSubmit}
        disabled={!active}
        style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0, border: 'none',
          background: active ? 'var(--gradient-primary)' : 'var(--bg-surface-2)',
          cursor: active ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: active ? '0 2px 10px rgba(59,130,246,0.30)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        <Icon d="M5 12h14M12 5l7 7-7 7" size={15} color={active ? '#fff' : '#94A3B8'} stroke={2.2}/>
      </button>
    </div>
  )
}

// ─── Agent action button ──────────────────────────────────────────────────────
function ActionButton({ action, nodes, setNodes }) {
  const [state, setState] = useState('idle') // idle | done

  const execute = () => {
    if (action.type === 'changeStatus') {
      setNodes(prev => prev.map(n => n.id === action.nodeId ? { ...n, status: action.newStatus } : n))
    }
    setState('done')
  }

  if (state === 'done') {
    return (
      <div style={{
        padding: '8px 13px', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 7,
        background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', fontSize: 12.5, fontWeight: 600,
      }}>
        <span>✓</span> Listo
      </div>
    )
  }

  return (
    <button
      onClick={execute}
      style={{
        padding: '8px 13px', borderRadius: 9, border: '1.5px solid #BFDBFE',
        background: '#fff', color: '#2563EB', fontSize: 12.5, fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
    >
      <Icon d="M5 12h14M12 5l7 7-7 7" size={12} color="#3B82F6" stroke={2.2}/>
      {action.label}
    </button>
  )
}

// ─── Decision card ────────────────────────────────────────────────────────────
function DecisionCard({ node, onGoTree }) {
  const u = URGENCY[node.urgency] ?? URGENCY.ok
  const s = STATUS[node.status]
  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: '1px solid #E8EFFE',
      overflow: 'hidden', flex: '1 1 0', minWidth: 0,
      boxShadow: '0 1px 4px rgba(59,130,246,0.06)',
    }}>
      <div style={{ height: 3, background: u.color }}/>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: u.bg, border: `1px solid ${u.border}`, color: u.color }}>{u.label}</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>{s.label}</span>
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: 600, marginBottom: 2 }}>{node.code}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', lineHeight: 1.3 }}>{node.title}</div>
        </div>
        <div style={{ fontSize: 11.5, color: '#64748B' }}>{node.owner}</div>
        <div style={{ marginTop: 'auto' }}>
          {node.remaining === null ? null
            : node.remaining < 0
              ? <span style={{ fontSize: 12.5, fontWeight: 800, color: '#DC2626' }}>{Math.abs(node.remaining)}d vencido</span>
              : <span style={{ fontSize: 12.5, fontWeight: 800, color: u.color }}>{node.remaining === 0 ? 'Vence hoy' : `${node.remaining}d`}</span>
          }
          {node.impactDays > 0 && <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 1 }}>+{node.impactDays}d impacto</div>}
        </div>
        <button onClick={onGoTree} style={{ padding: '6px', borderRadius: 7, border: `1px solid ${u.border}`, background: u.bg, color: u.color, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          Ver en árbol <Icon d="M5 12h14M12 5l7 7-7 7" size={11} color={u.color} stroke={2.2}/>
        </button>
      </div>
    </div>
  )
}

// ─── Risk card ────────────────────────────────────────────────────────────────
function RiskCard({ prediction }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #FDE68A', overflow: 'hidden', boxShadow: '0 1px 4px rgba(245,158,11,0.07)' }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg,#F59E0B,#EF4444)' }}/>
      <div style={{ padding: '13px 17px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>⚠️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#D97706', letterSpacing: 0.5, marginBottom: 5 }}>PREDICCIÓN DE RIESGO</div>
          <div style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.55 }}>{prediction.message}</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
            <div><div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 1 }}>Días en riesgo</div><div style={{ fontSize: 20, fontWeight: 800, color: '#D97706' }}>{prediction.affectedDays}d</div></div>
            <div><div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 1 }}>Costo en riesgo</div><div style={{ fontSize: 20, fontWeight: 800, color: '#D97706' }}>S/ {fmt(prediction.affectedCost)}</div></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Full agent response ──────────────────────────────────────────────────────
function FullResponse({ result, setActive, nodes, setNodes }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Summary bubble */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <ConfiMini />
        <div style={{ flex: 1, padding: '12px 16px', borderRadius: '4px 14px 14px 14px', background: '#fff', border: '1px solid #E8EFFE', fontSize: 13.5, color: '#1E293B', lineHeight: 1.6, boxShadow: '0 1px 4px rgba(59,130,246,0.06)' }}>
          {result.summary}
        </div>
      </div>

      {/* Decision cards */}
      {result.criticalDecisions.length > 0 && (
        <div style={{ paddingLeft: 40 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Requieren atención</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {result.criticalDecisions.map(n => <DecisionCard key={n.id} node={n} onGoTree={() => setActive('arbol')}/>)}
          </div>
        </div>
      )}

      {/* Risk */}
      <div style={{ paddingLeft: 40 }}><RiskCard prediction={result.riskPrediction}/></div>

      {/* Suggestions */}
      <div style={{ paddingLeft: 40 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8EFFE', padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15 }}>📋</span> Próximos pasos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {result.suggestions.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: 'var(--blue-bg)', border: '1.5px solid var(--blue-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--blue)' }}>{i + 1}</span>
                <span style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.55, paddingTop: 1 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent actions — the magic */}
      {result.actions?.length > 0 && (
        <div style={{ paddingLeft: 40 }}>
          <div style={{ background: 'var(--blue-bg)', borderRadius: 12, border: '1.5px solid var(--blue-border)', padding: '14px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
              <ConfiMini/>
              <span>Confi puede hacerlo ahora</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {result.actions.map((action, i) => (
                <ActionButton key={i} action={action} nodes={nodes} setNodes={setNodes}/>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nav actions */}
      <div style={{ paddingLeft: 40, display: 'flex', gap: 8 }}>
        <button onClick={() => setActive('arbol')} style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--blue-bg)', border: '1.5px solid var(--blue-border)', color: 'var(--blue)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon d="M12 3v4M5 21v-6M19 21v-6M12 11v4M4 11h16" size={13} color="var(--blue)"/>
          Árbol
        </button>
        <button onClick={() => setActive('decisiones')} style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--bg-surface)', border: '1.5px solid var(--border)', color: 'var(--text-3)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" size={13} color="var(--text-4)"/>
          Tablero
        </button>
      </div>
    </div>
  )
}

// ─── Compact previous turn ────────────────────────────────────────────────────
function CompactTurn({ turn }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: 0.55 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ maxWidth: '72%', padding: '8px 14px', borderRadius: '12px 4px 12px 12px', background: '#BFDBFE', color: '#1E3A8A', fontSize: 13, lineHeight: 1.45 }}>{turn.query}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <ConfiMini/>
        <div style={{ flex: 1, padding: '9px 13px', borderRadius: '4px 12px 12px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
          {turn.result.summary}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ViewAgente({ nodes, setNodes, setActive, projectName }) {
  const [turns,        setTurns]        = useState([])
  const [input,        setInput]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [pendingQuery, setPendingQuery] = useState('')
  const bottomRef = useRef(null)

  const exportPDF = () => {
    const win = window.open('', '_blank')
    const lastResult = turns[turns.length - 1]?.result
    if (!win || !lastResult) return
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>ConferSafe — ${projectName || 'Reporte'}</title>
      <style>
        body{font-family:system-ui,sans-serif;color:#1E293B;padding:32px;max-width:720px;margin:0 auto}
        h1{font-size:22px;font-weight:800;margin-bottom:4px}
        .meta{font-size:12px;color:#94A3B8;margin-bottom:24px}
        .section{margin-bottom:20px;padding:16px;border-radius:10px;background:#F8FAFC;border:1px solid #E2E8F0}
        .section h2{font-size:12px;font-weight:700;color:#94A3B8;letter-spacing:.5px;margin:0 0 8px;text-transform:uppercase}
        .section p{font-size:14px;margin:0;line-height:1.6}
        .chip{display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;margin:3px 3px 3px 0}
        .risk{background:#FEF2F2;color:#DC2626;border:1px solid #FECACA}
        .soon{background:#FFFBEB;color:#D97706;border:1px solid #FDE68A}
        .ok{background:#ECFDF5;color:#059669;border:1px solid #A7F3D0}
        ul{margin:8px 0 0;padding:0 0 0 18px;font-size:14px;line-height:1.8}
        .footer{margin-top:32px;font-size:11px;color:#CBD5E1;text-align:right}
      </style></head><body>
      <h1>ConferSafe — ${projectName || 'Reporte de Proyecto'}</h1>
      <div class="meta">Generado el ${new Date().toLocaleDateString('es-PE', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
      <div class="section"><h2>Resumen</h2><p>${lastResult.summary}</p></div>
      <div class="section"><h2>Alerta de riesgo</h2><p>${lastResult.riskPrediction?.message || '—'}</p></div>
      <div class="section"><h2>Decisiones críticas</h2>
        ${(lastResult.criticalDecisions || []).map(n => `<div style="margin-bottom:10px"><strong>${n.title}</strong> <span class="chip ${n.urgency === 'critical' ? 'risk' : n.urgency === 'soon' ? 'soon' : 'ok'}">${n.remaining != null ? (n.remaining < 0 ? `${Math.abs(n.remaining)}d vencido` : `${n.remaining}d`) : '—'}</span><br><small style="color:#94A3B8">${n.owner} · ${n.code}</small></div>`).join('')}
      </div>
      <div class="section"><h2>Sugerencias</h2>
        <ul>${(lastResult.suggestions || []).map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
      <div class="footer">ConferSafe v2.0 — Gestión de decisiones de proyectos</div>
      </body></html>`)
    win.document.close()
    win.print()
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns.length, loading])

  const submit = async (text) => {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setPendingQuery(q)
    setInput('')
    setLoading(true)
    try {
      const result = await analyze(q, nodes)
      setTurns(prev => [...prev, { query: q, result }])
    } catch { /* silent */ }
    finally { setLoading(false); setPendingQuery('') }
  }

  const urgentCount = nodes.filter(n => n.status === 'risk' || (n.remaining !== null && n.remaining <= 3)).length
  const isIdle = turns.length === 0 && !loading

  // ── IDLE ───────────────────────────────────────────────────────────────────
  if (isIdle) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: '#F7FAFF' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Confi mood="idle" size={96}/>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue-light)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              Hola, soy Confi ✦
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1E293B', letterSpacing: -0.4 }}>
              ¿En qué puedo ayudarte?
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#64748B' }}>
              {projectName || 'Proyecto'}
              {urgentCount > 0 && (
                <span style={{ marginLeft: 8, padding: '2px 9px', borderRadius: 20, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 12, fontWeight: 700 }}>
                  {urgentCount} urgentes
                </span>
              )}
            </p>
          </div>

          <InputRow value={input} onChange={setInput} onSubmit={() => submit()} placeholder="Pregunta sobre el proyecto..." autoFocus/>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
            {CHIPS.map((c, i) => (
              <button key={i} onClick={() => submit(c.text)} style={{
                padding: '11px 16px', borderRadius: 12, textAlign: 'left',
                background: '#fff', border: '1.5px solid #E8EFFE',
                color: '#475569', fontSize: 13.5, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 1px 3px rgba(59,130,246,0.05)', transition: 'border-color 0.15s, transform 0.1s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#93C5FD'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8EFFE'; e.currentTarget.style.transform = 'none' }}
              >
                <span style={{ fontSize: 17 }}>{c.emoji}</span>
                {c.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── CONVERSATION ──────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F7FAFF', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 12px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Previous turns */}
          {turns.slice(0, -1).map((t, i) => <CompactTurn key={i} turn={t}/>)}

          {/* Latest turn */}
          {turns.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ maxWidth: '72%', padding: '10px 16px', borderRadius: '14px 4px 14px 14px', background: 'var(--blue)', color: '#fff', fontSize: 13.5, lineHeight: 1.5, boxShadow: 'var(--shadow-md)' }}>
                  {turns[turns.length - 1].query}
                </div>
              </div>
              <FullResponse result={turns[turns.length - 1].result} setActive={setActive} nodes={nodes} setNodes={setNodes}/>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ maxWidth: '72%', padding: '10px 16px', borderRadius: '14px 4px 14px 14px', background: 'var(--blue)', color: '#fff', fontSize: 13.5, lineHeight: 1.5, boxShadow: 'var(--shadow-md)' }}>
                  {pendingQuery}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ animation: 'confi-bob 1s ease-in-out infinite' }}>
                  <Confi mood="thinking" size={46}/>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: '4px 14px 14px 14px', background: '#fff', border: '1px solid #E8EFFE', boxShadow: '0 1px 4px rgba(59,130,246,0.07)' }}>
                  <style>{`@keyframes bl{0%,80%,100%{opacity:.2}40%{opacity:1}} .db{width:6px;height:6px;border-radius:50%;background:#BFDBFE;display:inline-block;animation:bl 1.2s infinite ease-in-out} .db:nth-child(2){animation-delay:.15s} .db:nth-child(3){animation-delay:.3s}`}</style>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    <span className="db"/><span className="db"/><span className="db"/>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef}/>
        </div>
      </div>

      {/* Bottom input */}
      <div style={{ padding: '12px 32px 20px', borderTop: '1px solid #F0F5FF', background: '#F7FAFF' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <InputRow value={input} onChange={setInput} onSubmit={() => submit()} disabled={loading} placeholder="Siguiente pregunta..."/>
          </div>
          {turns.length > 0 && (
            <button
              onClick={exportPDF}
              title="Exportar a PDF"
              style={{ height: 38, padding: '0 12px', borderRadius: 10, background: 'var(--bg-surface)', border: '1.5px solid var(--border)', color: 'var(--text-3)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, transition: 'border-color 0.15s, color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-border)'; e.currentTarget.style.color = 'var(--blue)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' }}
            >
              <Icon d="M12 10v6m0 0l-3-3m3 3l3-3M3 17a4 4 0 004 4h10a4 4 0 004-4" size={14} stroke={2}/>
              PDF
            </button>
          )}
          <button
            onClick={() => { setTurns([]); setInput('') }}
            title="Nueva conversación"
            style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-surface)', border: '1.5px solid var(--border)', color: 'var(--text-4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue-border)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <Icon d="M3 12a9 9 0 109-9M3 3v5h5" size={14} stroke={2}/>
          </button>
        </div>
      </div>
    </div>
  )
}
