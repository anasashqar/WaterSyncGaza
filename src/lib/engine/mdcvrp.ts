/**
 * WaterSync — MDCVRP Algorithm (Multi-Depot Capacitated Vehicle Routing)
 * خوارزمية توزيع المياه متعددة المحطات
 *
 * This module contains the core VRP solver logic, fully decoupled from DOM/Leaflet.
 * It takes data as input and returns calculated trip assignments.
 */
import type { Station, Point, TripStop, ExclusionZone, RoutingGraph, Institution } from '@/types'
import { TRUCK_CAPACITY } from '@/lib/constants/colors'
import { haversine, findPath } from './routing'

// ============================================
// Types
// ============================================

export interface MDCVRPInput {
  stations: Station[]
  points: Point[]
  exclusionZones: ExclusionZone[]
  graph: RoutingGraph | null
  findGovernorate: (lat: number, lng: number) => string | null
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
  const { stations, points, exclusionZones, graph, findGovernorate } = input

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

  // Classify points
  const hospitalPoints = points.filter((p) => p.type === 'hospital')
  const nonHospitalPoints = points.filter((p) => p.type !== 'hospital')
  const servedPointIds = new Set<string>()

  // ---- Process each station ----
  stations.forEach((station) => {
    if (station.institutions.length === 0) return
    const stationGov = station.governorate

    // Strict governorate match
    function isInStationScope(point: Point): boolean {
      let pGov = point.governorate || findGovernorate(point.lat, point.lng)
      let sGov = stationGov || findGovernorate(station.lat, station.lng)
      if (sGov && pGov) return sGov === pGov
      return false
    }

    // --- First institution: serve hospitals ---
    const firstInst = station.institutions[0]
    let firstInstRemainingTrucks = 0

    if (firstInst) {
      let govHospitals = hospitalPoints.filter(
        (p) => !servedPointIds.has(p.id) && isInStationScope(p) && p.remainingCapacity > 0
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
      (p) => !servedPointIds.has(p.id) && isInStationScope(p) && p.remainingCapacity > 0
    )
    allNeighPoints.sort(
      (a, b) => haversine(station.lat, station.lng, a.lat, a.lng) - haversine(station.lat, station.lng, b.lat, b.lng)
    )

    for (const { inst, trucks: totalTrucks, truckOffset } of neighInstitutions) {
      let availableTrucks = totalTrucks

      while (availableTrucks > 0) {
        const point = allNeighPoints.find((p) => !servedPointIds.has(p.id) && p.remainingCapacity > 0)
        if (!point) break

        const deliveryAmount = Math.min(TRUCK_CAPACITY, point.remainingCapacity)
        if (deliveryAmount <= 0) break

        point.totalReceived += deliveryAmount
        point.remainingCapacity -= deliveryAmount
        point.visitedByTrucks.push(`truck_${truckOffset + (totalTrucks - availableTrucks) + 1}`)

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

  // Identify unserved points
  points.forEach((p) => {
    if (!servedPointIds.has(p.id) && p.remainingCapacity > 0) {
      p.missedCount++
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
