/**
 * WaterSync — Map Setup Hook
 * خطاف لتهيئة الخريطة عند تحميلها
 */
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { useMapStore } from '@/stores/useMapStore'
import { useUIStore } from '@/stores/useUIStore'

/**
 * Component that captures the Leaflet map instance into the Zustand store.
 * Must be placed inside <MapContainer>.
 */
export function MapSetup() {
  const map = useMap()
  const setMap = useMapStore((s) => s.setMap)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  useEffect(() => {
    setMap(map)
    return () => setMap(null as unknown as L.Map)
  }, [map, setMap])

  // Fix: Leaflet map doesn't auto-resize when parent container flex layout changes
  // Trigger invalidateSize whenever the sidebar toggles
  useEffect(() => {
    if (map) {
      // Small timeout to let React flush the DOM updates (e.g., sidebar disappears)
      const timeout = setTimeout(() => {
        map.invalidateSize()
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [map, sidebarOpen])

  return null
}
