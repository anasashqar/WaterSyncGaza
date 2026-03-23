/**
 * WaterSync — Trips Panel
 * For admin/NGO: shows calculated trips with simulation
 * For driver: shows field tasks with delivery confirmation + GPS timestamping
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useDataStore } from '@/stores/useDataStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useMapStore } from '@/stores/useMapStore'
import { useUIStore } from '@/stores/useUIStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { RESERVATION_STATUS } from '@/lib/constants/colors'
import type { Point, DeliveryRecord } from '@/types'
import {
  Truck,
  PlayCircle,
  Navigation,
  Trash2,
  ChevronDown,
  ChevronRight,
  Route,
  CheckCircle2,
  Droplets,
  Wifi,
  WifiOff,
  User,
  Shield,
  AlertTriangle,
  ArrowRight,
  Package,
  FileCheck,
} from 'lucide-react'

/* ═══════ GPS Helper ═══════ */
interface GPSPosition { lat: number; lng: number; accuracy: number; timestamp: number }
function getCurrentGPS(): Promise<GPSPosition> {
  return new Promise((resolve) => {
    const c = { lat: 31.5017, lng: 34.4668 }
    resolve({ lat: c.lat + (Math.random() - 0.5) * 0.02, lng: c.lng + (Math.random() - 0.5) * 0.02, accuracy: Math.round(5 + Math.random() * 15), timestamp: Date.now() })
  })
}

/* ═══════════════════════════════════════
   Shared — SectionHeader
   ═══════════════════════════════════════ */
