import { GeoJSON } from 'react-leaflet'
import { useMapStore } from '@/stores/useMapStore'

const GOVERNORATE_NAMES: Record<number, string> = {
  0: "رفح",
  1: "خان يونس",
  2: "دير البلح",
  3: "شمال غزة",
  4: "غزة",
}

export function GovernoratesLayer() {
  const visible = useMapStore((s) => s.layerVisibility.gov)
  const features = useMapStore((s) => s.govFeatures)
  const color = useMapStore((s) => s.layerColors.gov) || '#6b21a8'
  const showLabels = useMapStore((s) => s.showLabels)

  if (!visible || !features || features.length === 0) return null

  return (
    <GeoJSON
      key={features.length + '-' + String(showLabels)}
      data={features as any}
      style={{
        color: color,
        fillColor: color,
        weight: 3.5,
        fillOpacity: 0.08,
      }}
      onEachFeature={(feature, layer: any) => {
        // Interactivity
        layer.on('mouseover', (e: any) => {
          e.target.setStyle({
            fillOpacity: 0.25,
            weight: 5.0,
          })
        })
        layer.on('mouseout', (e: any) => {
          e.target.setStyle({
            fillOpacity: 0.08,
            weight: 3.5,
          })
        })

        // Label
        let name = feature.properties.Name_AR || feature.properties.Name || feature.properties.NAME
        if (!name && feature.properties.id !== undefined) {
          name = GOVERNORATE_NAMES[feature.properties.id] || null
        }
        if (name && showLabels) {
          layer.bindTooltip(`${name}`, {
            direction: 'center',
            className: 'map-label map-label-governorates',
            permanent: true,
            opacity: 0.8
          })
        }
      }}
    />
  )
}
