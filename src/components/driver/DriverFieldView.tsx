/**
 * WaterSync — Driver Field View (Simplified)
 * واجهة ميدانية مبسطة للسائق فقط: بطاقات مهام كبيرة + تأكيد تسليم سريع
 * مصممة لتكون PWA-ready — بسيطة وسهلة الاستخدام في الميدان
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDataStore } from '@/stores/useDataStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { RESERVATION_STATUS } from '@/lib/constants/colors'
import type { Point, DeliveryRecord } from '@/types'
import {
  X, Truck, MapPin, CheckCircle2,
  Droplets, Wifi, WifiOff, User,
  Shield, AlertTriangle, ArrowLeft, Navigation,
  Package,
} from 'lucide-react'

/* ═══════ Types ═══════ */
interface GPSPosition {
  lat: number
  lng: number
  accuracy: number
  timestamp: number
}

/* ═══════ GPS Helper ═══════ */
function getCurrentGPS(): Promise<GPSPosition> {
  return new Promise((resolve) => {
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
export function DriverFieldView({ onClose }: { onClose: () => void }) {
  const points = useDataStore((s) => s.points)
  const updateReservationStatus = useDataStore((s) => s.updateReservationStatus)
  const addDelivery = useDataStore((s) => s.addDelivery)
  const updateDelivery = useDataStore((s) => s.updateDelivery)
  const deliveries = useDataStore((s) => s.deliveries)
  const institutions = useDataStore((s) => s.institutions)
  const institutionId = useAuthStore((s) => s.institutionId)
  const addNotification = useUIStore((s) => s.addNotification)

  const [confirmingPoint, setConfirmingPoint] = useState<Point | null>(null)
  const [gps, setGPS] = useState<GPSPosition | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  // ── Get assigned tasks ──
  const myTasks = useMemo(() => {
    if (!institutionId) return points.filter((p) => p.reservedBy)
    return points.filter((p) => p.reservedBy === institutionId)
  }, [points, institutionId])

  const pendingTasks = useMemo(
    () => myTasks.filter((p) => p.reservationStatus === 'reserved' || p.reservationStatus === 'in_transit'),
    [myTasks]
  )

  const completedToday = useMemo(
    () => myTasks.filter((p) => p.reservationStatus === 'delivered' || p.reservationStatus === 'verified'),
    [myTasks]
  )

  const myNGO = useMemo(
    () => institutions.find((n) => n.id === institutionId) ?? null,
    [institutions, institutionId]
  )

  // ── GPS polling ──
  useEffect(() => {
    getCurrentGPS().then(setGPS)
    const interval = setInterval(() => getCurrentGPS().then(setGPS), 10000)
    return () => clearInterval(interval)
  }, [])

  // ── Online/Offline ──
  useEffect(() => {
    const toggle = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', toggle)
    window.addEventListener('offline', toggle)
    return () => { window.removeEventListener('online', toggle); window.removeEventListener('offline', toggle) }
  }, [])

  // ── Actions ──
  const handleStartDelivery = useCallback((pointId: string) => {
    updateReservationStatus(pointId, 'in_transit')
    addNotification('🚛 بدأ التوصيل — الشاحنة في الطريق', 'info')
  }, [updateReservationStatus, addNotification])

  const handleArrived = useCallback((point: Point) => {
    setConfirmingPoint(point)
  }, [])

  const handleConfirmDelivery = useCallback(
    async (point: Point, receiverName: string, confirmedLiters: number, notes: string) => {
      const gpsNow = await getCurrentGPS()
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

      setTimeout(() => {
        updateReservationStatus(point.id, 'verified')
        updateDelivery(delivery.id, { status: 'verified' })
        addNotification('✅ تم التحقق — العملية مكتملة', 'success')
      }, 3000)

      setConfirmingPoint(null)
      addNotification(`📦 تم تسجيل التسليم — "${point.name}"`, 'success')
    },
    [institutionId, isOnline, addDelivery, updateReservationStatus, updateDelivery, addNotification]
  )

  // ══════ Confirmation Screen ══════
  if (confirmingPoint) {
    return (
      <QuickConfirmScreen
        point={confirmingPoint}
        gps={gps}
        onConfirm={(name, liters, notes) => handleConfirmDelivery(confirmingPoint, name, liters, notes)}
        onCancel={() => setConfirmingPoint(null)}
      />
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'var(--bg-dark)', color: 'var(--text)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'inherit',
      animation: 'fadeIn 0.2s ease',
    }}>
      {/* ──── Compact Header ──── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37,99,235,0.95) 0%, rgba(15,23,42,0.95) 100%)',
        backdropFilter: 'blur(10px)', color: '#ffffff',
        padding: '0 24px', height: 64, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Truck size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>سائق التوصيل</div>
            {myNGO && (
              <div style={{ fontSize: '0.65rem', color: myNGO.color, fontWeight: 600 }}>
                {myNGO.name}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Status Pills */}
          <StatusPill
            color={isOnline ? '#10B981' : '#EF4444'}
            icon={isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
            text={isOnline ? 'متصل' : 'غير متصل'}
          />
          {gps && <StatusPill color="#38bdf8" icon={<Navigation size={10} />} text={`±${gps.accuracy}م`} />}

          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', cursor: 'pointer', padding: 6, borderRadius: 8,
            display: 'flex', alignItems: 'center',
          }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ──── Progress Bar ──── */}
      <div style={{
        padding: '12px 16px', background: 'var(--bg-card)',
        borderBottom: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem',
            color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700,
          }}>
            <span>التقدم اليومي</span>
            <span>{completedToday.length}/{myTasks.length} مهمة</span>
          </div>
          <div style={{
            height: 6, borderRadius: 10, background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 10,
              width: myTasks.length > 0 ? `${(completedToday.length / myTasks.length) * 100}%` : '0%',
              background: 'var(--primary)',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'var(--primary-soft)', border: '1.5px solid rgba(37,99,235,0.2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}>{pendingTasks.length}</span>
          <span style={{ fontSize: '0.55rem', color: 'var(--primary)', opacity: 0.8, fontWeight: 700 }}>متبقي</span>
        </div>
      </div>

      {/* ──── Tasks List ──── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 12px' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pendingTasks.length === 0 && completedToday.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)',
            }}>
              <Truck size={56} style={{ marginBottom: 16, opacity: 0.3 }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>لا توجد مهام حالياً</div>
              <div style={{ fontSize: '0.8rem' }}>ستظهر هنا نقاط التوزيع المحجوزة لك</div>
            </div>
          ) : (
            <>
              {/* Active / Pending Tasks */}
              {pendingTasks.map((point) => (
                <FieldTaskCard
                  key={point.id}
                  point={point}
                  onStart={() => handleStartDelivery(point.id)}
                  onArrived={() => handleArrived(point)}
                />
              ))}

              {/* Completed divider */}
              {completedToday.length > 0 && pendingTasks.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0',
                  fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700,
                }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                  <span>✅ مكتملة ({completedToday.length})</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                </div>
              )}

              {/* Completed Tasks (compact) */}
              {completedToday.map((point) => {
                const del = deliveries.find((d) => d.pointId === point.id)
                return <CompletedMini key={point.id} point={point} delivery={del} />
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Field Task Card — بطاقة مهمة كبيرة وواضحة
   ═══════════════════════════════════════════ */
function FieldTaskCard({ point, onStart, onArrived }: {
  point: Point
  onStart: () => void
  onArrived: () => void
}) {
  const isInTransit = point.reservationStatus === 'in_transit'
  const status = RESERVATION_STATUS[point.reservationStatus as keyof typeof RESERVATION_STATUS]

  return (
    <div style={{
      background: isInTransit
        ? 'var(--primary-soft)'
        : 'var(--bg-card)',
      borderRadius: 16,
      border: isInTransit ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      transition: 'all 0.3s',
    }}>
      {/* In-transit animation bar */}
      {isInTransit && (
        <div style={{
          height: 3,
          background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
          animation: 'shimmer 2s infinite',
        }} />
      )}

      <div style={{ padding: '16px 18px' }}>
        {/* Point info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: `${status?.color || '#6B7280'}12`,
            border: `1.5px solid ${status?.color || '#6B7280'}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', flexShrink: 0,
          }}>
            {isInTransit ? '🚛' : '📍'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4, color: 'var(--text)' }}>
              {point.name}
            </div>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8,
              fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={11} /> {point.governorate}
              </span>
              {point.neighborhood && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  — {point.neighborhood}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--primary)' }}>
                <Droplets size={11} /> {point.demand.toLocaleString()} لتر
              </span>
            </div>
          </div>
          {/* Status badge */}
          <div style={{
            padding: '5px 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700,
            background: `${status?.color || '#6B7280'}15`,
            color: status?.color || '#6B7280',
            border: `1px solid ${status?.color || '#6B7280'}25`,
            whiteSpace: 'nowrap',
          }}>
            {status?.icon} {status?.name}
          </div>
        </div>

        {/* Action Button — BIG and clear */}
        {point.reservationStatus === 'reserved' && (
          <button onClick={onStart} style={{
            width: '100%', padding: '14px 20px', borderRadius: 14,
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.95rem',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}>
            <Truck size={20} /> بدء التوصيل 🚛
          </button>
        )}

        {isInTransit && (
          <button onClick={onArrived} style={{
            width: '100%', padding: '16px 20px', borderRadius: 14,
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#fff', border: 'none', fontWeight: 800, fontSize: '1rem',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            animation: 'pulse-glow 2s infinite',
          }}>
            <CheckCircle2 size={22} /> وصلت — تأكيد التسليم ✅
          </button>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Quick Confirm Screen — شاشة تأكيد سريعة
   ═══════════════════════════════════════════ */
function QuickConfirmScreen({ point, gps, onConfirm, onCancel }: {
  point: Point
  gps: GPSPosition | null
  onConfirm: (name: string, liters: number, notes: string) => void
  onCancel: () => void
}) {
  const [receiverName, setReceiverName] = useState('')
  const [confirmedLiters, setConfirmedLiters] = useState(point.demand)
  const [notes, setNotes] = useState('')
  const canSubmit = receiverName.trim().length >= 2 && confirmedLiters > 0

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'var(--bg-dark)', color: 'var(--text)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'inherit',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37,99,235,0.95) 0%, rgba(15,23,42,0.95) 100%)',
        backdropFilter: 'blur(10px)', color: '#ffffff',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', height: 60, flexShrink: 0,
        gap: 12,
        boxShadow: 'var(--shadow-md)',
      }}>
        <button onClick={onCancel} style={{
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', cursor: 'pointer', padding: 8, borderRadius: 10,
          display: 'flex', alignItems: 'center',
        }}>
          <ArrowLeft size={18} />
        </button>
        <Shield size={22} />
        <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>تأكيد التسليم</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 12px' }}>
        <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Point Info Card */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 14, padding: 16,
            border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 6, color: 'var(--text)' }}>
              📍 {point.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 500 }}>
              <span>📌 {point.governorate}{point.neighborhood ? ` — ${point.neighborhood}` : ''}</span>
              <span>💧 الحصة: {point.demand.toLocaleString()} لتر</span>
              {gps && <span>📍 GPS: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</span>}
              <span>🕐 {new Date().toLocaleString('ar-EG')}</span>
            </div>
          </div>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FieldInput
              label="اسم المستلم"
              icon={<User size={14} />}
              value={receiverName}
              onChange={setReceiverName}
              placeholder="مثال: أحمد محمد"
              autoFocus
            />

            <FieldInput
              label="الكمية المسلّمة (لتر)"
              icon={<Droplets size={14} />}
              value={String(confirmedLiters)}
              onChange={(v) => setConfirmedLiters(+v || 0)}
              type="number"
            />

            {confirmedLiters < point.demand && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, fontSize: '0.75rem',
                background: 'var(--warning-soft)', border: '1px solid rgba(245,158,11,0.3)',
                color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
              }}>
                <AlertTriangle size={14} /> الكمية أقل من الحصة ({point.demand.toLocaleString()} لتر)
              </div>
            )}

            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Package size={14} /> ملاحظات (اختياري)
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات..."
                style={{
                  ...fieldInputStyle, minHeight: 60, resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={() => onConfirm(receiverName, confirmedLiters, notes)}
            disabled={!canSubmit}
            style={{
              width: '100%', padding: '16px 20px', borderRadius: 14,
              background: canSubmit
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : 'var(--bg-elevated)',
              color: canSubmit ? '#fff' : 'var(--text-muted)',
              border: '1px solid var(--glass-border)',
              fontWeight: 800, fontSize: '1rem',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: canSubmit ? '0 4px 20px rgba(16,185,129,0.3)' : 'var(--shadow-sm)',
              transition: 'all 0.3s',
            }}
          >
            <Shield size={20} /> تأكيد التسليم النهائي
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Completed Mini — بطاقة مهمة مكتملة مصغّرة
   ═══════════════════════════════════════════ */
function CompletedMini({ point, delivery }: { point: Point; delivery?: DeliveryRecord }) {
  const isVerified = point.reservationStatus === 'verified'

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 12, padding: '12px 14px',
      border: `1px solid ${isVerified ? 'rgba(16,185,129,0.3)' : 'var(--glass-border)'}`,
      boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: '1.2rem' }}>{isVerified ? '✅' : '📦'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>{point.name}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: 6, marginTop: 4 }}>
          <span>💧 {delivery?.liters?.toLocaleString() || point.demand.toLocaleString()} لتر</span>
          {delivery?.receipt?.receiverName && <span>👤 {delivery.receipt.receiverName}</span>}
        </div>
      </div>
      <span style={{
        padding: '4px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700,
        background: isVerified ? 'var(--success-soft)' : 'var(--bg-elevated)',
        color: isVerified ? 'var(--success)' : 'var(--text-muted)',
      }}>
        {isVerified ? 'مؤكّد' : 'بانتظار التحقق'}
      </span>
    </div>
  )
}

/* ═══════ Helper Components ═══════ */

function StatusPill({ color, icon, text }: { color: string; icon: React.ReactNode; text: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 20,
      background: `${color}15`, border: `1px solid ${color}30`,
      fontSize: '0.62rem', fontWeight: 600, color,
    }}>
      {icon} {text}
    </div>
  )
}

function FieldInput({ label, icon, value, onChange, placeholder, type, autoFocus }: {
  label: string; icon: React.ReactNode; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; autoFocus?: boolean
}) {
  return (
    <div>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon} {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoFocus={autoFocus}
        style={fieldInputStyle}
      />
    </div>
  )
}

const fieldInputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 12,
  background: 'var(--bg-elevated)', border: '1.5px solid var(--glass-border)',
  color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}
