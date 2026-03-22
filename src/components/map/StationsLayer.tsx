/**
 * WaterSync — Station Markers Layer
 * طبقة علامات المحطات — مع دعم السحب في وضع المحرر
 */
import { Marker, Popup, Tooltip } from 'react-leaflet'
import { useDataStore } from '@/stores/useDataStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useMapStore } from '@/stores/useMapStore'
import { createIcon } from './MapIcons'
import { COLORS } from '@/lib/constants/colors'
import { useCallback, useMemo } from 'react'
import { useUIStore } from '@/stores/useUIStore'
import { FileSignature, CheckCircle2 } from 'lucide-react'
import type L from 'leaflet'

export function StationsLayer() {
  const stations = useDataStore((s) => s.stations)
  const institutions = useDataStore((s) => s.institutions)
  const updateStation = useDataStore((s) => s.updateStation)
  const role = useAuthStore((s) => s.role)
  const institutionId = useAuthStore((s) => s.institutionId)
  const openContractManager = useAuthStore((s) => s.openContractManager)
  const isNGO = role === 'ngo'
  const currentNGO = useMemo(() => institutions.find(i => i.id === institutionId), [institutions, institutionId])
  const visible = useMapStore((s) => s.layerVisibility.stations)
  const editorMode = useMapStore((s) => s.editorMode)
  const findGovernorate = useMapStore((s) => s.findGovernorate)
  const findNeighborhood = useMapStore((s) => s.findNeighborhood)
  const addNotification = useUIStore((s) => s.addNotification)

  const handleDragEnd = useCallback((stationId: string, e: L.DragEndEvent) => {
    const marker = e.target
    const pos = marker.getLatLng()
    
    // التحقق من الموقع الجديد
    const neigh = findNeighborhood(pos.lat, pos.lng)
    
    if (!neigh) {
      addNotification('لا يمكن نقل المحطة خارج حدود الأحياء المعتمدة', 'warning')
      const original = stations.find(s => s.id === stationId)
      if (original) {
        marker.setLatLng([original.lat, original.lng])
      }
      return
    }

    const gov = findGovernorate(pos.lat, pos.lng) || ''

    updateStation(stationId, {
      lat: pos.lat,
      lng: pos.lng,
      governorate: gov,
      neighborhood: neigh,
    })
  }, [updateStation, findGovernorate, findNeighborhood, stations, addNotification])

  const icon = useMemo(() => createIcon('station', COLORS.station, 24), [])

  if (!visible) return null

  return (
    <>
      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.lat, station.lng]}
          icon={icon}
          draggable={editorMode}
          eventHandlers={editorMode ? {
            dragend: (e) => handleDragEnd(station.id, e),
          } : undefined}
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
                ▸ {isNGO && institutionId 
                  ? `${station.institutions.find((i: any) => i.id === institutionId)?.trucks || 0} شاحنة (تعاقدي)`
                  : `${station.trucks || 0} شاحنة`}
              </div>
              <div style={{ fontSize: '0.8rem', marginBottom: 2 }}>
                ▸ السعة: {(station.dailyCapacity || 0).toLocaleString()} لتر
              </div>
              {!isNGO && (
                <div style={{ fontSize: '0.8rem' }}>
                  ▸ المؤسسات: {station.institutions?.length || 0}
                </div>
              )}
              
              {isNGO && (
                <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  {currentNGO?.contracts?.some(cs => cs.stationId === station.id) ? (
                    <button
                      onClick={() => openContractManager(station.id)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'var(--bg-elevated)',
                        color: 'var(--success)',
                        border: '1px solid var(--success)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <CheckCircle2 size={16} />
                      تعديل التعاقد
                    </button>
                  ) : (
                    <button
                      onClick={() => openContractManager(station.id)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <FileSignature size={16} />
                      تعاقد مع هذه المحطة
                    </button>
                  )}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}
