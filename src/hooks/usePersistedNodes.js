import { useState, useEffect, useRef } from 'react'
import { INITIAL_NODES, INITIAL_NODES_CC } from '../data'

function getDefaults(projectId) {
  return projectId === 'cc-el-sol' ? INITIAL_NODES_CC : INITIAL_NODES
}

function storageKey(projectId) {
  return `confersafe_nodes_${projectId}_v1`
}

function loadNodes(projectId) {
  try {
    const raw = localStorage.getItem(storageKey(projectId))
    return raw ? JSON.parse(raw) : getDefaults(projectId)
  } catch {
    return getDefaults(projectId)
  }
}

export function usePersistedNodes(projectId = 'edificio-mirador') {
  const [nodes, setNodes] = useState(() => loadNodes(projectId))
  const prevProjectRef = useRef(projectId)

  // When project switches, load the new project's nodes
  useEffect(() => {
    if (prevProjectRef.current !== projectId) {
      prevProjectRef.current = projectId
      setNodes(loadNodes(projectId))
    }
  }, [projectId])

  // Persist on every change
  useEffect(() => {
    try { localStorage.setItem(storageKey(projectId), JSON.stringify(nodes)) } catch { /* storage full */ }
  }, [nodes, projectId])

  const reset = () => setNodes(getDefaults(projectId))

  return [nodes, setNodes, reset]
}
