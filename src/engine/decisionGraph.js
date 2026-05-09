/**
 * Pure graph utilities — no React, no DOM.
 * All functions are deterministic and testable with Node.js directly.
 */

/** Build parent→children adjacency map */
export function buildAdjacency(nodes) {
  const adj = {}
  nodes.forEach(n => { adj[n.id] = [] })
  nodes.forEach(n => {
    if (n.parent && adj[n.parent]) adj[n.parent].push(n.id)
  })
  return adj
}

/** All descendant IDs (BFS) starting from `id` */
export function getDescendants(id, adj) {
  const result = []
  const queue = [...(adj[id] || [])]
  while (queue.length) {
    const cur = queue.shift()
    result.push(cur)
    ;(adj[cur] || []).forEach(c => queue.push(c))
  }
  return result
}

/** Ordered list of ancestor nodes from root → direct parent of `nodeId` */
export function getAncestors(nodeId, nodes) {
  const map = Object.fromEntries(nodes.map(n => [n.id, n]))
  const path = []
  let cur = map[nodeId]
  while (cur && cur.parent) {
    cur = map[cur.parent]
    if (cur) path.unshift(cur)
  }
  return path
}

/** Full path from root down to `nodeId` (inclusive) */
export function getAncestorPath(nodeId, nodes) {
  const ancestors = getAncestors(nodeId, nodes)
  const map = Object.fromEntries(nodes.map(n => [n.id, n]))
  return [...ancestors, map[nodeId]].filter(Boolean)
}

/** Nodes on the critical path that are not yet done/approved, sorted by urgency */
export function getCriticalPending(nodes) {
  return nodes
    .filter(n => n.critical && n.status !== 'approved' && n.status !== 'done')
    .sort((a, b) => (a.remaining ?? 999) - (b.remaining ?? 999))
}

/** Classify urgency of a node based on remaining days + status */
export function urgencyOf(node) {
  if (node.status === 'risk' || (node.remaining !== null && node.remaining < 0)) return 'critical'
  if (node.remaining !== null && node.remaining <= 4) return 'soon'
  if (node.remaining !== null && node.remaining <= 10) return 'review'
  return 'ok'
}

/** Total impact (days + cost) of a set of nodes */
export function totalImpact(nodes) {
  return nodes.reduce(
    (acc, n) => ({ days: acc.days + n.impactDays, cost: acc.cost + n.impactCost }),
    { days: 0, cost: 0 }
  )
}
