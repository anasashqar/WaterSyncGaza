/**
 * WaterSync — Driver Field View (Plan 3 — Phase 3)
 * واجهة السائق الميدانية: بطاقات المهام + تأكيد الاستلام + GPS + مزامنة
 * تعمل كتطبيق ميداني مبسّط (PWA-ready) مخصص لسائق الشاحنة
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDataStore } from '@/stores/useDataStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { RESERVATION_STATUS } from '@/lib/constants/colors'
import type { Point, DeliveryRecord } from '@/types'
import {
  X, Truck, MapPin, CheckCircle2,
  Navigation, Droplets, ChevronDown, ChevronUp,
  Wifi, WifiOff, User, Phone, Package,
  ArrowRight, Shield, AlertTriangle,
} from 'lucide-react'

/* ═══════ Types ═══════ */
interface GPSPosition {
  lat: number
  lng: number
  accuracy: number
  timestamp: number
}

type DriverTab = 'tasks' | 'completed' | 'sync'

interface SyncRecord {
  id: string
  deliveryId: string
  pointName: string
  timestamp: string
  status: 'pending' | 'synced' | 'failed'
  retries: number
}

/* ═══════ GPS Helper ═══════ */
function getCurrentGPS(): Promise<GPSPosition> {
  return new Promise((resolve) => {
    // Simulate GPS (in real PWA, use navigator.geolocation)
    const gazaCenter = { lat: 31.5017, lng: 34.4668 }
    resolve({
      lat: gazaCenter.lat + (Math.random() - 0.5) * 0.02,
      lng: gazaCenter.lng + (Math.random() - 0.5) * 0.02,
      accuracy: Math.round(5 + Math.random() * 15),
      timestamp: Date.now(),
    })
  })
}

