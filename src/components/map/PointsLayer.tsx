/**
 * WaterSync — Distribution Points Layer
 * طبقة علامات نقاط التوزيع (مع عرض حالة الحجز بصرياً)
 */
import { Marker, Popup, Tooltip } from 'react-leaflet'
import { useDataStore } from '@/stores/useDataStore'
import { useMapStore } from '@/stores/useMapStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { createIcon } from './MapIcons'
import { TYPES, TYPE_LABELS, RESERVATION_STATUS } from '@/lib/constants/colors'
import { getStatusColor } from '@/lib/utils'
import { findNearestAvailablePoint } from '@/lib/spatial'
import { useUIStore } from '@/stores/useUIStore'
import { useCallback } from 'react'
import type L from 'leaflet'

export function PointsLayer() {
  const points = useDataStore((s) => s.points)
  const reservePoint = useDataStore((s) => s.reservePoint)
  const releasePoint = useDataStore((s) => s.releasePoint)
  const visible = useMapStore((s) => s.layerVisibility.points)
  const editorMode = useMapStore((s) => s.editorMode)
  const findGovernorate = useMapStore((s) => s.findGovernorate)
  const findNeighborhood = useMapStore((s) => s.findNeighborhood)
  const updatePoint = useDataStore((s) => s.updatePoint)
  const role = useAuthStore((s) => s.role)
  const institutionId = useAuthStore((s) => s.institutionId)
  const institutions = useDataStore((s) => s.institutions)
  const addNotification = useUIStore((s) => s.addNotification)
  const flyTo = useMapStore((s) => s.flyTo)

  /** Get NGO display info by institution ID */
  const getNGOInfo = (ngoId: string | null) => {
    if (!ngoId) return null
    return institutions.find((n) => n.id === ngoId) ?? null
  }

  /** Handle drag end — update coordinates + auto-detect location */
  const handleDragEnd = useCallback((pointId: string, e: L.DragEndEvent) => {
    const marker = e.target
    const pos = marker.getLatLng()
    
    // التحقق من الموقع الجديد
    const neigh = findNeighborhood(pos.lat, pos.lng)
    
    if (!neigh) {
      addNotification('لا يمكن نقل النقطة خارج حدود الأحياء المعتمدة', 'warning')
      // إعادة الرسم سيؤدي لعودة العلامة لموقعها المخزن في الـ store
      // سنقوم بتحديث وهمي بسيط أو مجرد الاعتماد على أن الـ store لم يتغير
      // للحصول على رد فعل فوري، يفضل إعادة تعيين الموقع في الماركر يدوياً
      const original = points.find(p => p.id === pointId)
      if (original) {
        marker.setLatLng([original.lat, original.lng])
      }
      return
    }

    const gov = findGovernorate(pos.lat, pos.lng) || ''

    updatePoint(pointId, {
      lat: pos.lat,
      lng: pos.lng,
      governorate: gov,
      neighborhood: neigh,
    })
  }, [updatePoint, findGovernorate, findNeighborhood, points, addNotification])

  if (!visible) return null

  /** Handle reservation attempt with conflict detection */
  const handleReserve = (pointId: string) => {
    if (!institutionId) {
      addNotification('يجب تحديد المؤسسة أولاً (بدّل الدور إلى منسق مؤسسة)', 'warning')
      return
    }

    const result = reservePoint(pointId, institutionId)

    if (result.success) {
      const myNGO = getNGOInfo(institutionId)
      addNotification(`تم حجز النقطة بنجاح لـ ${myNGO?.name || institutionId}`, 'success')
    } else {
      // Conflict! Suggest alternative, or display the reason
      if (result.reason) {
        addNotification(`⚠️ ${result.reason}`, 'error')
      }
      
      const blockedNGO = getNGOInfo(result.heldBy ?? null)
      const point = useDataStore.getState().getPointById(pointId)

      if (point && result.heldBy) {
        const alternative = findNearestAvailablePoint(
          point.lat, point.lng,
          useDataStore.getState().points,
          pointId
        )

        if (alternative) {
          addNotification(
            `⚠️ عذراً، ${blockedNGO?.name || 'مؤسسة أخرى'} حجزت هذه النقطة. اقتراح بديل: "${alternative.name}" — انقر للانتقال`,
            'warning'
          )
          // Fly to the alternative point
          flyTo?.(alternative.lat, alternative.lng)
        } else {
          addNotification(
            `⚠️ ${blockedNGO?.name || 'مؤسسة أخرى'} حجزت هذه النقطة. لا توجد نقاط بديلة متاحة حالياً.`,
            'error'
          )
        }
      }
    }
  }

  /** Handle release */
  const handleRelease = (pointId: string) => {
    releasePoint(pointId)
    addNotification('تم تحرير النقطة — أصبحت متاحة للجميع', 'info')
  }

  // NGO view: hide points reserved by other institutions
  const isNGO = role === 'ngo'
  const visiblePoints = isNGO && institutionId
    ? points.filter(p => !p.reservedBy || p.reservedBy === institutionId)
    : points

  return (
    <>
      {visiblePoints.map((point) => {
        const shape = TYPES[point.type] || 'circle'
        const statusColor = getStatusColor(point.status)
        const ngoInfo = getNGOInfo(point.reservedBy)
        const isReserved = !!point.reservedBy
        const reservationInfo = point.reservationStatus
          ? RESERVATION_STATUS[point.reservationStatus as keyof typeof RESERVATION_STATUS]
          : null

        // Determine if current user can interact with this point's reservation
        const canReserve = (role === 'ngo' || role === 'admin') && !isReserved
        const canRelease = role === 'admin' || (role === 'ngo' && point.reservedBy === institutionId)

        return (
          <span key={point.id}>
            {/* Main point marker */}
            <Marker
              position={[point.lat, point.lng]}
              icon={createIcon(shape, statusColor, 14)}
              draggable={editorMode}
              eventHandlers={editorMode ? {
                dragend: (e) => handleDragEnd(point.id, e),
              } : undefined}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                {point.name}
                {isReserved && ` ${reservationInfo?.icon || '🔒'}`}
              </Tooltip>
              <Popup maxWidth={320}>
                <div style={{ direction: 'rtl', fontFamily: 'var(--font-sans)', minWidth: 220 }}>
                  {/* Header */}
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>
                    <span style={{
                      background: statusColor, color: '#fff',
                      padding: '2px 8px', borderRadius: 4,
                      fontSize: '0.75rem', marginLeft: 6,
                    }}>
                      {TYPE_LABELS[point.type] || point.type}
                    </span>
                    {point.name}
                  </div>

                  {/* Location */}
                  <div style={{ fontSize: '0.75rem', color: '#8BA4BC', marginBottom: 4 }}>
                    ⌖ {point.governorate || 'غير محدد'} - {point.neighborhood || 'غير محدد'}
                  </div>

                  {/* Demand & Population */}
                  <div style={{ fontSize: '0.8rem' }}>
                    <span style={{ color: '#38bdf8' }}>●</span> الحصة: {point.demand.toLocaleString()} لتر
                  </div>
                  {point.population > 0 && (
                    <div style={{ fontSize: '0.8rem' }}>
                      <span style={{ color: '#64748b' }}>●</span> {point.population.toLocaleString()} مستفيد
                    </div>
                  )}

                  {/* Truck visits */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: point.visitedByTrucks?.length > 0 ? '#2E86AB' : '#ef4444',
                    marginTop: 4,
                  }}>
                    {point.visitedByTrucks?.length > 0
                      ? `زارتها: ${point.visitedByTrucks.length} شاحنات`
                      : 'لم تتم الزيارة بعد'}
                  </div>

                  {/* ── Reservation Status Block ── */}
                  <div style={{
                    marginTop: 8, padding: '8px 10px', borderRadius: 8,
                    background: isReserved
                      ? `${ngoInfo?.color || '#F59E0B'}12`
                      : 'rgba(107, 114, 128, 0.08)',
                    border: `1px solid ${isReserved
                      ? `${ngoInfo?.color || '#F59E0B'}40`
                      : 'rgba(107, 114, 128, 0.2)'}`,
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: '0.78rem', fontWeight: 600,
                      color: reservationInfo?.color || '#6B7280',
                    }}>
                      <span>{reservationInfo?.icon || '○'}</span>
                      <span>{reservationInfo?.name || 'متاح'}</span>
                      {ngoInfo && (
                        <span style={{
                          marginRight: 'auto', fontSize: '0.72rem',
                          color: ngoInfo.color, fontWeight: 700,
                        }}>
                          {ngoInfo.name}
                        </span>
                      )}
                    </div>

                    {/* Reserve / Release buttons */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      {canReserve && (
                        <button
                          onClick={() => handleReserve(point.id)}
                          style={{
                            flex: 1, padding: '6px 10px', borderRadius: 6,
                            background: '#10B981', color: '#fff', border: 'none',
                            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          🔒 حجز لمؤسستي
                        </button>
                      )}
                      {isReserved && canRelease && (
                        <button
                          onClick={() => handleRelease(point.id)}
                          style={{
                            flex: 1, padding: '6px 10px', borderRadius: 6,
                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          🔓 تحرير
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          </span>
        )
      })}
    </>
  )
}
