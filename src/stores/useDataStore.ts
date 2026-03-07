import { create } from 'zustand'
import type { Station, Point, Trip, ExclusionZone, Institution, DeliveryRecord, ReservationStatus } from '@/types'
import { TRUCK_CAPACITY } from '@/lib/constants/colors'
import { enableCrossTabSync } from '@/lib/syncMiddleware'

/** Result of a reservation attempt */
export interface ReservationResult {
  success: boolean
  /** Error message if failed */
  reason?: string
  /** The institution that already holds the reservation */
  heldBy?: string
}

interface DataState {
  // Core data arrays
  stations: Station[]
  points: Point[]
  trips: Trip[]
  exclusionZones: ExclusionZone[]
  institutions: Institution[]
  distributionCount: number
  /** Delivery records for field execution (Plan 3 — Phase 3) */
  deliveries: DeliveryRecord[]
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

  // ── Reservation System (Plan 3 — Phase 1) ──
  reservePoint: (pointId: string, institutionId: string) => ReservationResult
  releasePoint: (pointId: string) => void
  updateReservationStatus: (pointId: string, status: ReservationStatus) => void
  releaseExpiredReservations: () => number
  getAvailablePoints: () => Point[]
  getReservedByInstitution: (institutionId: string) => Point[]

  // ── Delivery Records (Plan 3 — Phase 3 placeholder) ──
  addDelivery: (delivery: DeliveryRecord) => void
  updateDelivery: (id: string, updates: Partial<DeliveryRecord>) => void

  // ── Offline Sync Engine ──
  syncPendingDeliveries: () => Promise<void>
}

