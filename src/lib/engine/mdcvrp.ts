/**
 * WaterSync — MDCVRP Algorithm (Multi-Depot Capacitated Vehicle Routing)
 * خوارزمية توزيع المياه متعددة المحطات
 *
 * This module contains the core VRP solver logic, fully decoupled from DOM/Leaflet.
 * It takes data as input and returns calculated trip assignments.
 *
 * Distribution Constraints:
 *  1. Spatial association: point must be nearest to this station (spatial analysis)
 *  2. Coverage radius: distance ≤ 1.5km (3km diameter)
 *  3. Buffer zone: point must NOT be inside the yellow line
 *  4. Exclusion zones: route must avoid closed streets entirely
 */
import type { Station, Point, TripStop, ExclusionZone, RoutingGraph, Institution, GeoJSONFeature } from '@/types'
import { TRUCK_CAPACITY } from '@/lib/constants/colors'
import { haversine, findPath } from './routing'
import { pointInGeoJSONGeometry } from '@/lib/spatial'

// ============================================
// Types
// ============================================

/** Maximum coverage radius in km */
const MAX_COVERAGE_RADIUS_KM = 3.0

export interface MDCVRPInput {
  stations: Station[]
  points: Point[]
  exclusionZones: ExclusionZone[]
  graph: RoutingGraph | null
  findGovernorate: (lat: number, lng: number) => string | null
  /** Yellow line buffer zone feature — points inside are excluded from distribution */
  bufferZoneFeature?: GeoJSONFeature | null
}

export interface DeliveryDetail {
  point: Point
  amount: number
  isFull: boolean
}

export interface MDCVRPTrip {
  id: string
  name: string
  station: Pick<Station, 'id' | 'name' | 'lat' | 'lng'>
  institution: Institution
  truckNumber: number
  tripNumber: number
  stops: TripStop[]
  deliveryDetails: DeliveryDetail[]
  path: [number, number][]
  distance: number
  demand: number
  truckCapacity: number
  color: string
  date: string
  isHospitalTrip: boolean
  neighborhood?: string
}

export interface MDCVRPResult {
  trips: MDCVRPTrip[]
  unservedPoints: Point[]
  deficitReport: {
    unservedPoints: Point[]
    totalUnservedDemand: number
    totalUnservedPopulation: number
  }
  fullyServed: number
  partiallyServed: number
}

// ============================================
// Core VRP Solver
// ============================================

/**
 * Calculate the MDCVRP solution.
 *
 * This is a pure function—it mutates the `stations` and `points` arrays
 * in-place (updating capacities, statuses, visitedByTrucks) and returns
 * the trips and deficit report.
 */
