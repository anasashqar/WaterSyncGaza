/**
 * WaterSync — Routing Engine
 * محرك التوجيه: بناء الرسم البياني، A*، التقاط النقاط على الشوارع
 */
import type { RoutingGraph, GraphEdge, PathResult, SnapResult, ExclusionZone, GeoJSONData } from '@/types'
import { STREETS_OFFSET } from '@/lib/constants/geography'

// ============================================
// Haversine Distance
// ============================================

/** Haversine distance in km between two lat/lng pairs */
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Haversine distance in meters */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return Math.round(haversine(lat1, lng1, lat2, lng2) * 1000)
}

// ============================================
// Graph Building
// ============================================

/** Build a routing graph from GeoJSON LineString features */
export function buildRoutingGraph(geojson: GeoJSONData): RoutingGraph {
  const nodes: RoutingGraph['nodes'] = {}
  const edges: RoutingGraph['edges'] = {}
  const PRECISION = 10000 // 4 decimal places ≈ 11m snapping tolerance

  for (const feature of geojson.features) {
    if (feature.geometry?.type !== 'LineString') continue
    const coords = feature.geometry.coordinates as number[][]

    for (let i = 0; i < coords.length - 1; i++) {
      const lng1 = coords[i][0] + STREETS_OFFSET.lng
      const lat1 = coords[i][1] + STREETS_OFFSET.lat
      const lng2 = coords[i + 1][0] + STREETS_OFFSET.lng
      const lat2 = coords[i + 1][1] + STREETS_OFFSET.lat

      const n1 = `${Math.round(lat1 * PRECISION)}_${Math.round(lng1 * PRECISION)}`
      const n2 = `${Math.round(lat2 * PRECISION)}_${Math.round(lng2 * PRECISION)}`

      nodes[n1] = { lat: lat1, lng: lng1 }
      nodes[n2] = { lat: lat2, lng: lng2 }

      const dist = haversine(lat1, lng1, lat2, lng2)

      if (!edges[n1]) edges[n1] = []
      if (!edges[n2]) edges[n2] = []

      // Bidirectional edges
      edges[n1].push({
        to: n2,
        dist,
        path: [[lng1, lat1], [lng2, lat2]],
      })
      edges[n2].push({
        to: n1,
        dist,
        path: [[lng2, lat2], [lng1, lat1]],
      })
    }
  }

  return { nodes, edges, list: Object.keys(nodes) }
}

// ============================================
// Nearest Node / Snap to Street
// ============================================

/** Find the nearest graph node to a given point */
export function findNearestNode(
  graph: RoutingGraph,
  lat: number,
  lng: number
): string | null {
  if (!graph) return null
  let minDist = Infinity
  let nearest: string | null = null

  for (const id of graph.list) {
    const node = graph.nodes[id]
    const dist = haversine(lat, lng, node.lat, node.lng)
    if (dist < minDist) {
      minDist = dist
      nearest = id
    }
  }
  return nearest
}

/**
 * Snap a point to the nearest street segment.
 * Projects the point perpendicularly onto the closest graph edge.
 */
export function snapToNearestStreetSegment(
  graph: RoutingGraph,
  lat: number,
  lng: number
): SnapResult {
  if (!graph) return { lat, lng, nodeA: null, nodeB: null, dist: Infinity, snapped: false }

  let bestDist = Infinity
  let bestPoint = { lat, lng }
  let bestNodeA: string | null = null
  let bestNodeB: string | null = null

  for (const nodeId of graph.list) {
    const nodeEdges = graph.edges[nodeId]
    if (!nodeEdges) continue
    const nA = graph.nodes[nodeId]

    for (const edge of nodeEdges) {
      const nB = graph.nodes[edge.to]
      if (!nA || !nB) continue

      // Project point onto segment [nA, nB]
      const dx = nB.lng - nA.lng
      const dy = nB.lat - nA.lat
      const lenSq = dx * dx + dy * dy

      let t = 0
      if (lenSq > 0) {
        t = ((lng - nA.lng) * dx + (lat - nA.lat) * dy) / lenSq
        t = Math.max(0, Math.min(1, t)) // Clamp to segment
      }

      const projLat = nA.lat + t * dy
      const projLng = nA.lng + t * dx
      const dist = haversine(lat, lng, projLat, projLng)

      if (dist < bestDist) {
        bestDist = dist
        bestPoint = { lat: projLat, lng: projLng }
        bestNodeA = nodeId
        bestNodeB = edge.to
      }
    }
  }

  return {
    lat: bestPoint.lat,
    lng: bestPoint.lng,
    nodeA: bestNodeA,
    nodeB: bestNodeB,
    dist: bestDist,
    snapped: bestDist < Infinity,
  }
}

// ============================================
// Exclusion Zone Checks
// ============================================

