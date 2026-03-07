import { useDataStore } from '@/stores/useDataStore'
import { useMapStore } from '@/stores/useMapStore'
import type { Station, Point, ExclusionZone } from '@/types'

/**
 * Service to load initial data into the application state.
 */
export class DataLoaderService {
  /**
   * Loads the main JSON file into the data store.
   */
  static async loadMainData(url: string = '/data/watersync_gaza_full.json'): Promise<void> {
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      const { setStations, setPoints, setExclusionZones, setInstitutions, points, stations } = useDataStore.getState()

      // If data is already populated (e.g. via cross-tab sync), do NOT overwrite
      if (points.length > 0 || stations.length > 0) {
        console.log('[INFO] Data already present in store (via sync). Skipping default JSON load.')
        DataLoaderService.loadGeoData()
        return
      }

      if (data.stations && Array.isArray(data.stations)) {
        // Normalize station data — fill in missing numeric fields
        const normalizedStations = data.stations.map((s: any) => ({
          ...s,
          usedCapacity: s.usedCapacity ?? 0,
          remainingCapacity: s.remainingCapacity ?? (s.dailyCapacity ?? 0),
          dailyCapacity: s.dailyCapacity ?? 0,
          trucks: s.trucks ?? 0,
          institutions: s.institutions ?? [],
        })) as Station[]

        setStations(normalizedStations)
        
        // Extract and set institutions from stations
        const allInstitutions = normalizedStations.flatMap((station: Station) => station.institutions || [])
        
        const orgMap = new Map<string, any>()
        allInstitutions.forEach((inst: any) => {
          const key = inst.name
          if (!orgMap.has(key)) {
            orgMap.set(key, { ...inst, stationIds: inst.stationId ? [inst.stationId] : [] })
          } else {
            const existing = orgMap.get(key)!
            if (inst.stationId && !existing.stationIds.includes(inst.stationId)) {
              existing.stationIds.push(inst.stationId)
            }
            // Accumulated trucks across all stations for this NGO
            existing.trucks += (inst.trucks || 0)
          }
        })

        setInstitutions(Array.from(orgMap.values()) as typeof allInstitutions)
        
        // Ensure station local institutions also match the new type (convert stationId to stationIds)
        normalizedStations.forEach(st => {
          if (st.institutions) {
             st.institutions.forEach((localInst: any) => {
                localInst.stationIds = localInst.stationId ? [localInst.stationId] : [st.id]
             })
          }
        })
      }

      if (data.points && Array.isArray(data.points)) {
        // Normalize point data
        const normalizedPoints = data.points.map((p: any) => ({
          ...p,
          demand: p.demand ?? 0,
          capacity: p.capacity ?? p.demand ?? 0,
          currentFill: p.currentFill ?? 0,
          remainingCapacity: p.remainingCapacity ?? (p.capacity ?? p.demand ?? 0),
          totalReceived: p.totalReceived ?? 0,
          population: p.population ?? 0,
          missedCount: p.missedCount ?? 0,
          visitedByTrucks: p.visitedByTrucks ?? [],
          status: p.status ?? 'critical',
          stationId: p.stationId ?? null,
          lastSupply: p.lastSupply ?? null,
          // Reservation defaults (Plan 3 — Phase 1)
          reservedBy: p.reservedBy ?? null,
          reservedAt: p.reservedAt ?? null,
          reservedUntil: p.reservedUntil ?? null,
          reservationStatus: p.reservationStatus ?? 'available',
        })) as Point[]

        setPoints(normalizedPoints)
      }

      if (data.exclusionZones && Array.isArray(data.exclusionZones)) {
        setExclusionZones(data.exclusionZones as ExclusionZone[])
      }

      console.log('[OK] Main data loaded successfully')

      // Load GeoJSON data simultaneously
      DataLoaderService.loadGeoData()
      
    } catch (error) {
      console.error('[ERR] Error loading main data:', error)
      throw error // Re-throw to allow callers to handle it
    }
  }

  static async loadGeoData() {
    try {
      const { setGovFeatures, setNeighFeatures, buildGraph } = useMapStore.getState()
      
      const [govRes, neighRes, streetsRes] = await Promise.all([
        fetch('/data/governorates.json'),
        fetch('/data/neighborhoods.json'),
        fetch('/data/streets.json')
      ])

      if (govRes.ok) {
        const data = await govRes.json()
        if (data.features) setGovFeatures(data.features)
      }

      if (neighRes.ok) {
        const data = await neighRes.json()
        if (data.features) setNeighFeatures(data.features)
      }

      if (streetsRes.ok) {
         const data = await streetsRes.json()
         if (data.features) {
           useMapStore.setState({ streetsGeoJSON: data } as any)
           buildGraph(data)
         }
      }

      // Load buffer zone (Yellow Line) data
      try {
        const bzRes = await fetch('/data/buffer_zone.json')
        if (bzRes.ok) {
          const bzData = await bzRes.json()
          if (bzData.features) {
            const { setBufferZoneFeature } = useMapStore.getState()
            
            // Find the Yellow Line danger_area feature (largest polygon)
            const yellowLine = bzData.features.find((f: any) => 
              f.properties?.name === 'Yellow Line' || 
              (f.properties?.military === 'danger_area' && f.geometry?.coordinates?.[0]?.length > 50)
            )
            
            if (yellowLine) {
              setBufferZoneFeature(yellowLine)
              console.log(`[OK] Yellow Line buffer zone feature loaded`)
            }
          }
        }
      } catch (bzErr) {
        console.warn('[WARN] Could not load buffer zone:', bzErr)
      }

      console.log('[OK] GeoJSON data loaded successfully')
    } catch (e) {
      console.error('[ERR] Error loading GeoJSON data:', e)
    }
  }
}
