/**
 * WaterSync — Data Store (Zustand)
 * حالة البيانات: المحطات، النقاط، الرحلات، مناطق الاستبعاد
 */
import { create } from 'zustand'
import type { Station, Point, Trip, ExclusionZone, Institution } from '@/types'
import { TRUCK_CAPACITY } from '@/lib/constants/colors'

interface DataState {
  // Core data arrays
  stations: Station[]
  points: Point[]
  trips: Trip[]
  exclusionZones: ExclusionZone[]
  institutions: Institution[]
  distributionCount: number

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

  // Computed helpers
  getStationById: (id: string) => Station | undefined
  getPointById: (id: string) => Point | undefined
}

export const useDataStore = create<DataState>((set, get) => ({
  // Initial state
  stations: [],
  points: [],
  trips: [],
  exclusionZones: [],
  institutions: [],
  distributionCount: 0,

  // Station CRUD
  addStation: (station) => set((s) => ({ stations: [...s.stations, station] })),
  updateStation: (id, updates) =>
    set((s) => ({
      stations: s.stations.map((st) => (st.id === id ? { ...st, ...updates } : st)),
    })),
  removeStation: (id) =>
    set((s) => ({
      stations: s.stations.filter((st) => st.id !== id),
      institutions: s.institutions.filter((inst) => inst.stationId !== id),
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

  // Institutions
  addInstitution: (institution) =>
    set((s) => ({
      institutions: [...s.institutions, institution],
      stations: s.stations.map((st) => {
        if (st.id === institution.stationId) {
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
      }),
    })),
  removeInstitution: (id) =>
    set((s) => {
      const inst = s.institutions.find((i) => i.id === id)
      const newInstitutions = s.institutions.filter((i) => i.id !== id)
      const newStations = inst
        ? s.stations.map((st) => {
            if (st.id === inst.stationId) {
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
        : s.stations
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
    }),
  incrementDistribution: () => set((s) => ({ distributionCount: s.distributionCount + 1 })),

  // Computed
  getStationById: (id) => get().stations.find((s) => s.id === id),
  getPointById: (id) => get().points.find((p) => p.id === id),
}))
