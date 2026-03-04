import { GeoJSON } from 'react-leaflet'
import { useMapStore } from '@/stores/useMapStore'

export function BufferZoneLayer() {
  const visible = useMapStore((s) => s.layerVisibility.bufferZone)
  const feature = useMapStore((s) => s.bufferZoneFeature)
  const color = useMapStore((s) => s.layerColors.bufferZone) || '#eab308'

  if (!visible || !feature) return null

  return (
    <GeoJSON
      key={'buffer-zone'}
      data={feature as any}
      style={{
        color: color,         // yellow border
        fillColor: color,     // yellow fill
        weight: 3,            // border width
        fillOpacity: 0.25,    // semi-transparent fill to indicate danger
        dashArray: '5, 5',    // dashed border for danger zone style
      }}
      onEachFeature={(_, layer: any) => {
        // Simple label for the buffer zone
        layer.bindTooltip(`المنطقة العازلة (الصفراء)`, {
          direction: 'center',
          className: 'map-label',
          opacity: 0.9
        })

        // Interactivity
        layer.on('mouseover', (e: any) => {
          e.target.setStyle({
            fillOpacity: 0.4,
            weight: 4,
          })
        })
        layer.on('mouseout', (e: any) => {
          e.target.setStyle({
            fillOpacity: 0.25,
            weight: 3,
          })
        })
      }}
    />
  )
}
