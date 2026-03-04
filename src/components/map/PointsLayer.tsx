/**
 * WaterSync — Distribution Points Layer
 * طبقة علامات نقاط التوزيع
 */
import { Marker, Popup, Tooltip } from 'react-leaflet'
import { useDataStore } from '@/stores/useDataStore'
import { useMapStore } from '@/stores/useMapStore'
import { createIcon } from './MapIcons'
import { TYPES, TYPE_LABELS } from '@/lib/constants/colors'
import { getStatusColor } from '@/lib/utils'

export function PointsLayer() {
  const points = useDataStore((s) => s.points)
  const visible = useMapStore((s) => s.layerVisibility.points)

  if (!visible) return null

  return (
    <>
      {points.map((point) => {
        const shape = TYPES[point.type] || 'circle'
        const color = getStatusColor(point.status)

        return (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={createIcon(shape, color, 14)}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              {point.name}
            </Tooltip>
            <Popup maxWidth={300}>
              <div style={{ direction: 'rtl', fontFamily: 'var(--font-sans)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>
                  <span style={{
                    background: color,
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    marginLeft: 6,
                  }}>
                    {TYPE_LABELS[point.type] || point.type}
                  </span>
                  {point.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8BA4BC', marginBottom: 4 }}>
                  ⌖ {point.governorate || 'غير محدد'} - {point.neighborhood || 'غير محدد'}
                </div>
                <div style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: '#38bdf8' }}>●</span> الحصة: {point.demand.toLocaleString()} لتر
                </div>
                {point.population > 0 && (
                  <div style={{ fontSize: '0.8rem' }}>
                    <span style={{ color: '#64748b' }}>●</span> {point.population.toLocaleString()} مستفيد
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: point.visitedByTrucks?.length > 0 ? '#2E86AB' : '#ef4444', marginTop: 6 }}>
                  {point.visitedByTrucks?.length > 0
                    ? `زارتها: ${point.visitedByTrucks.length} شاحنات`
                    : 'لم تتم الزيارة بعد'}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}
