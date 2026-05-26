import { useState } from 'react'
import { NAV_ITEMS, PROJECTS } from '../data'
import { Icon } from './ui'

export default function Sidebar({ active, setActive, alertCount, progress, completedCount, totalCount, projectId, setProjectId }) {
  const [showProjects, setShowProjects] = useState(false)
  const currentProject = PROJECTS.find(p => p.id === projectId) || PROJECTS[0]

  return (
    <aside style={{
      width: 250, background: '#023047',
      borderRight: '1px solid var(--border)',
      boxShadow: '2px 0 12px rgba(59,130,246,0.06)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      height: '100vh', position: 'sticky', top: 0,
      transition: 'background 0.25s, border-color 0.25s',
    }}>

      {/* Logo */}
      <div style={{ padding: '20px 18px 14px', background : '#023047'  }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/logo.png"
            alt="ConferSafe"
            style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'contain', flexShrink: 0}}
          />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'white', letterSpacing: -0.3 }}>ConferSafe</div>
            <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 1 }}>Gestión de decisiones</div>
          </div>
        </div>
      </div>

      {/* Project selector */}
      <div style={{ padding: '0 12px 14px', position: 'relative' }}>
        <button
          onClick={() => setShowProjects(s => !s)}
          style={{
            width: '100%', padding: '9px 11px', borderRadius: 10,
            background: 'white', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <span style={{
            width: 26, height: 26, borderRadius: 7, flexShrink: 0,
            background: `linear-gradient(135deg,${currentProject.color},${currentProject.color}99)`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9.5, fontWeight: 800, color: '#fff',
          }}>{currentProject.abbr}</span>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentProject.name}
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-4)', marginTop: 1 }}>{currentProject.location}</div>
          </div>
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0, transform: showProjects ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M2 3.5l3 3 3-3" stroke="var(--text-4)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Dropdown */}
        {showProjects && (
          <div style={{
            position: 'absolute', top: 'calc(100% - 4px)', left: 12, right: 12, zIndex: 50,
            background: 'white', border: '1px solid var(--border)',
            borderRadius: 10, boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
            animation: 'dropDown 0.12s ease-out',
          }}>
            <style>{`@keyframes dropDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}`}</style>
            {PROJECTS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => { setProjectId(p.id); setShowProjects(false) }}
                style={{
                  width: '100%', padding: '10px 12px', border: 'none', cursor: 'pointer',
                  background: p.id === projectId ? 'var(--blue-bg)' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
                  borderBottom: i < PROJECTS.length - 1 ? '1px solid var(--border-light)' : 'none',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (p.id !== projectId) e.currentTarget.style.background = 'var(--bg-surface-3)' }}
                onMouseLeave={e => { if (p.id !== projectId) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  background: `linear-gradient(135deg,${p.color},${p.color}99)`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: '#fff',
                }}>{p.abbr}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{p.location}</div>
                </div>
                {p.id === projectId && <span style={{ color: 'var(--blue)', fontSize: 13, flexShrink: 0 }}>✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {totalCount > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: 'white', fontWeight: 600 }}>Progreso</span>
              <span style={{ fontSize: 11, color: 'white', fontWeight: 800 }}>{progress}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3, width: `${progress}%`,
                background: progress === 100
                  ? 'linear-gradient(90deg,#10B981,#059669)'
                  : 'var(--gradient-primary)',
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-5)', marginTop: 4 }}>
              {completedCount} de {totalCount} cerradas
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ padding: '0 10px', flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.key === active
          const isAgent  = item.key === 'agente'
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 11px', marginBottom: 3,
                background: isActive ? 'var(--blue-bg)' : 'transparent',
                border: isActive ? '1px solid var(--blue-border)' : '1px solid transparent',
                borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                color: isActive ? 'var(--blue)' : 'var(--text-3)',
                fontWeight: isActive ? 700 : 500,
                fontSize: 13, transition: 'all 0.15s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-surface-3)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              {isActive && (
                <span style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 18, borderRadius: 2,
                  background: 'var(--blue)',
                }} />
              )}
              <Icon
                d={item.icon}
                size={15}
                stroke={isActive ? 2 : 1.6}
                color={isActive ? 'var(--blue)' : 'var(--text-4)'}
              />
              <span style={{ flex: 1 }}>{item.label}</span>

              {isAgent && alertCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                  background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
                }}>{alertCount}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 12px 16px', borderTop: '1px solid var(--border-light)' }}>
        {/* Alert status */}
        <div style={{
          padding: '10px 12px', borderRadius: 10,
          background: alertCount > 0 ? '#FFFBEB' : '#F0FDF4',
          border: `1px solid ${alertCount > 0 ? '#FDE68A' : '#BBF7D0'}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>{alertCount > 0 ? '⚠️' : '✅'}</span>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1E293B' }}>
              {alertCount > 0 ? `${alertCount} urgentes` : 'Todo al día'}
            </div>
            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>
              {alertCount > 0 ? 'Requieren atención' : 'Sin alertas activas'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