/* ═══════ Main Component ═══════ */
export function DriverView({ onClose }: { onClose: () => void }) {
  const points = useDataStore((s) => s.points)
  const updateReservationStatus = useDataStore((s) => s.updateReservationStatus)
  const addDelivery = useDataStore((s) => s.addDelivery)
  const updateDelivery = useDataStore((s) => s.updateDelivery)
  const deliveries = useDataStore((s) => s.deliveries)
  const institutions = useDataStore((s) => s.institutions)
  const institutionId = useAuthStore((s) => s.institutionId)
  const addNotification = useUIStore((s) => s.addNotification)

  const [tab, setTab] = useState<DriverTab>('tasks')
  const [confirmingPoint, setConfirmingPoint] = useState<Point | null>(null)
  const [gps, setGPS] = useState<GPSPosition | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [syncRecords, setSyncRecords] = useState<SyncRecord[]>([])

  // ── Get assigned tasks (points reserved by my institution) ──
  const myTasks = useMemo(() => {
    if (!institutionId) return points.filter((p) => p.reservedBy)
    return points.filter((p) => p.reservedBy === institutionId)
  }, [points, institutionId])

  const pendingTasks = useMemo(
    () => myTasks.filter((p) => p.reservationStatus === 'reserved' || p.reservationStatus === 'in_transit'),
    [myTasks]
  )

  const completedTasks = useMemo(
    () => myTasks.filter((p) => p.reservationStatus === 'delivered' || p.reservationStatus === 'verified'),
    [myTasks]
  )

  // ── GPS polling ──
  useEffect(() => {
    getCurrentGPS().then(setGPS)
    const interval = setInterval(() => getCurrentGPS().then(setGPS), 10000)
    return () => clearInterval(interval)
  }, [])

  // ── Online/Offline simulation ──
  useEffect(() => {
    const toggle = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', toggle)
    window.addEventListener('offline', toggle)
    return () => {
      window.removeEventListener('online', toggle)
      window.removeEventListener('offline', toggle)
    }
  }, [])

  // ── Get NGO info ──
  const myNGO = useMemo(
    () => institutions.find((n) => n.id === institutionId) ?? null,
    [institutions, institutionId]
  )

  // ── Start delivery (reserved → in_transit) ──
  const handleStartDelivery = useCallback(
    (pointId: string) => {
      updateReservationStatus(pointId, 'in_transit')
      addNotification('🚛 بدأ التوصيل — الشاحنة في الطريق', 'info')
    },
    [updateReservationStatus, addNotification]
  )

  // ── Open confirmation screen (in_transit → delivered) ──
  const handleArrived = useCallback(
    (point: Point) => {
      setConfirmingPoint(point)
    },
    []
  )

  // ── Confirm delivery (double verification) ──
  const handleConfirmDelivery = useCallback(
    async (point: Point, receiverName: string, _receiverPhone: string, confirmedLiters: number, notes: string) => {
      const gpsNow = await getCurrentGPS()

      // Create delivery record
      const delivery: DeliveryRecord = {
        id: `del_${Date.now()}`,
        tripId: 'field_direct',
        pointId: point.id,
        institutionId: institutionId || 'unknown',
        driverId: 'driver_demo',
        stationId: 'field',
        liters: confirmedLiters,
        status: 'unloaded',
        loadedAt: null,
        loadedGPS: null,
        unloadedAt: new Date().toISOString(),
        unloadedGPS: [gpsNow.lat, gpsNow.lng],
        receipt: {
          receiverName,
          confirmedLiters,
          notes: notes || '',
          confirmedAt: new Date().toISOString(),
          confirmedGPS: [gpsNow.lat, gpsNow.lng],
        },
        createdAt: new Date().toISOString(),
        pendingSync: !isOnline,
      }

      addDelivery(delivery)
      updateReservationStatus(point.id, 'delivered')

      // Add sync record
      const syncRecord: SyncRecord = {
        id: `sync_${Date.now()}`,
        deliveryId: delivery.id,
        pointName: point.name,
        timestamp: new Date().toISOString(),
        status: isOnline ? 'synced' : 'pending',
        retries: 0,
      }
      setSyncRecords((prev) => [syncRecord, ...prev])

      // Simulate auto-verification after 3 seconds (in real app, this would be server-side)
      setTimeout(() => {
        updateReservationStatus(point.id, 'verified')
        updateDelivery(delivery.id, { status: 'verified' })
        addNotification('✅ تم تأكيد التسليم والتحقق — العملية مكتملة', 'success')
      }, 3000)

      setConfirmingPoint(null)
      addNotification(`📦 تم تسجيل التسليم لـ "${point.name}" — بانتظار التحقق`, 'success')
    },
    [institutionId, isOnline, addDelivery, updateReservationStatus, updateDelivery, addNotification]
  )

  // ── Simulate background sync ──
  const handleRetrySync = useCallback(
    (syncId: string) => {
      setSyncRecords((prev) =>
        prev.map((s) =>
          s.id === syncId ? { ...s, status: 'synced' as const, retries: s.retries + 1 } : s
        )
      )
      addNotification('🔄 تمت المزامنة بنجاح', 'success')
    },
    [addNotification]
  )

  // ══════════════════════════════════════
  // Confirmation Modal (Double Verification)
  // ══════════════════════════════════════
  if (confirmingPoint) {
    return (
      <ConfirmationScreen
        point={confirmingPoint}
        gps={gps}
        onConfirm={(receiverName, receiverPhone, liters, notes) =>
          handleConfirmDelivery(confirmingPoint, receiverName, receiverPhone, liters, notes)
        }
        onCancel={() => setConfirmingPoint(null)}
      />
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'var(--bg-dark)', color: 'var(--text)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'inherit', animation: 'fadeIn 0.2s ease',
    }}>
      {/* ──── Header ──── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.95) 0%, rgba(15,23,42,0.95) 100%)',
        backdropFilter: 'blur(10px)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 64, flexShrink: 0,
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Truck size={22} />
          <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>الواجهة الميدانية</span>
          {myNGO && (
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
              background: `${myNGO.color}30`, color: myNGO.color,
              border: `1px solid ${myNGO.color}50`,
            }}>
              {myNGO.name}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Online indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 20,
            background: isOnline ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
            border: `1px solid ${isOnline ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            fontSize: '0.72rem', fontWeight: 600,
            color: isOnline ? '#34d399' : '#f87171',
          }}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isOnline ? 'متصل' : 'غير متصل'}
          </div>
          {/* GPS indicator */}
          {gps && (
            <div style={{
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)',
              fontSize: '0.68rem', fontWeight: 600, color: '#38bdf8',
            }}>
              📍 {gps.accuracy}م
            </div>
          )}
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', cursor: 'pointer', padding: 6, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ──── Tabs ──── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--glass-border)', flexShrink: 0,
        background: 'var(--bg-card)',
      }}>
        {([
          { key: 'tasks' as DriverTab, label: `المهام (${pendingTasks.length})`, icon: <Package size={14} /> },
          { key: 'completed' as DriverTab, label: `المكتملة (${completedTasks.length})`, icon: <CheckCircle2 size={14} /> },
          { key: 'sync' as DriverTab, label: `المزامنة (${syncRecords.length})`, icon: <Wifi size={14} /> },
        ]).map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '12px 8px', fontSize: '0.8rem', fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer', border: 'none',
            borderBottom: tab === key ? '2px solid var(--success)' : '2px solid transparent',
            background: tab === key ? 'rgba(16,185,129,0.06)' : 'transparent',
            color: tab === key ? 'var(--success)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s',
          }}>{icon} {label}</button>
        ))}
      </div>

      {/* ──── Body ──── */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* tasks tab */}
          {tab === 'tasks' && (
            pendingTasks.length === 0 ? (
              <EmptyState icon={<Package size={40} />} text="لا توجد مهام معلّقة حالياً" subtitle="ستظهر هنا النقاط المحجوزة لمؤسستك" />
            ) : (
              pendingTasks.map((point) => (
                <TaskCard
                  key={point.id}
                  point={point}
                  onStartDelivery={() => handleStartDelivery(point.id)}
                  onArrived={() => handleArrived(point)}
                />
              ))
            )
          )}

          {/* completed tab */}
          {tab === 'completed' && (
            completedTasks.length === 0 ? (
              <EmptyState icon={<CheckCircle2 size={40} />} text="لا توجد عمليات مكتملة بعد" subtitle="ستظهر هنا عمليات التسليم المحققة" />
            ) : (
              completedTasks.map((point) => {
                const delivery = deliveries.find((d) => d.pointId === point.id)
                return <CompletedCard key={point.id} point={point} delivery={delivery} />
              })
            )
          )}

          {/* sync tab */}
          {tab === 'sync' && (
            syncRecords.length === 0 ? (
              <EmptyState icon={<Wifi size={40} />} text="لا توجد سجلات مزامنة بعد" subtitle="ستظهر هنا حالة رفع البيانات للخادم" />
            ) : (
              syncRecords.map((rec) => (
                <SyncCard key={rec.id} record={rec} onRetry={() => handleRetrySync(rec.id)} />
              ))
            )
          )}
        </div>
      </div>

      {/* ──── Footer Stats ──── */}
      <div style={{
        padding: '12px 20px', background: 'var(--bg-card)', flexShrink: 0,
        borderTop: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24,
        fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600,
      }}>
        <span>📋 {myTasks.length} مهمة</span>
        <span>⏳ {pendingTasks.length} قيد التنفيذ</span>
        <span>✅ {completedTasks.length} مكتملة</span>
        <span>🔄 {syncRecords.filter((s) => s.status === 'pending').length} بانتظار الرفع</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Task Card — بطاقة المهمة الميدانية
   ═══════════════════════════════════════════ */
