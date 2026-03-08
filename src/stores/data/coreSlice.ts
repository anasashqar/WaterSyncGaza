import type { StateCreator } from 'zustand'
import type { DataState, CoreState } from './types'
import { TRUCK_CAPACITY } from '@/lib/constants/colors'
import type { Institution } from '@/types'

export const createCoreSlice: StateCreator<DataState, [], [], CoreState> = (set, get) => ({
  // Initial state
  stations: [],
  points: [],
  trips: [],
  exclusionZones: [],
  institutions: [],
  distributionCount: 0,
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

  // Institutions
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
})
