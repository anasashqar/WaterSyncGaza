/**
 * WaterSync — Routes Layer
 * طبقة مسارات الرحلات
 */
import { Polyline, Tooltip } from 'react-leaflet'
import { useDataStore } from '@/stores/useDataStore'
import { useMapStore } from '@/stores/useMapStore'

export function RoutesLayer() {
  const trips = useDataStore((s) => s.trips)
  const visible = useMapStore((s) => s.layerVisibility.routes)

  if (!visible || trips.length === 0) return null

  return (
    <>
      {trips.map((trip) => {
        if (!trip.path || trip.path.length === 0) return null

        // Path is stored as [lng, lat] pairs — convert to [lat, lng] for Leaflet
        const positions = trip.path.map((coord) => [coord[1], coord[0]] as [number, number])

        return (
          <Polyline
            key={trip.id}
            positions={positions}
            pathOptions={{
              color: trip.color || '#00FFFF',
              weight: 4,
              opacity: 0.85,
            }}
          >
            <Tooltip sticky direction="top">
              {trip.name}
            </Tooltip>
          </Polyline>
        )
      })}
    </>
  )
}
