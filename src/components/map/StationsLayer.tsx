/**
 * WaterSync — Station Markers Layer
 * طبقة علامات المحطات
 */
import { Marker, Popup, Tooltip } from 'react-leaflet'
import { useDataStore } from '@/stores/useDataStore'
import { useMapStore } from '@/stores/useMapStore'
import { createIcon } from './MapIcons'
import { COLORS } from '@/lib/constants/colors'

export function StationsLayer() {
  const stations = useDataStore((s) => s.stations)
  const visible = useMapStore((s) => s.layerVisibility.stations)

  if (!visible) return null

  return (
    <>
      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.lat, station.lng]}
          icon={createIcon('station', COLORS.station, 24)}
        >
          <Tooltip direction="top" offset={[0, -12]}>
            {station.name}
          </Tooltip>
          <Popup maxWidth={300}>
            <div style={{ direction: 'rtl', fontFamily: 'var(--font-sans)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary)', marginBottom: 8 }}>
                ◉ {station.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                ⌖ {station.governorate || 'غير محدد'} - {station.neighborhood || 'غير محدد'}
              </div>
              <div style={{ fontSize: '0.8rem', marginBottom: 2 }}>
                ▸ {station.trucks || 0} شاحنة
              </div>
              <div style={{ fontSize: '0.8rem', marginBottom: 2 }}>
                ▸ السعة: {(station.dailyCapacity || 0).toLocaleString()} لتر
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                ▸ المؤسسات: {station.institutions?.length || 0}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}