function SectionHeader({ title, icon: Icon, onClear, actionText }: { title: string; icon: any; onClear?: () => void; actionText?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px',
      background: 'var(--bg-dark, #f8fafc)',
      borderBottom: '1px solid var(--border, #e2e8f0)',
      borderTop: '1px solid var(--border, #e2e8f0)',
      marginTop: -1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={16} style={{ color: 'var(--primary-soft, #64748b)' }} strokeWidth={2} />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main, #334155)' }}>
          {title}
        </span>
      </div>
      {onClear && (
        <button onClick={onClear} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'transparent', border: 'none',
          color: 'var(--danger, #ef4444)', fontSize: '0.75rem', fontWeight: 600,
          cursor: 'pointer', padding: 0,
        }} title="مسح النتائج">
          <Trash2 size={12} /> {actionText}
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
   Admin / NGO — Trip Row (unchanged)
   ═══════════════════════════════════════ */
function TripRow({ trip, onSimulate, flyTo }: { trip: any; onSimulate: (id: string) => void; flyTo: (lat: number, lng: number) => void }) {
  const [expanded, setExpanded] = React.useState(false)
  const stops = trip.stops || []
  const startName = trip.station?.name || 'محطة الانطلاق'

  return (
    <div style={{ borderBottom: '1px solid var(--border, rgba(0,0,0,0.05))' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px',
          backgroundColor: expanded ? 'var(--bg-dark, #f1f5f9)' : 'transparent',
          cursor: 'pointer', transition: 'background-color 0.2s',
        }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'var(--bg-dark, rgba(0,0,0,0.02))' }}
        onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ color: 'var(--text-muted, #64748b)', width: 16 }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
          <Truck size={16} style={{ color: 'var(--danger, #ef4444)' }} strokeWidth={1.5} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main, #1e293b)' }}>
              مسار الدعم {trip.id?.substring(0, 4)}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)' }}>
              {stops.length} محطات • {(trip.distance || 0).toFixed(1)} كم • {(trip.demand || 0).toLocaleString()} لتر
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={(e) => { e.stopPropagation(); trip.station && flyTo(trip.station.lat, trip.station.lng) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted, #94a3b8)' }} title="الذهاب على الخريطة"><Navigation size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); onSimulate(trip.id) }} style={{ background: 'var(--bg-elevated, #fff)', border: '1px solid var(--border, #cbd5e1)', borderRadius: 4, cursor: 'pointer', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary, #2563eb)', fontSize: '0.7rem', fontWeight: 600 }} title="محاكاة الرحلة"><PlayCircle size={12} /> محاكاة</button>
        </div>
      </div>
      {expanded && (
        <div style={{ background: 'var(--bg-dark, #f8fafc)', padding: '8px 16px 12px 32px', borderTop: '1px solid var(--border, rgba(0,0,0,0.03))' }}>
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 12, bottom: 12, right: 6, width: 2, background: 'var(--border, #cbd5e1)', zIndex: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--primary, #6A4C93)', border: '2px solid var(--bg-dark, #f8fafc)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main, #334155)' }}>{startName} (الانطلاق)</span>
            </div>
            {stops.map((stop: any, idx: number) => (
              <div key={stop.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--success, #10b981)', border: '2px solid var(--bg-dark, #f8fafc)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.45rem', color: '#fff', fontWeight: 'bold' }}>{idx + 1}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-main, #334155)' }}>{stop.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--success, #10b981)', fontWeight: 600 }}>{stop.demand.toLocaleString()} لتر</span>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--text-muted, #94a3b8)', border: '2px solid var(--bg-dark, #f8fafc)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>العودة للمحطة</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   DRIVER — Full TripsContent (integrated into sidebar)
   ═══════════════════════════════════════════════════════════ */
function DriverTripsContent() {
  const points = useDataStore((s) => s.points)
  const updateReservationStatus = useDataStore((s) => s.updateReservationStatus)
  const addDelivery = useDataStore((s) => s.addDelivery)
  const updateDelivery = useDataStore((s) => s.updateDelivery)
  const deliveries = useDataStore((s) => s.deliveries)
  const institutions = useDataStore((s) => s.institutions)
  const institutionId = useAuthStore((s) => s.institutionId)
  const addNotification = useUIStore((s) => s.addNotification)
  const trips = useDataStore((s) => s.trips)
  const map = useMapStore((s) => s.map)
  const { startSimulation } = useSimulationStore()

  const [confirmingPoint, setConfirmingPoint] = useState<Point | null>(null)
  const [gps, setGPS] = useState<GPSPosition | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  const myNGO = useMemo(() => institutions.find((n) => n.id === institutionId) ?? null, [institutions, institutionId])

  const myTrips = useMemo(() => {
    if (!institutionId) return trips
    return trips.filter((t: any) => {
      const tid = t.institution?.id || t.institutionId
      return tid === institutionId || !tid
    })
  }, [trips, institutionId])

  const myTasks = useMemo(() => {
    if (!institutionId) return points.filter((p) => p.reservedBy)
    return points.filter((p) => p.reservedBy === institutionId)
  }, [points, institutionId])

  const pendingTasks = useMemo(() => myTasks.filter((p) => p.reservationStatus === 'reserved' || p.reservationStatus === 'in_transit'), [myTasks])
  const completedToday = useMemo(() => myTasks.filter((p) => p.reservationStatus === 'delivered' || p.reservationStatus === 'verified'), [myTasks])

  useEffect(() => { getCurrentGPS().then(setGPS); const iv = setInterval(() => getCurrentGPS().then(setGPS), 10000); return () => clearInterval(iv) }, [])
  useEffect(() => { const t = () => setIsOnline(navigator.onLine); window.addEventListener('online', t); window.addEventListener('offline', t); return () => { window.removeEventListener('online', t); window.removeEventListener('offline', t) } }, [])

  const flyTo = (lat: number, lng: number) => map?.flyTo([lat, lng], 14, { duration: 0.8 })

  const handleStartDelivery = useCallback((pointId: string) => {
    updateReservationStatus(pointId, 'in_transit')
    addNotification('🚛 بدأ التوصيل — الشاحنة في الطريق', 'info')
  }, [updateReservationStatus, addNotification])

  const handleArrived = useCallback((point: Point) => { setConfirmingPoint(point) }, [])

  const handleConfirmDelivery = useCallback(
    async (point: Point, receiverName: string, confirmedLiters: number, notes: string) => {
      const gpsNow = await getCurrentGPS()
      const delivery: DeliveryRecord = {
        id: `del_${Date.now()}`, tripId: 'field_direct', pointId: point.id,
        institutionId: institutionId || 'unknown', driverId: 'driver_demo', stationId: 'field',
        liters: confirmedLiters, status: 'unloaded',
        loadedAt: null, loadedGPS: null,
        unloadedAt: new Date().toISOString(), unloadedGPS: [gpsNow.lat, gpsNow.lng],
        receipt: { receiverName, confirmedLiters, notes: notes || '', confirmedAt: new Date().toISOString(), confirmedGPS: [gpsNow.lat, gpsNow.lng] },
        createdAt: new Date().toISOString(), pendingSync: !isOnline,
      }
      addDelivery(delivery)
      updateReservationStatus(point.id, 'delivered')
      setTimeout(() => { updateReservationStatus(point.id, 'verified'); updateDelivery(delivery.id, { status: 'verified' }); addNotification('✅ تم التحقق — العملية مكتملة', 'success') }, 3000)
      setConfirmingPoint(null)
      addNotification(`📦 تم تسجيل التسليم — "${point.name}"`, 'success')
    },
    [institutionId, isOnline, addDelivery, updateReservationStatus, updateDelivery, addNotification]
  )

  // ── Confirmation form overlay ──
  if (confirmingPoint) {
    return <InlineConfirmForm point={confirmingPoint} gps={gps} onConfirm={(n, l, no) => handleConfirmDelivery(confirmingPoint, n, l, no)} onCancel={() => setConfirmingPoint(null)} />
  }

  const ngoColor = myNGO?.color || '#2563eb'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Status Bar ── */}
      <div style={{
        padding: '10px 16px',
        background: 'var(--bg-dark, #f1f5f9)',
        borderBottom: '1px solid var(--border, #e2e8f0)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `${ngoColor}15`, border: `1.5px solid ${ngoColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Truck size={16} color={ngoColor} strokeWidth={2} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main, #1e293b)' }}>سائق التوصيل</span>
            {myNGO && <span style={{ fontSize: '0.68rem', fontWeight: 600, color: ngoColor }}>{myNGO.name}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusChip color={isOnline ? '#10B981' : '#EF4444'} icon={isOnline ? <Wifi size={10} /> : <WifiOff size={10} />} text={isOnline ? 'متصل' : 'غير متصل'} />
          {gps && <StatusChip color="var(--primary, #2563eb)" icon={<Navigation size={10} />} text={`±${gps.accuracy}م`} />}
        </div>
      </div>

      {/* ── Progress ── */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-elevated, #fff)',
        borderBottom: '1px solid var(--border, #e2e8f0)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', marginBottom: 6, fontWeight: 700 }}>
            <span>التقدم اليومي</span>
            <span>{completedToday.length}/{myTasks.length} مهمة</span>
          </div>
          <div style={{ height: 6, borderRadius: 10, background: 'var(--bg-dark, #f1f5f9)', border: '1px solid var(--border, #e2e8f0)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 10,
              width: myTasks.length > 0 ? `${(completedToday.length / myTasks.length) * 100}%` : '0%',
              background: `linear-gradient(90deg, ${ngoColor}, ${ngoColor}CC)`,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: 'var(--bg-dark, #f1f5f9)', border: '1px solid var(--border, #e2e8f0)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1rem', fontWeight: 900, color: ngoColor, lineHeight: 1 }}>{pendingTasks.length}</span>
          <span style={{ fontSize: '0.45rem', color: 'var(--text-muted, #64748b)', fontWeight: 700 }}>متبقي</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Trips — unified: simulation + documentation in one card */}
        {myTrips.length > 0 && (
          <>
            <SectionHeader title={`الرحلات المعتمدة (${myTrips.length})`} icon={Route} />
            {myTrips.map((trip: any) => (
              <DriverTripRow
                key={trip.id}
                trip={trip}
                onSimulate={(id) => startSimulation(id)}
                flyTo={flyTo}
                onDocumentStop={handleArrived}
                onStartStop={handleStartDelivery}
                myTasks={myTasks}
                ngoColor={ngoColor}
              />
            ))}
          </>
        )}

        {/* Orphan Pending Tasks — only points NOT already in any trip */}
        {(() => {
          const tripStopIds = new Set(myTrips.flatMap((t: any) => (t.stops || []).map((s: any) => s.id)))
          const orphanPending = pendingTasks.filter(p => !tripStopIds.has(p.id))
          const orphanCompleted = completedToday.filter(p => !tripStopIds.has(p.id))

          return (
            <>
              {orphanPending.length > 0 && (
                <>
                  <SectionHeader title={`مهام إضافية (${orphanPending.length})`} icon={Package} />
                  <div>
                    {orphanPending.map((point) => (
                      <DriverTaskCard key={point.id} point={point} ngoColor={ngoColor}
                        onStart={() => handleStartDelivery(point.id)}
                        onArrived={() => handleArrived(point)}
                        onFlyTo={() => flyTo(point.lat, point.lng)}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Completed */}
              {orphanCompleted.length > 0 && (
                <>
                  <SectionHeader title={`مكتملة (${orphanCompleted.length})`} icon={CheckCircle2} />
                  <div>
                    {orphanCompleted.map((point) => {
                      const del = deliveries.find((d) => d.pointId === point.id)
                      return <CompletedMini key={point.id} point={point} delivery={del} />
                    })}
                  </div>
                </>
              )}
            </>
          )
        })()}

        {/* Empty State */}
        {pendingTasks.length === 0 && completedToday.length === 0 && myTrips.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted, #94a3b8)',
          }}>
            <Truck size={40} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-main, #475569)' }}>لا توجد مهام حالياً</div>
            <div style={{ fontSize: '0.75rem' }}>ستظهر هنا نقاط التوزيع المحجوزة والرحلات المحسوبة</div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   DriverTripRow — trip card with simulation + documentation
   ═══════════════════════════════════════════════════════════ */
function DriverTripRow({ trip, onSimulate, flyTo, onDocumentStop, onStartStop, myTasks, ngoColor }: {
  trip: any; onSimulate: (id: string) => void; flyTo: (lat: number, lng: number) => void
  onDocumentStop: (point: Point) => void; onStartStop: (pointId: string) => void; myTasks: Point[]; ngoColor: string
}) {
  const [expanded, setExpanded] = React.useState(false)
  const stops = trip.stops || []
  const startName = trip.station?.name || 'محطة الانطلاق'
  const getPointForStop = (stopId: string) => myTasks.find((p) => p.id === stopId)

  const completedStops = stops.filter((s: any) => {
    const pt = getPointForStop(s.id)
    return pt && (pt.reservationStatus === 'delivered' || pt.reservationStatus === 'verified')
  }).length

  const progress = stops.length > 0 ? (completedStops / stops.length) * 100 : 0

  return (
    <div style={{ borderBottom: '1px solid var(--border, rgba(0,0,0,0.05))' }}>
      {/* Trip Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          backgroundColor: expanded ? 'var(--bg-dark, #f1f5f9)' : 'transparent',
          cursor: 'pointer', transition: 'background-color 0.2s',
        }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'var(--bg-dark, rgba(0,0,0,0.02))' }}
        onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ color: 'var(--text-muted, #64748b)', width: 16 }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
          <Truck size={16} style={{ color: ngoColor }} strokeWidth={1.5} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main, #1e293b)' }}>
              رحلة {trip.id?.substring(0, 4)}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)' }}>
              {stops.length} نقاط • {(trip.distance || 0).toFixed(1)} كم • {(trip.demand || 0).toLocaleString()} لتر
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Simulate button */}
          <button
            onClick={(e) => { e.stopPropagation(); onSimulate(trip.id) }}
            style={{
              background: 'var(--bg-elevated, #fff)',
              border: `1px solid ${ngoColor}30`,
              borderRadius: 6, cursor: 'pointer',
              padding: '4px 10px',
              display: 'flex', alignItems: 'center', gap: 4,
              color: ngoColor,
              fontSize: '0.68rem', fontWeight: 700,
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            title="محاكاة الرحلة"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${ngoColor}10`;
              e.currentTarget.style.borderColor = `${ngoColor}50`;
              e.currentTarget.style.boxShadow = `0 2px 8px ${ngoColor}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-elevated, #fff)';
              e.currentTarget.style.borderColor = `${ngoColor}30`;
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            }}
          >
            <PlayCircle size={13} /> محاكاة
          </button>

          {/* Mini circular progress */}
          <div style={{ width: 34, height: 34, borderRadius: '50%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={30} height={30} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
              <circle cx={15} cy={15} r={11} stroke="var(--border, #e2e8f0)" strokeWidth={2.5} fill="none" />
              <circle cx={15} cy={15} r={11} stroke={ngoColor} strokeWidth={2.5} fill="none" strokeDasharray={`${progress * 0.69} 100`} strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: '0.5rem', fontWeight: 800, color: ngoColor }}>{completedStops}/{stops.length}</span>
          </div>
        </div>
      </div>

      {/* Expanded view — stops + action buttons */}
      {expanded && (
        <div style={{ background: 'var(--bg-dark, #f8fafc)', borderTop: '1px solid var(--border, rgba(0,0,0,0.03))' }}>
          {/* Action Bar */}
          <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderBottom: '1px solid var(--border, rgba(0,0,0,0.05))', justifyContent: 'flex-end' }}>
            <button
              onClick={(e) => { e.stopPropagation(); trip.station && flyTo(trip.station.lat, trip.station.lng) }}
              style={{
                padding: '8px 12px', borderRadius: 6,
                background: 'var(--bg-elevated, #fff)', border: '1px solid var(--border, #cbd5e1)',
                color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              <Navigation size={13} /> الانتقال للمحطة
            </button>
          </div>

          {/* Stops tree */}
          <div style={{ padding: '8px 16px 12px 28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 12, bottom: 12, right: 6, width: 2, background: 'var(--border, #cbd5e1)', zIndex: 0 }} />

              {/* Start node */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: ngoColor, border: '2px solid var(--bg-dark, #f8fafc)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main, #334155)' }}>{startName} (الانطلاق)</span>
              </div>

              {/* Stops */}
              {stops.map((stop: any, idx: number) => {
                const point = getPointForStop(stop.id)
                const status = point?.reservationStatus || 'reserved'
                const isDelivered = status === 'delivered' || status === 'verified'
                const isInTransit = status === 'in_transit'
                const isPending = status === 'reserved'
                const statusInfo = RESERVATION_STATUS[status as keyof typeof RESERVATION_STATUS]
                const dotColor = isDelivered ? '#10b981' : isInTransit ? '#f59e0b' : 'var(--text-muted, #94a3b8)'

                return (
                  <div key={stop.id} style={{ padding: '6px 0', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%', background: dotColor,
                        border: '2px solid var(--bg-dark, #f8fafc)', flexShrink: 0, marginTop: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '0.4rem', color: '#fff', fontWeight: 'bold' }}>
                          {isDelivered ? '✓' : idx + 1}
                        </span>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 600,
                            color: isDelivered ? 'var(--text-muted, #94a3b8)' : 'var(--text-main, #334155)',
                            textDecoration: isDelivered ? 'line-through' : 'none',
                          }}>
                            {stop.name}
                          </span>
                          <span style={{
                            fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                            color: statusInfo?.color || '#6B7280',
                            background: `${statusInfo?.color || '#6B7280'}12`,
                            border: `1px solid ${statusInfo?.color || '#6B7280'}20`,
                          }}>
                            {statusInfo?.icon} {statusInfo?.name || 'محجوز'}
                          </span>
                        </div>

                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>
                          💧 {(stop.demand || 0).toLocaleString()} لتر
                        </span>

                        {/* Action per stop */}
                        {point && isPending && (
                          <button onClick={(e) => { e.stopPropagation(); onStartStop(stop.id) }} style={{
                            marginTop: 2, padding: '7px 10px', borderRadius: 6, width: '100%',
                            background: 'var(--bg-elevated, #fff)', border: `1.5px solid ${ngoColor}40`,
                            color: ngoColor, fontSize: '0.72rem', fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}>
                            <Truck size={13} /> بدء التوصيل
                          </button>
                        )}
                        {point && isInTransit && (
                          <button onClick={(e) => { e.stopPropagation(); onDocumentStop(point) }} style={{
                            marginTop: 2, padding: '8px 10px', borderRadius: 6, width: '100%',
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: '#fff', border: 'none', fontSize: '0.72rem', fontWeight: 800,
                            cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            boxShadow: '0 2px 8px rgba(16,185,129,0.2)',
                          }}>
                            <FileCheck size={14} /> توثيق التسليم
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Return node */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', position: 'relative', zIndex: 1, opacity: 0.6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--text-muted, #94a3b8)', border: '2px solid var(--bg-dark, #f8fafc)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>↩ العودة للمحطة</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════ DriverTaskCard — row-based expandable (matches program style) ═══════ */
function DriverTaskCard({ point, ngoColor, onStart, onArrived, onFlyTo }: {
  point: Point; ngoColor: string; onStart: () => void; onArrived: () => void; onFlyTo: () => void
}) {
  const [expanded, setExpanded] = React.useState(false)
  const isInTransit = point.reservationStatus === 'in_transit'
  const status = RESERVATION_STATUS[point.reservationStatus as keyof typeof RESERVATION_STATUS]
  const dotColor = isInTransit ? '#f59e0b' : 'var(--text-muted, #94a3b8)'

  return (
    <div style={{ borderBottom: '1px solid var(--border, rgba(0,0,0,0.05))' }}>
      {/* Row Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', cursor: 'pointer',
          backgroundColor: expanded ? 'var(--bg-dark, #f1f5f9)' : 'transparent',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'var(--bg-dark, rgba(0,0,0,0.02))' }}
        onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <div style={{ color: 'var(--text-muted, #64748b)', width: 14 }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main, #1e293b)' }}>
              {point.name}
            </span>
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px', borderRadius: 6, whiteSpace: 'nowrap',
              background: `${status?.color || '#6B7280'}12`,
              color: status?.color || '#6B7280',
              border: `1px solid ${status?.color || '#6B7280'}20`,
            }}>
              {status?.icon} {status?.name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Droplets size={10} color={ngoColor} /> {point.demand.toLocaleString()} لتر</span>
            <span>•</span>
            <span>{point.governorate}</span>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onFlyTo() }} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px',
          color: 'var(--text-muted, #94a3b8)',
        }} title="الذهاب على الخريطة"><Navigation size={14} /></button>
      </div>

      {/* Expanded Actions */}
      {expanded && (
        <div style={{
          padding: '10px 16px 12px 34px',
          background: 'var(--bg-dark, #f8fafc)',
          borderTop: '1px solid var(--border, rgba(0,0,0,0.03))',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {point.reservationStatus === 'reserved' && (
            <button onClick={onStart} style={{
              width: '100%', padding: '8px 12px', borderRadius: 6,
              background: 'var(--bg-elevated, #fff)', border: `1.5px solid ${ngoColor}40`,
              color: ngoColor, fontWeight: 700, fontSize: '0.72rem',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Truck size={13} /> بدء التوصيل
            </button>
          )}
          {isInTransit && (
            <button onClick={onArrived} style={{
              width: '100%', padding: '8px 12px', borderRadius: 6,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.72rem',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 2px 8px rgba(16,185,129,0.2)',
            }}>
              <FileCheck size={14} /> توثيق التسليم
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════ InlineConfirmForm — delivery documentation ═══════ */
function InlineConfirmForm({ point, gps, onConfirm, onCancel }: {
  point: Point; gps: GPSPosition | null
  onConfirm: (name: string, liters: number, notes: string) => void; onCancel: () => void
}) {
  const [receiverName, setReceiverName] = useState('')
  const [confirmedLiters, setConfirmedLiters] = useState(point.demand)
  const [notes, setNotes] = useState('')
  const canSubmit = receiverName.trim().length >= 2 && confirmedLiters > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        background: 'var(--bg-dark, #f1f5f9)', padding: '12px 16px',
        borderBottom: '1px solid var(--border, #e2e8f0)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button onClick={onCancel} style={{
          background: 'var(--bg-elevated, #fff)', border: '1px solid var(--border, #e2e8f0)',
          color: 'var(--text-main, #334155)', cursor: 'pointer', padding: 6, borderRadius: 6,
          display: 'flex', alignItems: 'center',
        }}>
          <ArrowRight size={14} />
        </button>
        <Shield size={16} color="var(--primary, #2563eb)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main, #1e293b)' }}>توثيق التسليم</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Point Info */}
          <div style={{
            background: 'var(--bg-dark, #f8fafc)', borderRadius: 8, padding: '12px 14px',
            border: '1px solid var(--border, #e2e8f0)',
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 6, color: 'var(--text-main, #1e293b)' }}>📍 {point.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>📌 {point.governorate}{point.neighborhood ? ` — ${point.neighborhood}` : ''}</span>
              <span>💧 الحصة: {point.demand.toLocaleString()} لتر</span>
              {gps && <span>🛰 GPS: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</span>}
              <span>🕐 {new Date().toLocaleString('ar-EG')}</span>
            </div>
          </div>

          {/* Form */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <User size={12} /> اسم المستلم
            </label>
            <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="مثال: أحمد محمد" autoFocus style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Droplets size={12} /> الكمية المسلّمة (لتر)
            </label>
            <input value={String(confirmedLiters)} onChange={(e) => setConfirmedLiters(+e.target.value || 0)} type="number" style={inputStyle} />
          </div>

          {confirmedLiters < point.demand && (
            <div style={{
              padding: '8px 12px', borderRadius: 6, fontSize: '0.72rem',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              color: '#d97706', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
            }}>
              <AlertTriangle size={13} /> الكمية أقل من الحصة ({point.demand.toLocaleString()} لتر)
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              ملاحظات (اختياري)
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="أي ملاحظات..." style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} />
          </div>

          <button onClick={() => onConfirm(receiverName, confirmedLiters, notes)} disabled={!canSubmit} style={{
            width: '100%', padding: '12px 14px', borderRadius: 6,
            background: canSubmit ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'var(--bg-dark, #f1f5f9)',
            color: canSubmit ? '#fff' : 'var(--text-muted, #94a3b8)',
            border: canSubmit ? 'none' : '1px solid var(--border, #e2e8f0)',
            fontWeight: 800, fontSize: '0.85rem', cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: canSubmit ? '0 3px 12px rgba(16,185,129,0.2)' : 'none',
          }}>
            <Shield size={16} /> تأكيد التسليم النهائي
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════ CompletedMini — row style ═══════ */
function CompletedMini({ point, delivery }: { point: Point; delivery?: DeliveryRecord }) {
  const isVerified = point.reservationStatus === 'verified'
  const dotColor = isVerified ? '#10b981' : '#64748b'
  const statusText = delivery?.pendingSync ? 'قيد المزامنة' : (isVerified ? 'مؤكّد' : 'تم التسليم')
  const statusColor = delivery?.pendingSync ? '#d97706' : (isVerified ? '#10b981' : '#64748b')

  return (
    <div style={{
      borderBottom: '1px solid var(--border, rgba(0,0,0,0.05))',
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontWeight: 600, fontSize: '0.78rem',
            color: 'var(--text-muted, #94a3b8)',
            textDecoration: 'line-through',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {point.name}
          </span>
          {delivery?.pendingSync && <span title="بانتظار المزامنة" style={{ fontSize: '0.6rem' }}>🔄</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
          <span><Droplets size={10} style={{ verticalAlign: 'middle' }} /> {delivery?.liters?.toLocaleString() || point.demand.toLocaleString()} لتر</span>
          {delivery?.receipt?.receiverName && <><span>•</span><span>👤 {delivery.receipt.receiverName}</span></>}
        </div>
      </div>
      <span style={{
        padding: '2px 8px', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700,
        background: `${statusColor}12`,
        color: statusColor,
        border: `1px solid ${statusColor}20`,
        whiteSpace: 'nowrap',
      }}>
        {statusText}
      </span>
    </div>
  )
}

/* ═══════ Helper Components ═══════ */
function StatusChip({ color, icon, text }: { color: string; icon: React.ReactNode; text: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 6,
      background: 'var(--bg-elevated, #fff)', border: '1px solid var(--border, #e2e8f0)',
      fontSize: '0.62rem', fontWeight: 700, color,
    }}>
      {icon} {text}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 6,
  background: 'var(--bg-elevated, #fff)', border: '1.5px solid var(--border, #e2e8f0)',
  color: 'var(--text-main, #1e293b)', fontSize: '0.8rem', fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.2s',
}

/* ═══════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════ */
export function TripsPanel() {
  const role = useAuthStore((s) => s.role)
  if (role === 'driver') return <DriverTripsContent />
  return <AdminTripsContent />
}

function AdminTripsContent() {
  const trips = useDataStore((s) => s.trips)
  const clearTrips = useDataStore((s) => s.clearTrips)
  const map = useMapStore((s) => s.map)
  const { startSimulation } = useSimulationStore()
  const flyTo = (lat: number, lng: number) => map?.flyTo([lat, lng], 14, { duration: 0.8 })

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-elevated, #ffffff)',
      border: '1px solid var(--border, #e2e8f0)', borderRadius: 8, overflow: 'hidden',
    }}>
      <SectionHeader title={`الرحلات المحسوبة (${trips.length})`} icon={Route} onClear={trips.length > 0 ? clearTrips : undefined} actionText="تفريغ القائمة" />
      {trips.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', color: 'var(--text-muted, #94a3b8)' }}>
          <Truck size={36} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.5 }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main, #475569)' }}>لا توجد رحلات حالياً</span>
          <span style={{ fontSize: '0.75rem', marginTop: 4, textAlign: 'center' }}>الرجاء تشغيل المعالج لحساب مسارات التوزيع الذكية</span>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {trips.map((trip) => (
            <TripRow key={trip.id} trip={trip} onSimulate={(id) => startSimulation(id)} flyTo={flyTo} />
          ))}
        </div>
      )}
    </div>
  )
}