/** Helper: Distance squared from point to a line segment defined by two points */
function distToSegmentSquared(p: {lat: number, lng: number}, v: {lat: number, lng: number}, w: {lat: number, lng: number}) {
  const l2 = (w.lat - v.lat)**2 + (w.lng - v.lng)**2;
  if (l2 === 0) return (p.lat - v.lat)**2 + (p.lng - v.lng)**2;
  let t = ((p.lng - v.lng) * (w.lng - v.lng) + (p.lat - v.lat) * (w.lat - v.lat)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (p.lat - (v.lat + t * (w.lat - v.lat)))**2 + (p.lng - (v.lng + t * (w.lng - v.lng)))**2;
}

/** Check if a point is inside any active exclusion zone */
export function isInExclusionZone(
  zones: ExclusionZone[],
  lat: number,
  lng: number
): ExclusionZone | null {
  for (const zone of zones) {
    if (!zone.active) continue
    if (zone.shape === 'rectangle' && zone.bounds) {
      const [[sLat, wLng], [nLat, eLng]] = zone.bounds
      if (lat >= sLat && lat <= nLat && lng >= wLng && lng <= eLng) return zone
    } else if (zone.shape === 'street' && zone.path) {
      const threshold = 0.000000001 // equivalent to ~3 meters squared radially
      for (let i = 0; i < zone.path.length - 1; i++) {
        const d2 = distToSegmentSquared({lat, lng}, {lat: zone.path[i][0], lng: zone.path[i][1]}, {lat: zone.path[i+1][0], lng: zone.path[i+1][1]})
        if (d2 < threshold) return zone 
      }
    } else if (zone.shape === 'polygon' && zone.path) {
      // Ray casting algorithm for point-in-polygon
      let inside = false
      const poly = zone.path
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const yi = poly[i][0], xi = poly[i][1]
        const yj = poly[j][0], xj = poly[j][1]
        if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
          inside = !inside
        }
      }
      if (inside) return zone
    } else {
      const dist = haversine(lat, lng, zone.lat, zone.lng) * 1000 // km -> m
      if (dist <= (zone.radius || 300)) {
        return zone
      }
    }
  }
  return null
}

/** Check if a straight path crosses any active exclusion zone */
export function pathCrossesExclusionZone(
  zones: ExclusionZone[],
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): boolean {
  const steps = 10
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const lat = lat1 + (lat2 - lat1) * t
    const lng = lng1 + (lng2 - lng1) * t
    if (isInExclusionZone(zones, lat, lng)) {
      return true
    }
  }
  return false
}

// ============================================
// A* Pathfinding
// ============================================

/** Find path around an exclusion zone using waypoints */
export function findPathAroundZone(
  zones: ExclusionZone[],
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  directPath: PathResult
): PathResult {
  for (const zone of zones) {
    if (!zone.active) continue

    // Check if direct path crosses this zone
    const steps = 20
    let crossesZone = false
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const lat = lat1 + (lat2 - lat1) * t
      const lng = lng1 + (lng2 - lng1) * t
      if (isInExclusionZone([zone], lat, lng)) {
        crossesZone = true
        break
      }
    }

    if (crossesZone) {
      const angleTo = Math.atan2(lat2 - lat1, lng2 - lng1)
      let effectiveRadius = zone.radius || 300
      if (zone.shape === 'rectangle' && zone.bounds) {
        effectiveRadius = haversineMeters(zone.bounds[0][0], zone.bounds[0][1], zone.bounds[1][0], zone.bounds[1][1]) / 2 + 50
      } else if (zone.shape === 'street') {
        effectiveRadius = 150
      }
      
      const bufferRadius = ((effectiveRadius / 1000) * 1.5) / 111

      // Clockwise waypoint
      const wp1Lat = zone.lat + bufferRadius * Math.cos(angleTo + Math.PI / 2)
      const wp1Lng = zone.lng + bufferRadius * Math.sin(angleTo + Math.PI / 2)

      // Counter-clockwise waypoint
      const wp2Lat = zone.lat + bufferRadius * Math.cos(angleTo - Math.PI / 2)
      const wp2Lng = zone.lng + bufferRadius * Math.sin(angleTo - Math.PI / 2)

      const dist1 =
        haversine(lat1, lng1, wp1Lat, wp1Lng) + haversine(wp1Lat, wp1Lng, lat2, lng2)
      const dist2 =
        haversine(lat1, lng1, wp2Lat, wp2Lng) + haversine(wp2Lat, wp2Lng, lat2, lng2)

      const [wpLat, wpLng] = dist1 < dist2 ? [wp1Lat, wp1Lng] : [wp2Lat, wp2Lng]

      return {
        path: [[lng1, lat1], [wpLng, wpLat], [lng2, lat2]],
        dist: Math.min(dist1, dist2),
      }
    }
  }

  return directPath
}

/**
 * A* pathfinding on the street graph with exclusion zone penalty.
 * Falls back to direct line if no graph or path found.
 */
