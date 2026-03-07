/**
 * WaterSync — Core TypeScript Interfaces
 * أنواع البيانات الأساسية
 */
import type L from 'leaflet'

// ============================================
// Domain Models
// ============================================

/** Water filling station */
export interface Station {
  id: string
  name: string
  lat: number
  lng: number
  governorate: string
  neighborhood?: string
  dailyCapacity: number
  usedCapacity: number
  remainingCapacity: number
  institutions: Institution[]
  trucks: number
  marker?: L.Marker
  latlng?: L.LatLng
}

/** Trucking institution */
export interface Institution {
  id: string
  name: string
  trucks: number
  color: string
  stationIds: string[]
}

/** Distribution demand point */
export interface Point {
  id: string
  name: string
  type: 'hospital' | 'residential' | 'camp' | 'shelter'
  lat: number
  lng: number
  governorate: string
  neighborhood?: string
  population: number
  demand: number
  capacity: number
  currentFill: number
  remainingCapacity: number
  totalReceived: number
  status: 'supplied' | 'warning' | 'critical'
  lastSupply: Date | string | null
  stationId: string | null
  visitedByTrucks: string[]
  missedCount: number
  isMissed?: boolean
  priority?: number
  marker?: L.Marker
  latlng?: L.LatLng

  // ── Reservation fields (Plan 3 — Phase 1) ──
  /** Which institution reserved this point for today */
  reservedBy: string | null
  /** When the reservation was made */
  reservedAt: string | null
  /** Reservation expiry (end of day) */
  reservedUntil: string | null
  /** Current reservation status */
  reservationStatus: ReservationStatus
  /** Suggested NGO for unreserved points (Plan 3) */
  suggestedNgoId?: string | null
}

// ============================================
// Reservation & Delivery (Plan 3)
// ============================================

/** Reservation lifecycle states */
export type ReservationStatus = 'available' | 'reserved' | 'in_transit' | 'delivered' | 'verified'

/** Delivery lifecycle states */
export type DeliveryStatus = 'pending' | 'loaded' | 'in_transit' | 'unloaded' | 'verified' | 'cancelled'

/** A single delivery record (field execution) */
export interface DeliveryRecord {
  id: string
  /** Trip this delivery belongs to */
  tripId: string
  /** Target point */
  pointId: string
  /** Institution performing the delivery */
  institutionId: string
  /** Driver identifier */
  driverId: string
  /** Station where water was loaded */
  stationId: string
  /** Amount in liters */
  liters: number
  /** Current delivery status */
  status: DeliveryStatus
  /** Timestamp: loaded at station */
  loadedAt: string | null
  /** GPS coords at loading */
  loadedGPS: [number, number] | null
  /** Timestamp: unloaded at destination */
  unloadedAt: string | null
  /** GPS coords at unloading */
  unloadedGPS: [number, number] | null
  /** Receipt confirmation (double verification) */
  receipt: ReceiptConfirmation | null
  /** Created timestamp */
  createdAt: string
  /** Is this record pending sync (offline)? */
  pendingSync: boolean
}

/** Receipt confirmation — signed on driver's device by the receiver */
export interface ReceiptConfirmation {
  /** Name of person who received the water */
  receiverName: string
  /** Actual liters confirmed by receiver */
  confirmedLiters: number
  /** Optional notes */
  notes: string
  /** Timestamp of confirmation */
  confirmedAt: string
  /** GPS at time of confirmation */
  confirmedGPS: [number, number] | null
}

/** Calculated trip / route */
export interface Trip {
  id: string
  name: string
  driverName?: string
  station: Pick<Station, 'id' | 'name' | 'lat' | 'lng'> | null
  stops: TripStop[]
  demand: number
  distance: number
  color: string
  path: [number, number][]
  polyline?: L.Polyline
  executionStatus?: string
  executionTime?: string
  /** Institution that owns this trip (Plan 3) */
  institutionId?: string
}

/** A single stop in a trip */
export interface TripStop {
  id: string
  name: string
  type: string
  demand: number
  status: string
  lat: number
  lng: number
  location?: string
  skippedReason?: string
}

/** Exclusion/danger zone */
export interface ExclusionZone {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  radius?: number
  active: boolean
  shape?: 'circle' | 'rectangle' | 'street' | 'polygon'
  bounds?: [[number, number], [number, number]]
  path?: [number, number][]
  circle?: L.Circle
}

// ============================================
// Routing Graph
// ============================================

/** Node in the routing graph */
export interface GraphNode {
  lat: number
  lng: number
}

/** Edge in the routing graph */
export interface GraphEdge {
  to: string
  dist: number
  path: [number, number][]
}

/** Complete routing graph */
export interface RoutingGraph {
  nodes: Record<string, GraphNode>
  edges: Record<string, GraphEdge[]>
  list: string[]
}

/** Path result from A* or direct */
export interface PathResult {
  path: [number, number][]
  dist: number
}

/** Snap-to-street result */
export interface SnapResult {
  lat: number
  lng: number
  nodeA: string | null
  nodeB: string | null
  dist: number
  snapped: boolean
}

// ============================================
// Execution
// ============================================

/** A daily delivery round */
export interface DailyRound {
  id: string
  date: string
  timestamp: string
  trips: Omit<Trip, 'polyline'>[]
  stats: {
    total: number
    completed: number
  }
}

// ============================================
// GIS Data
// ============================================

/** GeoJSON Feature Collection (simplified) */
export interface GeoJSONData {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

export interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: string
    coordinates: unknown
  }
  properties: Record<string, unknown>
}

// ============================================
// UI State
// ============================================

/** Sidebar panel name */
export type SidebarPanel = 'supply' | 'demand' | 'trips' | 'constraints'

/** Interaction mode on the map */
export type MapMode = 'station' | 'point' | 'zone_rect' | 'zone_street' | null

/** Theme */
export type Theme = 'light' | 'dark'

/** Search state */
export interface SearchState {
  query: string
  isOpen: boolean
  results: SearchResults
  selectedIndex: number
}

export interface SearchResults {
  stations: Station[]
  points: Point[]
  trips: Trip[]
  zones: ExclusionZone[]
}

// ============================================
// Editor
// ============================================

/** Editor marker entry */
export interface EditorMarkerEntry {
  marker: L.Marker
  data: Station | Point
  type: 'station' | 'point'
}

/** Discovered POI from OSM */
export interface DiscoveredPOI {
  osmId: number
  name: string
  lat: number
  lng: number
  type: string
  wsType: string
  governorate: string
  selected: boolean
}
