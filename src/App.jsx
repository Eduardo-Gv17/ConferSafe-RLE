import { useState, useMemo, useEffect } from 'react'
import { usePersistedNodes } from './hooks/usePersistedNodes'
import { PROJECTS } from './data'
import Sidebar from './components/Sidebar'
import ViewAgente from './views/ViewAgente'
import ViewDecisiones from './views/ViewDecisiones'
import ViewTimeline from './views/ViewTimeline'
import ViewArbol from './views/ViewArbol'

export default function App() {
  const [view, setView] = useState('agente')
  const [projectId, setProjectId] = useState(() =>
    localStorage.getItem('confersafe_project') || 'edificio-mirador'
  )

  const currentProject = PROJECTS.find(p => p.id === projectId) || PROJECTS[0]

  useEffect(() => {
    localStorage.setItem('confersafe_project', projectId)
    // Go back to agent when switching projects
    setView('agente')
  }, [projectId])

  const [nodes, setNodes, resetNodes] = usePersistedNodes(projectId)

  // Browser notifications — fire once on mount for overdue decisions
  useEffect(() => {
    if (!('Notification' in window)) return
    const overdue = nodes.filter(n => n.remaining !== null && n.remaining < 0)
    if (overdue.length === 0) return
    Notification.requestPermission().then(perm => {
      if (perm !== 'granted') return
      new Notification('ConferSafe — Decisiones vencidas', {
        body: `${overdue.length} decisión${overdue.length > 1 ? 'es' : ''} vencida${overdue.length > 1 ? 's' : ''}: "${overdue[0].title}"`,
        icon: '/vite.svg',
        tag: 'confersafe-overdue',
      })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const alertCount = useMemo(() =>
    nodes.filter(n => n.status === 'risk' || (n.remaining !== null && n.remaining <= 3)).length
  , [nodes])

  const completedCount = useMemo(() =>
    nodes.filter(n => n.status === 'approved' || n.status === 'done').length
  , [nodes])

  const progress = Math.round((completedCount / nodes.length) * 100)

  const topbarLabel = {
    decisiones: 'Decisiones',
    timeline:   'Timeline',
    arbol:      'Árbol de Decisiones',
  }

  const views = {
    agente: <ViewAgente nodes={nodes} setNodes={setNodes} setActive={setView} projectName={currentProject.name} projectId={projectId} />,
    decisiones: <ViewDecisiones nodes={nodes} setNodes={setNodes} />,
    timeline:   <ViewTimeline nodes={nodes} setNodes={setNodes} />,
    arbol:      <ViewArbol nodes={nodes} setNodes={setNodes} />,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-app)' }}>
      <Sidebar
        active={view}
        setActive={setView}
        alertCount={alertCount}
        progress={progress}
        completedCount={completedCount}
        totalCount={nodes.length}
        projectId={projectId}
        setProjectId={setProjectId}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar — hidden on agente */}
        {view !== 'agente' && (
          <div style={{
            height: 48, borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 22px', flexShrink: 0,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-4)' }}>{currentProject.name}</span>
              <span style={{ color: 'var(--border)' }}>/</span>
              <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>
                {topbarLabel[view]}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {alertCount > 0 && (
                <button onClick={() => setView('agente')} style={{
                  padding: '5px 12px', borderRadius: 20,
                  border: '1.5px solid #FECACA', background: '#FEF2F2',
                  color: '#DC2626', fontSize: 11.5, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  ⚠️ {alertCount} urgentes · Preguntar al agente
                </button>
              )}
              <button onClick={resetNodes} title="Reiniciar al estado inicial" style={{
                padding: '5px 10px', borderRadius: 20,
                border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                color: 'var(--text-4)', fontSize: 11, cursor: 'pointer', fontWeight: 600,
              }}>
                ↺ Reset
              </button>
            </div>
          </div>
        )}

        <div style={{
          flex: 1,
          overflow: view === 'arbol' || view === 'decisiones' || view === 'timeline' ? 'hidden' : 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          {views[view] ?? views.agente}
        </div>
      </main>
    </div>
  )
}