export function findPath(
  graph: RoutingGraph | null,
  zones: ExclusionZone[],
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): PathResult {
  const directPath: PathResult = {
    path: [[lng1, lat1], [lng2, lat2]],
    dist: haversine(lat1, lng1, lat2, lng2),
  }
  if (!graph) return directPath

  // Snap start and end to nearest street segment
  const snapStart = snapToNearestStreetSegment(graph, lat1, lng1)
  const snapEnd = snapToNearestStreetSegment(graph, lat2, lng2)

  // If both snapped onto the same edge → direct segment
  if (
    snapStart.snapped &&
    snapEnd.snapped &&
    ((snapStart.nodeA === snapEnd.nodeA && snapStart.nodeB === snapEnd.nodeB) ||
      (snapStart.nodeA === snapEnd.nodeB && snapStart.nodeB === snapEnd.nodeA))
  ) {
    return {
      path: [[snapStart.lng, snapStart.lat], [snapEnd.lng, snapEnd.lat]],
      dist: haversine(snapStart.lat, snapStart.lng, snapEnd.lat, snapEnd.lng),
    }
  }

  // Determine possible start and end graph nodes
  const startNodes = snapStart.snapped
    ? [snapStart.nodeA, snapStart.nodeB].filter(Boolean) as string[]
    : [findNearestNode(graph, lat1, lng1)].filter(Boolean) as string[]
  const endNodes = snapEnd.snapped
    ? [snapEnd.nodeA, snapEnd.nodeB].filter(Boolean) as string[]
    : [findNearestNode(graph, lat2, lng2)].filter(Boolean) as string[]

  if (startNodes.length === 0 || endNodes.length === 0) {
    if (pathCrossesExclusionZone(zones, lat1, lng1, lat2, lng2)) {
      return findPathAroundZone(zones, lat1, lng1, lat2, lng2, directPath)
    }
    return directPath
  }

  const sLat = snapStart.snapped ? snapStart.lat : lat1
  const sLng = snapStart.snapped ? snapStart.lng : lng1
  const eLat = snapEnd.snapped ? snapEnd.lat : lat2
  const eLng = snapEnd.snapped ? snapEnd.lng : lng2

  // Try all start/end node combinations and pick shortest
  let bestResult: PathResult | null = null

  for (const start of startNodes) {
    for (const end of endNodes) {
      const startNode = graph.nodes[start]
      const endNode = graph.nodes[end]
      if (!startNode || !endNode) continue

      const distToStart = haversine(sLat, sLng, startNode.lat, startNode.lng)
      const distFromEnd = haversine(endNode.lat, endNode.lng, eLat, eLng)

      // A* heuristic
      const heuristic = (id: string): number => {
        const n = graph.nodes[id]
        return haversine(n.lat, n.lng, endNode.lat, endNode.lng)
      }

      const gScore: Record<string, number> = { [start]: distToStart }
      const fScore: Record<string, number> = { [start]: distToStart + heuristic(start) }
      const cameFrom: Record<string, string> = {}
      const edgeUsed: Record<string, GraphEdge> = {}
      const openSet = new Set([start])
      const closedSet = new Set<string>()

      const EXCLUSION_PENALTY = 100

      let iterations = 0
      while (openSet.size && iterations++ < 10000) {
        // Find node with lowest fScore in openSet
        let current: string | null = null
        let minF = Infinity
        for (const id of openSet) {
          if ((fScore[id] ?? Infinity) < minF) {
            minF = fScore[id]
            current = id
          }
        }

        if (current === null) break

        if (current === end) {
          // Reconstruct path
          const path: [number, number][] = [[eLng, eLat]]
          let node = end
          while (cameFrom[node]) {
            if (edgeUsed[node]) path.unshift(...edgeUsed[node].path)
            node = cameFrom[node]
          }
          path.unshift([sLng, sLat])

          const totalDist = gScore[end] + distFromEnd
          if (!bestResult || totalDist < bestResult.dist) {
            bestResult = { path, dist: totalDist }
          }
          break
        }

        openSet.delete(current)
        closedSet.add(current)

        for (const edge of graph.edges[current] || []) {
          if (closedSet.has(edge.to)) continue

          let edgeCost = edge.dist
          const currentNode = graph.nodes[current]
          const targetNode = graph.nodes[edge.to]

          // Penalize edges crossing exclusion zones
          if (currentNode && targetNode) {
            if (pathCrossesExclusionZone(zones, currentNode.lat, currentNode.lng, targetNode.lat, targetNode.lng)) {
              edgeCost += EXCLUSION_PENALTY
            }
          }

          const tentativeG = gScore[current] + edgeCost
          if (tentativeG < (gScore[edge.to] ?? Infinity)) {
            cameFrom[edge.to] = current
            edgeUsed[edge.to] = edge
            gScore[edge.to] = tentativeG
            fScore[edge.to] = tentativeG + heuristic(edge.to)
            openSet.add(edge.to)
          }
        }
      }
    }
  }

  return bestResult || directPath
}