export function calculateMDCVRP(input: MDCVRPInput): MDCVRPResult {
  const { stations, points, exclusionZones, graph, findGovernorate, bufferZoneFeature } = input

  // Reset stations
  stations.forEach((s) => {
    s.usedCapacity = 0
    s.remainingCapacity = s.dailyCapacity
  })

  // Reset points (skip recently supplied ones)
  points.forEach((p) => {
    if (p.status === 'supplied') {
      p.remainingCapacity = 0
      return // Skip supplied points
    }
    p.remainingCapacity = (p.capacity || TRUCK_CAPACITY) - (p.currentFill || 0)
    p.totalReceived = p.currentFill || 0
  })

  const trips: MDCVRPTrip[] = []
  const unservedPoints: Point[] = []
  let colorIndex = 0

  // Recalculate governorates for accuracy
  stations.forEach((s) => {
    const recalc = findGovernorate(s.lat, s.lng)
    if (recalc) s.governorate = recalc
  })
  points.forEach((p) => {
    if (p.status === 'supplied') return
    const recalc = findGovernorate(p.lat, p.lng)
    if (recalc) p.governorate = recalc
  })

  // ── Helper: Check if a point is inside the Yellow Line buffer zone ──
  function isInBufferZone(lat: number, lng: number): boolean {
    if (!bufferZoneFeature?.geometry) return false
    return pointInGeoJSONGeometry(lat, lng, bufferZoneFeature.geometry)
  }

  // ── Helper: Find the nearest station for a point (spatial association) ──
  function findNearestStation(point: Point): Station | null {
    if (stations.length === 0) return null
    let minDist = Infinity
    let nearest: Station | null = null
    for (const st of stations) {
      if (st.institutions.length === 0) continue
      const d = haversine(point.lat, point.lng, st.lat, st.lng)
      if (d < minDist) {
        minDist = d
        nearest = st
      }
    }
    return nearest
  }

  // Classify points
  const hospitalPoints = points.filter((p) => p.type === 'hospital')
  const nonHospitalPoints = points.filter((p) => p.type !== 'hospital')
  const servedPointIds = new Set<string>()

  // ---- Process each station ----
  stations.forEach((station) => {
    if (station.institutions.length === 0) return

    /**
     * NEW scope check — replaces governorate constraint:
     * 1. Point must be spatially associated to this station (nearest station)
     * 2. Distance must be ≤ MAX_COVERAGE_RADIUS_KM (3km radius)
     * 3. Point must NOT be inside the yellow line buffer zone
     */
    function isInStationScope(point: Point): boolean {
      // Check buffer zone — points in yellow line are never served
      if (isInBufferZone(point.lat, point.lng)) return false

      // Check coverage radius
      const dist = haversine(station.lat, station.lng, point.lat, point.lng)
      if (dist > MAX_COVERAGE_RADIUS_KM) return false

      // Check spatial association — this station must be the nearest one
      const nearest = findNearestStation(point)
      if (!nearest || nearest.id !== station.id) return false

      return true
    }

    // --- First institution: serve hospitals ---
    const firstInst = station.institutions[0]
    let firstInstRemainingTrucks = 0

    if (firstInst) {
      let govHospitals = hospitalPoints.filter(
        (p) => {
          if (servedPointIds.has(p.id) || p.remainingCapacity <= 0) return false
          // Manual station assignment constraint
          if (p.stationId && p.stationId !== station.id) return false
          // If no manual station, enforce governorate limit
          if (!p.stationId && !isInStationScope(p)) return false
          // Manual institution assignment constraint
          if (p.reservedBy && p.reservedBy !== firstInst.id) return false
          return true
        }
      )
      govHospitals.sort(
        (a, b) => haversine(station.lat, station.lng, a.lat, a.lng) - haversine(station.lat, station.lng, b.lat, b.lng)
      )

      let availableTrucks = firstInst.trucks

      while (availableTrucks > 0) {
        const hospital = govHospitals.find((h) => !servedPointIds.has(h.id) && h.remainingCapacity > 0)
        if (!hospital) break

        const deliveryAmount = Math.min(TRUCK_CAPACITY, hospital.remainingCapacity)
        if (deliveryAmount <= 0) break

        hospital.totalReceived += deliveryAmount
        hospital.remainingCapacity -= deliveryAmount
        hospital.visitedByTrucks.push(`truck_${firstInst.trucks - availableTrucks + 1}`)

        // Auto-attach if not manually set
        if (!hospital.stationId) {
          hospital.stationId = station.id
        }
        if (!hospital.reservedBy) {
          hospital.reservedBy = firstInst.id
          hospital.reservedAt = new Date().toISOString()
          hospital.reservationStatus = 'reserved'
        }

        if (hospital.remainingCapacity <= 0) {
          hospital.status = 'supplied'
          hospital.lastSupply = new Date()
        }

        station.usedCapacity += deliveryAmount
        station.remainingCapacity -= deliveryAmount

        // Build path
        const result = findPath(graph, exclusionZones, station.lat, station.lng, hospital.lat, hospital.lng)
        const returnResult = findPath(graph, exclusionZones, hospital.lat, hospital.lng, station.lat, station.lng)
        const pathCoords: [number, number][] = [...result.path, ...returnResult.path]
        const totalDist = result.dist + returnResult.dist

        const trip: MDCVRPTrip = {
          id: `trip_${Date.now()}_h_${colorIndex}`,
          name: `${station.name} - ${firstInst.name} → ${hospital.name}`,
          station: { id: station.id, name: station.name, lat: station.lat, lng: station.lng },
          institution: firstInst,
          truckNumber: firstInst.trucks - availableTrucks + 1,
          tripNumber: hospital.visitedByTrucks.length,
          stops: [{ id: hospital.id, name: hospital.name, type: hospital.type, demand: deliveryAmount, status: hospital.status, lat: hospital.lat, lng: hospital.lng }],
          deliveryDetails: [{ point: hospital, amount: deliveryAmount, isFull: hospital.remainingCapacity <= 0 }],
          path: pathCoords,
          distance: totalDist,
          demand: deliveryAmount,
          truckCapacity: TRUCK_CAPACITY,
          color: firstInst.color,
          date: new Date().toLocaleDateString('ar'),
          isHospitalTrip: true,
        }

        trips.push(trip)
        if (hospital.remainingCapacity <= 0) servedPointIds.add(hospital.id)
        colorIndex++
        availableTrucks--
      }

      firstInstRemainingTrucks = availableTrucks
    }

    // --- Remaining institutions + leftover trucks: serve non-hospital points ---
    const neighInstitutions: { inst: Institution; trucks: number; truckOffset: number }[] = []

    if (firstInstRemainingTrucks > 0 && firstInst) {
      neighInstitutions.push({
        inst: firstInst,
        trucks: firstInstRemainingTrucks,
        truckOffset: firstInst.trucks - firstInstRemainingTrucks,
      })
    }

    for (let instIdx = 1; instIdx < station.institutions.length; instIdx++) {
      const inst = station.institutions[instIdx]
      neighInstitutions.push({ inst, trucks: inst.trucks, truckOffset: 0 })
    }

    let allNeighPoints = nonHospitalPoints.filter(
      (p) => {
        if (servedPointIds.has(p.id) || p.remainingCapacity <= 0) return false
        // Manual station assignment constraint
        if (p.stationId && p.stationId !== station.id) return false
        // If no manual station, enforce governorate limit
        if (!p.stationId && !isInStationScope(p)) return false
        return true
      }
    )
    allNeighPoints.sort(
      (a, b) => haversine(station.lat, station.lng, a.lat, a.lng) - haversine(station.lat, station.lng, b.lat, b.lng)
    )

    for (const { inst, trucks: totalTrucks, truckOffset } of neighInstitutions) {
      let availableTrucks = totalTrucks

      while (availableTrucks > 0) {
        const point = allNeighPoints.find((p) => {
          if (servedPointIds.has(p.id) || p.remainingCapacity <= 0) return false
          // Manual institution assignment constraint
          if (p.reservedBy && p.reservedBy !== inst.id) return false
          return true
        })
        if (!point) break

        const deliveryAmount = Math.min(TRUCK_CAPACITY, point.remainingCapacity)
        if (deliveryAmount <= 0) break

        point.totalReceived += deliveryAmount
        point.remainingCapacity -= deliveryAmount
        point.visitedByTrucks.push(`truck_${truckOffset + (totalTrucks - availableTrucks) + 1}`)

        // Auto-attach if not manually set
        if (!point.stationId) {
          point.stationId = station.id
        }
        if (!point.reservedBy) {
          point.reservedBy = inst.id
          point.reservedAt = new Date().toISOString()
          point.reservationStatus = 'reserved'
        }

        if (point.remainingCapacity <= 0) {
          point.status = 'supplied'
          point.lastSupply = new Date()
        }

        station.usedCapacity += deliveryAmount
        station.remainingCapacity -= deliveryAmount

        const result = findPath(graph, exclusionZones, station.lat, station.lng, point.lat, point.lng)
        const returnResult = findPath(graph, exclusionZones, point.lat, point.lng, station.lat, station.lng)
        const pathCoords: [number, number][] = [...result.path, ...returnResult.path]
        const totalDist = result.dist + returnResult.dist

        const nhName = point.neighborhood || 'غير محدد'

        const trip: MDCVRPTrip = {
          id: `trip_${Date.now()}_n_${colorIndex}`,
          name: `${station.name} - ${inst.name} → ${point.name}`,
          station: { id: station.id, name: station.name, lat: station.lat, lng: station.lng },
          institution: inst,
          truckNumber: truckOffset + (totalTrucks - availableTrucks) + 1,
          tripNumber: point.visitedByTrucks.length,
          stops: [{ id: point.id, name: point.name, type: point.type, demand: deliveryAmount, status: point.status, lat: point.lat, lng: point.lng }],
          deliveryDetails: [{ point, amount: deliveryAmount, isFull: point.remainingCapacity <= 0 }],
          path: pathCoords,
          distance: totalDist,
          demand: deliveryAmount,
          truckCapacity: TRUCK_CAPACITY,
          color: inst.color,
          date: new Date().toLocaleDateString('ar'),
          isHospitalTrip: false,
          neighborhood: nhName,
        }

        trips.push(trip)
        if (point.remainingCapacity <= 0) servedPointIds.add(point.id)
        colorIndex++
        availableTrucks--
      }
    }
  })

  // Group active NGOs to distribute unserved points
  const activeNgoIds = Array.from(new Set(stations.flatMap(s => s.institutions.map(i => i.id))))
  let suggestionIndex = 0

  // Identify unserved points and distribute suggestions
  points.forEach((p) => {
    // Reset suggestion first
    p.suggestedNgoId = null
    
    if (!servedPointIds.has(p.id) && p.remainingCapacity > 0) {
      p.missedCount++
      if (activeNgoIds.length > 0) {
        p.suggestedNgoId = activeNgoIds[suggestionIndex % activeNgoIds.length]
        suggestionIndex++
      }
      unservedPoints.push(p)
    }
  })

  const fullyServed = points.filter((p) => p.remainingCapacity <= 0).length
  const partiallyServed = points.filter((p) => p.totalReceived > 0 && p.remainingCapacity > 0).length

  return {
    trips,
    unservedPoints,
    deficitReport: {
      unservedPoints,
      totalUnservedDemand: unservedPoints.reduce((sum, p) => sum + p.remainingCapacity, 0),
      totalUnservedPopulation: unservedPoints.reduce((sum, p) => sum + p.population, 0),
    },
    fullyServed,
    partiallyServed,
  }
}