/** Get end-of-day timestamp for today */
function endOfToday(): string {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export const useDataStore = create<DataState>((set, get) => ({
  // Initial state
  stations: [],
  points: [],
  trips: [],
  exclusionZones: [],
  institutions: [],
  distributionCount: 0,
  deliveries: [],
  activeNGOFilter: null,

  // Station CRUD
  addStation: (station) => set((s) => ({ stations: [...s.stations, station] })),
  updateStation: (id, updates) =>
    set((s) => ({
      stations: s.stations.map((st) => (st.id === id ? { ...st, ...updates } : st)),
    })),
  removeStation: (id) =>
    set((s) => ({
      stations: s.stations.filter((st) => st.id !== id),
      institutions: s.institutions.map((inst) => ({
        ...inst,
        stationIds: inst.stationIds.filter((sid) => sid !== id)
      })).filter((inst) => inst.stationIds.length > 0),
    })),
  setStations: (stations) => set({ stations }),

  // Point CRUD
  addPoint: (point) => set((s) => ({ points: [...s.points, point] })),
  updatePoint: (id, updates) =>
    set((s) => ({
      points: s.points.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  removePoint: (id) => set((s) => ({ points: s.points.filter((p) => p.id !== id) })),
  setPoints: (points) => set({ points }),

  // Trips
  setTrips: (trips) => set({ trips }),
  clearTrips: () => set({ trips: [] }),

  // Exclusion zones
  addExclusionZone: (zone) => set((s) => ({ exclusionZones: [...s.exclusionZones, zone] })),
  updateExclusionZone: (id, updates) =>
    set((s) => ({
      exclusionZones: s.exclusionZones.map((z) => (z.id === id ? { ...z, ...updates } : z)),
    })),
  removeExclusionZone: (id) =>
    set((s) => ({ exclusionZones: s.exclusionZones.filter((z) => z.id !== id) })),
  toggleExclusionZone: (id) =>
    set((s) => ({
      exclusionZones: s.exclusionZones.map((z) =>
        z.id === id ? { ...z, active: !z.active } : z
      ),
    })),
  setExclusionZones: (zones) => set({ exclusionZones: zones }),

  addInstitution: (institution) =>
    set((s) => {
      const existingGlobal = s.institutions.find(i => i.name === institution.name)
      let newInstitutions = [...s.institutions]
      const toAdd = institution.stationIds[0]

      if (existingGlobal) {
        newInstitutions = newInstitutions.map(i => {
           if (i.name === institution.name) {
              const stationIds = i.stationIds.includes(toAdd) ? i.stationIds : [...i.stationIds, toAdd]
              const prevContracts = i.contracts || []
              const contracts = [...prevContracts.filter(c => c.stationId !== toAdd), { stationId: toAdd, trucks: institution.trucks }]
              return { ...i, stationIds, contracts, trucks: i.trucks + institution.trucks }
           }
           return i
        })
      } else {
        newInstitutions.push({ ...institution, contracts: [{ stationId: toAdd, trucks: institution.trucks }] })
      }

      const stations = s.stations.map((st) => {
        if (st.id === toAdd) {
          const newInsts = [...st.institutions, institution]
          const totalTrucks = newInsts.reduce((sum, i) => sum + i.trucks, 0)
          return {
            ...st,
            institutions: newInsts,
            trucks: totalTrucks,
            dailyCapacity: totalTrucks * TRUCK_CAPACITY,
            remainingCapacity: totalTrucks * TRUCK_CAPACITY,
          }
        }
        return st
      })
      return { institutions: newInstitutions, stations }
    }),
  removeInstitution: (id) =>
    set((s) => {
      let removedStationId: string | undefined;
      let removedInstName: string | undefined;
      let removedTrucks = 0;

      const newStations = s.stations.map((st) => {
        const hasInst = st.institutions.find(i => i.id === id);
        if (hasInst) {
          removedStationId = st.id;
          removedInstName = hasInst.name;
          removedTrucks = hasInst.trucks;
          const remaining = st.institutions.filter((i) => i.id !== id)
          const totalTrucks = remaining.reduce((sum, i) => sum + i.trucks, 0)
          return {
            ...st,
            institutions: remaining,
            trucks: totalTrucks,
            dailyCapacity: totalTrucks * TRUCK_CAPACITY,
            remainingCapacity: totalTrucks * TRUCK_CAPACITY,
          }
        }
        return st
      })

      let newInstitutions = s.institutions;
      if (removedInstName && removedStationId) {
         newInstitutions = newInstitutions.map(i => {
           if (i.name === removedInstName) {
             const newStationIds = i.stationIds.filter(sid => sid !== removedStationId);
             if (newStationIds.length === 0) return null as any;
             return { ...i, stationIds: newStationIds, trucks: Math.max(0, i.trucks - removedTrucks) }
           }
           return i;
         }).filter(Boolean) as Institution[];
      }
      return { institutions: newInstitutions, stations: newStations }
    }),
  setInstitutions: (institutions) => set({ institutions }),

  // Bulk
  clearAll: () =>
    set({
      stations: [],
      points: [],
      trips: [],
      exclusionZones: [],
      institutions: [],
      deliveries: [],
      distributionCount: 0,
    }),
  incrementDistribution: () => set((s) => ({ distributionCount: s.distributionCount + 1 })),
  _setActiveNGOFilter: (ngoId) => set({ activeNGOFilter: ngoId }),

  // Computed
  getStationById: (id) => get().stations.find((s) => s.id === id),
  getPointById: (id) => get().points.find((p) => p.id === id),

  // ═══════════════════════════════════════════
  // Reservation System (Plan 3 — Phase 1)
  // ═══════════════════════════════════════════

  reservePoint: (pointId, institutionId) => {
    const point = get().points.find((p) => p.id === pointId)
    if (!point) return { success: false, reason: 'النقطة غير موجودة' }

    // Check if point is outside the institution's allowed governorates (contracted stations)
    const institution = get().institutions.find((i) => i.id === institutionId)
    if (institution && institution.stationIds.length > 0) {
      const allowedGovs = new Set(
        institution.stationIds.map((sid) => get().stations.find((s) => s.id === sid)?.governorate)
      )
      if (!allowedGovs.has(point.governorate)) {
        return {
          success: false,
          reason: 'لا يمكن حجز نقاط في غير نطاق توزيع المحطات المتعاقد معها (محافظة أخرى)',
        }
      }
    }

    // Check if already reserved by another institution
    if (point.reservedBy && point.reservedBy !== institutionId) {
      return {
        success: false,
        reason: `هذه النقطة محجوزة بالفعل من مؤسسة أخرى`,
        heldBy: point.reservedBy,
      }
    }

    // Check if reservation expired
    if (point.reservedUntil && new Date(point.reservedUntil) < new Date()) {
      // Expired — allow override
    }

    // Reserve it
    const now = new Date().toISOString()
    set((s) => ({
      points: s.points.map((p) =>
        p.id === pointId
          ? {
              ...p,
              reservedBy: institutionId,
              reservedAt: now,
              reservedUntil: endOfToday(),
              reservationStatus: 'reserved' as const,
            }
          : p
      ),
    }))

    return { success: true }
  },

  releasePoint: (pointId) => {
    set((s) => ({
      points: s.points.map((p) =>
        p.id === pointId
          ? {
              ...p,
              reservedBy: null,
              reservedAt: null,
              reservedUntil: null,
              reservationStatus: 'available' as const,
            }
          : p
      ),
    }))
  },

  updateReservationStatus: (pointId, status) => {
    set((s) => ({
      points: s.points.map((p) =>
        p.id === pointId ? { ...p, reservationStatus: status } : p
      ),
    }))
  },

  releaseExpiredReservations: () => {
    const now = new Date()
    let released = 0

    set((s) => ({
      points: s.points.map((p) => {
        if (p.reservedUntil && new Date(p.reservedUntil) < now) {
          released++
          return {
            ...p,
            reservedBy: null,
            reservedAt: null,
            reservedUntil: null,
            reservationStatus: 'available' as const,
          }
        }
        return p
      }),
    }))

    return released
  },

  getAvailablePoints: () => {
    return get().points.filter(
      (p) => !p.reservedBy || p.reservationStatus === 'available'
    )
  },

  getReservedByInstitution: (institutionId) => {
    return get().points.filter((p) => p.reservedBy === institutionId)
  },

  // ── Delivery Records (Phase 3 — persisted to IndexedDB) ──
  addDelivery: (delivery) => {
    set((s) => ({ deliveries: [...s.deliveries, delivery] }))
    // Persist to IndexedDB in the background
    import('@/stores/useDatabaseStore').then(({ useDatabaseStore }) => {
      useDatabaseStore.getState().saveDelivery(delivery)
    })
  },

  updateDelivery: (id, updates) =>
    set((s) => ({
      deliveries: s.deliveries.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),

  // ── Offline Sync Engine ──
  syncPendingDeliveries: async () => {
    if (!navigator.onLine) return

    set((s) => {
      const pending = s.deliveries.filter(d => d.pendingSync)
      if (pending.length === 0) return s

      // Simulate sending to backend
      console.log(`[Sync Worker] Syncing ${pending.length} pending deliveries to server...`)

      // Update state: Mark all as synced
      const syncedDeliveries = s.deliveries.map(d => 
        d.pendingSync ? { ...d, pendingSync: false } : d
      )

      // Update IDB asynchronously
      import('@/stores/useDatabaseStore').then(({ useDatabaseStore }) => {
        pending.forEach(d => {
           useDatabaseStore.getState().saveDelivery({ ...d, pendingSync: false })
        })
      })

      // Optionally show a global Toast (if we can inject UIStore)
      import('@/stores/useUIStore').then(({ useUIStore }) => {
         useUIStore.getState().addNotification(`تمت مزامنة ${pending.length} عمليات تسليم بنجاح!`, 'success')
      })

      return { deliveries: syncedDeliveries }
    })
  }
}))

// ── Background Sync Listener ──
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
     console.log('[Network] Reconnected! Triggering Background Sync...')
     useDataStore.getState().syncPendingDeliveries()
  })
}

// ── Enable Cross-Tab Sync for multi-window testing ──
enableCrossTabSync(useDataStore)
