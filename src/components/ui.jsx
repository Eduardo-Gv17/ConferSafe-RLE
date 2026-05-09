import { STATUS } from '../data'

export const Icon = ({ d, size = 16, stroke = 1.6, style, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color || 'currentColor'} strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round" style={style}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

export const StatusBadge = ({ status, small }) => {
  const s = STATUS[status]
  if (!s) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: small ? '2px 8px' : '4px 10px',
      borderRadius: 20, fontSize: small ? 10.5 : 12, fontWeight: 600,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

export const Avatar = ({ name, size = 28, color = '#3B82F6' }) => {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      background: `${color}18`,
      border: `1.5px solid ${color}40`,
      color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, letterSpacing: 0.2, flexShrink: 0,
    }}>{initials}</span>
  )
}
