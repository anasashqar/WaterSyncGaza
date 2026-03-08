import type { Station, Point, Trip, ExclusionZone, Institution, DeliveryRecord, ReservationStatus } from '@/types'

/** Result of a reservation attempt */
export interface ReservationResult {
  success: boolean
  /** Error message if failed */
  reason?: string
  /** The institution that already holds the reservation */
  heldBy?: string
}

export interface CoreState {
  // Core data arrays
  stations: Station[]
  points: Point[]
  trips: Trip[]
  exclusionZones: ExclusionZone[]
  institutions: Institution[]
  distributionCount: number
  /** When set, only this NGO's routes/coverage are shown on the map */
  activeNGOFilter: string | null

  // Station CRUD
  addStation: (station: Station) => void
  updateStation: (id: string, updates: Partial<Station>) => void
  removeStation: (id: string) => void
  setStations: (stations: Station[]) => void

  // Point CRUD
  addPoint: (point: Point) => void
  updatePoint: (id: string, updates: Partial<Point>) => void
  removePoint: (id: string) => void
  setPoints: (points: Point[]) => void

  // Trip management
  setTrips: (trips: Trip[]) => void
  clearTrips: () => void

  // Exclusion zone CRUD
  addExclusionZone: (zone: ExclusionZone) => void
  updateExclusionZone: (id: string, updates: Partial<ExclusionZone>) => void
  removeExclusionZone: (id: string) => void
  toggleExclusionZone: (id: string) => void
  setExclusionZones: (zones: ExclusionZone[]) => void

  // Institution management
  addInstitution: (institution: Institution) => void
  removeInstitution: (id: string) => void
  setInstitutions: (institutions: Institution[]) => void

  // Bulk operations
  clearAll: () => void
  incrementDistribution: () => void
  _setActiveNGOFilter: (ngoId: string | null) => void

  // Computed helpers
  getStationById: (id: string) => Station | undefined
  getPointById: (id: string) => Point | undefined
}

export interface ReservationState {
  // ── Reservation System (Plan 3 — Phase 1) ──
  reservePoint: (pointId: string, institutionId: string) => ReservationResult
  releasePoint: (pointId: string) => void
  updateReservationStatus: (pointId: string, status: ReservationStatus) => void
  releaseExpiredReservations: () => number
  getAvailablePoints: () => Point[]
  getReservedByInstitution: (institutionId: string) => Point[]
}

export interface SyncState {
  /** Delivery records for field execution (Plan 3 — Phase 3) */
  deliveries: DeliveryRecord[]
  // ── Delivery Records (Plan 3 — Phase 3 placeholder) ──
  addDelivery: (delivery: DeliveryRecord) => void
  updateDelivery: (id: string, updates: Partial<DeliveryRecord>) => void

  // ── Offline Sync Engine ──
  syncPendingDeliveries: () => Promise<void>
}

// Combined state
export type DataState = CoreState & ReservationState & SyncState
