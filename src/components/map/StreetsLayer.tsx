import { GeoJSON } from 'react-leaflet'
import { useMapStore } from '@/stores/useMapStore'
import { useDataStore } from '@/stores/useDataStore'
import { useUIStore } from '@/stores/useUIStore'
import L from 'leaflet'

const COLORS = {
  street: "#37474F", // Dark Grey - الشوارع
}

const STREETS_OFFSET = {
  lat: 0.00043,
  lng: 0.00073,
}

function applyStreetsOffset(coords: number[]) {
  // Leaflet uses [lat, lng], but coordsToLatLng passes [lng, lat] from GeoJSON
  // GeoJSON coordinates are [lng, lat]
  return new L.LatLng(
    coords[1] + STREETS_OFFSET.lat,
    coords[0] + STREETS_OFFSET.lng
  )
}

export function StreetsLayer() {
  const visible = useMapStore((s) => s.layerVisibility.streets)
  const features = useMapStore((s) => (s as any).streetsGeoJSON?.features)
  const showLabels = useMapStore((s) => s.showLabels)

  if (!visible || !features || features.length === 0) return null

  return (
    <GeoJSON
      key={features.length + '-' + String(showLabels)}
      data={features as any}
      style={{
        color: COLORS.street,
        weight: 1.8,
        opacity: 0.75,
        lineCap: "round",
        lineJoin: "round",
      }}
      coordsToLatLng={applyStreetsOffset as any}
      onEachFeature={(feature, layer: any) => {
        const name = feature.properties.Name_AR || feature.properties.Name
        if (name && showLabels) {
          layer.bindTooltip(name, {
            sticky: true,
            className: "street-label",
            direction: "top",
            offset: [0, -5],
          })
        }
        layer.on("mouseover", (e: any) => {
          e.target.setStyle({ weight: 3.5, opacity: 1.0, color: "#546E7A" })
        })
        layer.on("mouseout", (e: any) => {
          e.target.setStyle({
            weight: 1.8,
            opacity: 0.75,
            color: COLORS.street,
          })
        })
        layer.on("click", (e: any) => {
          const mapStore = useMapStore.getState()
          if (mapStore.mode === 'zone_street') {
            L.DomEvent.stopPropagation(e)
            
            if (feature.geometry?.type === 'LineString') {
              const coords = feature.geometry.coordinates as number[][]
              const path = coords.map(c => {
                const p = applyStreetsOffset(c)
                return [p.lat, p.lng] as [number, number]
              })
              
              if (path.length > 0) {
                const centerIdx = Math.floor(path.length / 2)
                const centerLoc = path[centerIdx]
                const nameText = feature.properties.Name_AR || feature.properties.Name || 'شارع'
                
                useDataStore.getState().addExclusionZone({
                  id: `zone_street_${Date.now()}`,
                  name: `إغلاق: ${nameText}`,
                  type: 'danger',
                  lat: centerLoc[0],
                  lng: centerLoc[1],
                  active: true,
                  shape: 'street',
                  path: path
                })
                
                mapStore.setLayerVisibility('exclusionZones', true)
                useUIStore.getState().addNotification(`تم إغلاق ${nameText} بنجاح`, 'success')
                useUIStore.getState().setActivePanel('constraints')
                
                if (!mapStore.editorMode) mapStore.setMode(null)
              }
            }
          }
        })
      }}
    />
  )
}