function TaskCard({ point, onStartDelivery, onArrived }: {
  point: Point
  onStartDelivery: () => void
  onArrived: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const status = RESERVATION_STATUS[point.reservationStatus as keyof typeof RESERVATION_STATUS]
  const isInTransit = point.reservationStatus === 'in_transit'

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 16,
      border: `1.5px solid ${isInTransit ? 'rgba(59,130,246,0.4)' : 'var(--glass-border)'}`,
      overflow: 'hidden', transition: 'all 0.3s',
      boxShadow: isInTransit ? '0 0 20px rgba(59,130,246,0.1)' : 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '16px 18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: `${status?.color || '#6B7280'}15`,
          color: status?.color || '#6B7280',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', flexShrink: 0,
        }}>
          {status?.icon || '○'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>{point.name}</div>
          <div style={{
            fontSize: '0.73rem', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span><MapPin size={10} /> {point.governorate || '—'}</span>
            <span><Droplets size={10} /> {point.demand.toLocaleString()} لتر</span>
          </div>
        </div>
        <div style={{
          padding: '4px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
          background: `${status?.color || '#6B7280'}18`,
          color: status?.color || '#6B7280',
          border: `1px solid ${status?.color || '#6B7280'}30`,
        }}>
          {status?.name || 'غير معروف'}
        </div>
        {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </div>

      {/* Expanded details + Actions */}
      {expanded && (
        <div style={{ padding: '0 18px 16px', animation: 'fadeIn 0.2s', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12,
            fontSize: '0.78rem',
          }}>
            <DetailRow icon={<MapPin size={13} />} label="الحي" value={point.neighborhood || '—'} />
            <DetailRow icon={<User size={13} />} label="السكان" value={point.population > 0 ? point.population.toLocaleString() : '—'} />
            <DetailRow icon={<Droplets size={13} />} label="الحصة" value={`${point.demand.toLocaleString()} لتر`} />
            <DetailRow icon={<Navigation size={13} />} label="الإحداثيات" value={`${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`} />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {point.reservationStatus === 'reserved' && (
              <button onClick={onStartDelivery} style={{
                flex: 1, padding: '12px 16px', borderRadius: 12,
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <Truck size={18} /> بدء التوصيل 🚛
              </button>
            )}
            {isInTransit && (
              <button onClick={onArrived} style={{
                flex: 1, padding: '12px 16px', borderRadius: 12,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <CheckCircle2 size={18} /> وصلت — تأكيد التسليم ✅
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   Confirmation Screen — شاشة التحقق المزدوج
   ═══════════════════════════════════════════ */
function ConfirmationScreen({ point, gps, onConfirm, onCancel }: {
  point: Point
  gps: GPSPosition | null
  onConfirm: (name: string, phone: string, liters: number, notes: string) => void
  onCancel: () => void
}) {
  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [confirmedLiters, setConfirmedLiters] = useState(point.demand)
  const [notes, setNotes] = useState('')
  const [step, setStep] = useState<1 | 2>(1)

  const canSubmit = receiverName.trim().length >= 2 && confirmedLiters > 0

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'var(--bg-dark)', color: 'var(--text)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'inherit', animation: 'fadeIn 0.15s ease',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.95) 0%, rgba(15,23,42,0.95) 100%)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 60, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={22} />
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>تأكيد الاستلام — التحقق المزدوج</span>
        </div>
        <button onClick={onCancel} style={{
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', cursor: 'pointer', padding: 6, borderRadius: 10,
          display: 'flex', alignItems: 'center',
        }}>
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Point Info */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 16, padding: 20,
            border: '1px solid var(--glass-border)',
          }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 8 }}>
              📍 {point.name}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>📌 {point.governorate} — {point.neighborhood || '—'}</span>
              <span>💧 الحصة المطلوبة: {point.demand.toLocaleString()} لتر</span>
              {gps && <span>📍 GPS: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)} (±{gps.accuracy}م)</span>}
              <span>🕐 {new Date().toLocaleString('ar-EG')}</span>
            </div>
          </div>

          {/* Progress Steps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <StepIndicator num={1} label="بيانات المستلم" active={step === 1} done={step > 1} />
            <ArrowRight size={16} color="var(--text-muted)" />
            <StepIndicator num={2} label="تأكيد الكمية" active={step === 2} done={false} />
          </div>

          {/* Step 1: Receiver Info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormField label="اسم المستلم (ممثل المجتمع)" icon={<User size={14} />}>
                <input
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="مثال: أحمد محمد"
                  style={inputStyle}
                  autoFocus
                />
              </FormField>
              <FormField label="رقم هاتف المستلم (اختياري)" icon={<Phone size={14} />}>
                <input
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="059xxxxxxx"
                  style={inputStyle}
                  type="tel"
                />
              </FormField>
              <button
                onClick={() => setStep(2)}
                disabled={receiverName.trim().length < 2}
                style={{
                  padding: '14px 20px', borderRadius: 12,
                  background: receiverName.trim().length >= 2
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                    : 'var(--bg-elevated)',
                  color: receiverName.trim().length >= 2 ? '#fff' : 'var(--text-muted)',
                  border: 'none', fontWeight: 700, fontSize: '0.9rem',
                  cursor: receiverName.trim().length >= 2 ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                التالي <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2: Confirm Liters */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormField label="الكمية المسلّمة فعلياً (لتر)" icon={<Droplets size={14} />}>
                <input
                  value={confirmedLiters}
                  onChange={(e) => setConfirmedLiters(+e.target.value || 0)}
                  type="number"
                  style={inputStyle}
                  autoFocus
                />
                {confirmedLiters < point.demand && (
                  <div style={{ marginTop: 4, fontSize: '0.72rem', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={12} /> الكمية أقل من الحصة المطلوبة ({point.demand.toLocaleString()} لتر)
                  </div>
                )}
              </FormField>
              <FormField label="ملاحظات (اختياري)" icon={<Package size={14} />}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية..."
                  style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
                />
              </FormField>
              
              {/* Summary */}
              <div style={{
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 12, padding: 16, fontSize: '0.8rem',
              }}>
                <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--success)' }}>
                  ✅ ملخص التسليم
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-muted)' }}>
                  <span>📍 النقطة: {point.name}</span>
                  <span>👤 المستلم: {receiverName}</span>
                  <span>💧 الكمية: {confirmedLiters.toLocaleString()} لتر</span>
                  {gps && <span>📌 GPS: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 12,
                    background: 'var(--bg-elevated)', color: 'var(--text)',
                    border: '1px solid var(--glass-border)',
                    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  ← رجوع
                </button>
                <button
                  onClick={() => onConfirm(receiverName, receiverPhone, confirmedLiters, notes)}
                  disabled={!canSubmit}
                  style={{
                    flex: 2, padding: '12px 20px', borderRadius: 12,
                    background: canSubmit
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : 'var(--bg-elevated)',
                    color: canSubmit ? '#fff' : 'var(--text-muted)',
                    border: 'none', fontWeight: 800, fontSize: '0.95rem',
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <Shield size={18} /> تأكيد التسليم النهائي
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Completed Card — بطاقة مهمة مكتملة
   ═══════════════════════════════════════════ */
function CompletedCard({ point, delivery }: { point: Point; delivery?: DeliveryRecord }) {
  const status = RESERVATION_STATUS[point.reservationStatus as keyof typeof RESERVATION_STATUS]
  const isVerified = point.reservationStatus === 'verified'

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 16, padding: '16px 18px',
      border: `1.5px solid ${isVerified ? 'rgba(16,185,129,0.3)' : 'var(--glass-border)'}`,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: `${status?.color || '#10B981'}15`,
        color: status?.color || '#10B981',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem', flexShrink: 0,
      }}>
        {status?.icon || '✅'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{point.name}</div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 2 }}>
          <span>💧 {delivery?.liters?.toLocaleString() || point.demand.toLocaleString()} لتر</span>
          {delivery?.receipt?.receiverName && <span>👤 {delivery.receipt.receiverName}</span>}
        </div>
        {delivery?.unloadedAt && (
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
            🕐 {new Date(delivery.unloadedAt).toLocaleString('ar-EG')}
          </div>
        )}
      </div>
      <div style={{
        padding: '4px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
        background: `${status?.color || '#10B981'}18`,
        color: status?.color || '#10B981',
      }}>
        {status?.name || 'مكتمل'}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Sync Card — بطاقة حالة المزامنة
   ═══════════════════════════════════════════ */
function SyncCard({ record, onRetry }: { record: SyncRecord; onRetry: () => void }) {
  const statusColors = { pending: '#F59E0B', synced: '#10B981', failed: '#EF4444' }
  const statusLabels = { pending: 'بانتظار الرفع', synced: 'تم الرفع', failed: 'فشلت المزامنة' }
  const statusIcons = { pending: '⏳', synced: '✅', failed: '❌' }

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 12, padding: '14px 16px',
      border: '1px solid var(--glass-border)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: '1.2rem' }}>{statusIcons[record.status]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{record.pointName}</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          {new Date(record.timestamp).toLocaleString('ar-EG')}
        </div>
      </div>
      <span style={{
        padding: '3px 8px', borderRadius: 10, fontSize: '0.68rem', fontWeight: 700,
        color: statusColors[record.status],
        background: `${statusColors[record.status]}15`,
      }}>
        {statusLabels[record.status]}
      </span>
      {record.status === 'pending' && (
        <button onClick={onRetry} style={{
          padding: '5px 10px', borderRadius: 8,
          background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
          color: 'var(--text)', fontSize: '0.72rem', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          🔄 إعادة
        </button>
      )}
    </div>
  )
}

/* ═══════ Helper Components ═══════ */
function EmptyState({ icon, text, subtitle }: { icon: React.ReactNode; text: string; subtitle: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 20px',
      color: 'var(--text-muted)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 12,
    }}>
      <div style={{ opacity: 0.2 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{text}</div>
      <div style={{ fontSize: '0.8rem' }}>{subtitle}</div>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '8px 10px', borderRadius: 8,
      background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
    }}>
      <span style={{ color: 'var(--primary)', flexShrink: 0 }}>{icon}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{label}:</span>
      <span style={{ fontWeight: 600, fontSize: '0.78rem', marginRight: 'auto' }}>{value}</span>
    </div>
  )
}

function StepIndicator({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 20,
      background: active ? 'rgba(59,130,246,0.1)' : done ? 'rgba(16,185,129,0.1)' : 'var(--bg-elevated)',
      border: `1px solid ${active ? 'rgba(59,130,246,0.3)' : done ? 'rgba(16,185,129,0.3)' : 'var(--glass-border)'}`,
      fontSize: '0.75rem', fontWeight: 600,
      color: active ? '#3b82f6' : done ? '#10B981' : 'var(--text-muted)',
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? '#3b82f6' : done ? '#10B981' : 'var(--bg-card)',
        color: active || done ? '#fff' : 'var(--text-muted)',
        fontSize: '0.68rem', fontWeight: 800,
      }}>
        {done ? '✓' : num}
      </span>
      {label}
    </div>
  )
}

function FormField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)',
        marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {icon} {label}
      </div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  background: 'var(--bg-elevated)', border: '1.5px solid var(--glass-border)',
  color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.2s',
}
