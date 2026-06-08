import { useState } from 'react'
import { NAV_ITEMS, PROJECTS } from '../data'
import { Icon } from './ui'

export default function Sidebar({ active, setActive, alertCount, progress, completedCount, totalCount, projectId, setProjectId }) {
  const [showProjects, setShowProjects] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const currentProject = PROJECTS.find(p => p.id === projectId) || PROJECTS[0]

  return (
    <>
      <style>{`
        @keyframes dropDown {
          from { opacity: 0; transform: translateY(-6px) }
          to   { opacity: 1; transform: none }
        }
        .sidebar-tooltip {
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          background: #1E293B;
          color: #fff;
          font-size: 11.5px;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 7px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s;
          z-index: 999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .sidebar-tooltip::before {
          content: '';
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: #1E293B;
        }
        .nav-btn:hover .sidebar-tooltip {
          opacity: 1;
        }
      `}</style>

      <aside style={{
        width: collapsed ? 64 : 250,
        background: '#023047',
        borderRight: '1px solid var(--border)',
        boxShadow: '2px 0 12px rgba(59,130,246,0.06)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}>

        {/* Logo + Toggle button */}
        <div style={{
          padding: '16px 12px 14px',
          background: '#023047',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 8,
          minHeight: 60,
        }}>
          {/* Logo section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            overflow: 'hidden',
            flex: collapsed ? 'none' : 1,
          }}>
            <img
              src="/logo.png"
              alt="ConferSafe"
              style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'contain', flexShrink: 0 }}
            />
            {!collapsed && (
              <div style={{ lineHeight: 1.2, overflow: 'hidden' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'white', letterSpacing: -0.3, whiteSpace: 'nowrap' }}>ConferSafe</div>
                <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 1, whiteSpace: 'nowrap' }}>Gestión de decisiones</div>
              </div>
            )}
          </div>

          {/* Toggle button */}
          {!collapsed && (
            <button
              onClick={() => { setCollapsed(true); setShowProjects(false) }}
              title="Colapsar barra"
              style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.7)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              {/* Left arrow / collapse icon */}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Expand button (shown when collapsed, centered) */}
        {collapsed && (
          <div style={{ padding: '0 10px 10px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setCollapsed(false)}
              title="Expandir barra"
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.7)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 2L8.5 6l-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* Project selector — solo en expanded */}
        {!collapsed && (
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
        )}

        {/* Project avatar in collapsed mode */}
        {collapsed && (
          <div style={{ padding: '0 10px 14px', display: 'flex', justifyContent: 'center' }}>
            <div
              title={currentProject.name}
              style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg,${currentProject.color},${currentProject.color}99)`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: '#fff',
                cursor: 'default',
              }}
            >{currentProject.abbr}</div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ padding: '0 10px', flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const isActive = item.key === active
            const isAgent  = item.key === 'agente'
            return (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className="nav-btn"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: collapsed ? 0 : 9,
                  padding: collapsed ? '9px 0' : '9px 11px',
                  marginBottom: 3,
                  background: isActive ? 'var(--blue-bg)' : 'transparent',
                  border: isActive ? '1px solid var(--blue-border)' : '1px solid transparent',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: isActive ? 'var(--blue)' : 'var(--text-3)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13,
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-surface-3)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                {isActive && !collapsed && (
                  <span style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 18, borderRadius: 2,
                    background: 'var(--blue)',
                  }} />
                )}
                <Icon
                  d={item.icon}
                  size={collapsed ? 18 : 15}
                  stroke={isActive ? 2 : 1.6}
                  color={isActive ? 'var(--blue)' : 'var(--text-4)'}
                />
                {!collapsed && (
                  <span style={{ flex: 1 }}>{item.label}</span>
                )}
                {!collapsed && isAgent && alertCount > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                    background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
                  }}>{alertCount}</span>
                )}
                {/* Badge punto rojo en collapsed */}
                {collapsed && isAgent && alertCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#DC2626',
                    border: '1.5px solid #023047',
                  }} />
                )}
                {/* Tooltip en collapsed */}
                {collapsed && (
                  <span className="sidebar-tooltip">
                    {item.label}
                    {isAgent && alertCount > 0 ? ` (${alertCount})` : ''}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 12px 16px', borderTop: '1px solid var(--border-light)' }}>
          {collapsed ? (
            /* Versión colapsada: solo emoji centrado con tooltip */
            <div
              style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                height: 36, position: 'relative', cursor: 'default',
              }}
              className="nav-btn"
            >
              <span style={{ fontSize: 18 }}>{alertCount > 0 ? '⚠️' : '✅'}</span>
              {alertCount > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 4,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#F59E0B', border: '1.5px solid #023047',
                }} />
              )}
              <span className="sidebar-tooltip">
                {alertCount > 0 ? `${alertCount} urgentes` : 'Todo al día'}
              </span>
            </div>
          ) : (
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
          )}
        </div>
      </aside>
    </>
  )
}