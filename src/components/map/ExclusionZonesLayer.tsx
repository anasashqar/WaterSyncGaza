/**
 * WaterSync — Exclusion Zones Layer
 * طبقة مناطق الاستبعاد
 */
import { Circle, Rectangle, Polygon, Polyline, Popup } from 'react-leaflet'
import { useDataStore } from '@/stores/useDataStore'
import { useMapStore } from '@/stores/useMapStore'
import { ZONE_TYPES } from '@/lib/constants/colors'

export function ExclusionZonesLayer() {
  const exclusionZones = useDataStore((s) => s.exclusionZones)
  const toggleZone = useDataStore((s) => s.toggleExclusionZone)
  const removeZone = useDataStore((s) => s.removeExclusionZone)
  const visible = useMapStore((s) => s.layerVisibility.exclusionZones)

  if (!visible) return null

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {Object.entries(ZONE_TYPES).map(([key, info]) => (
            <pattern key={key} id={`stripe-${key}`} patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
              <rect width="20" height="20" fill={`${info.color}20`} />
              <line x1="0" y1="0" x2="0" y2="20" stroke={info.color} strokeWidth="6" opacity="0.6" />
            </pattern>
          ))}
        </defs>
      </svg>
      {exclusionZones.map((zone) => {
        const zoneInfo = ZONE_TYPES[zone.type as keyof typeof ZONE_TYPES] || ZONE_TYPES.danger

        const pathOptions = {
          color: zoneInfo.color,
          fillColor: `url(#stripe-${zone.type})`,
          fillOpacity: 1,
          weight: 2,
          className: zone.active ? 'exclusion-zone-active' : 'exclusion-zone-inactive',
        }

        const PopupContent = () => (
          <Popup>
            <div style={{ direction: 'rtl', fontFamily: 'var(--font-sans)' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                {zoneInfo.icon} {zone.name}
              </div>
              <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                الشكل: {zone.shape === 'rectangle' ? 'مساحة مربعة' : zone.shape === 'street' ? 'قطاع شارع' : zone.shape === 'polygon' ? 'مضلع' : 'دائرة'}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button
                  onClick={() => toggleZone(zone.id)}
                  style={{
                    padding: '4px 10px', background: zoneInfo.color, color: '#fff',
                    border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem',
                  }}
                >
                  تبديل الحالة
                </button>
                <button
                  onClick={() => removeZone(zone.id)}
                  style={{
                    padding: '4px 10px', background: '#C41E3A', color: '#fff',
                    border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem',
                  }}
                >
                  حذف
                </button>
              </div>
            </div>
          </Popup>
        )

        if (zone.shape === 'rectangle' && zone.bounds) {
          return (
            <Rectangle key={zone.id} bounds={zone.bounds} pathOptions={pathOptions}>
              <PopupContent />
            </Rectangle>
          )
        } else if (zone.shape === 'street' && zone.path) {
          return (
            <Polyline key={zone.id} positions={zone.path} pathOptions={{ ...pathOptions, weight: 8, dashArray: '10, 10' }}>
              <PopupContent />
            </Polyline>
          )
        } else if (zone.shape === 'polygon' && zone.path) {
          return (
            <Polygon key={zone.id} positions={zone.path} pathOptions={{
              ...pathOptions,
              weight: 3,
              dashArray: '8, 6',
              color: '#e6a817',
              fillColor: 'rgba(230, 168, 23, 0.12)',
              fillOpacity: 0.25,
            }}>
              <PopupContent />
            </Polygon>
          )
        }

        return (
          <Circle key={zone.id} center={[zone.lat, zone.lng]} radius={zone.radius || 300} pathOptions={pathOptions}>
            <PopupContent />
          </Circle>
        )
      })}
    </>
  )
}
