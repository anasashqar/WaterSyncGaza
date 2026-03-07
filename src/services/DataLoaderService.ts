import { useDataStore } from '@/stores/useDataStore'
import { useMapStore } from '@/stores/useMapStore'

/**
 * Service to load initial data into the application state.
 */
export class DataLoaderService {
  /**
   * Loads the main JSON file into the data store.
   */
  static async loadMainData(): Promise<void> {
    try {
      const { points, stations } = useDataStore.getState()

      // If data is already populated (e.g. via cross-tab sync), do NOT overwrite
      if (points.length > 0 || stations.length > 0) {
        console.log('[INFO] Data already present in store (via sync). Skipping default JSON load.')
        DataLoaderService.loadGeoData()
        return
      }

      // The user wants to start the application with an empty map
      // (no default stations, points, or exclusion zones).
      console.log('[OK] Starting empty without default mock data')

      // Load GeoJSON data (Governorates, Neighborhoods, Streets, Buffer Zones)
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
