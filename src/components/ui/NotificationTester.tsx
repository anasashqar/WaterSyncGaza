import { useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import type { UserRole } from '@/stores/useAuthStore'
import { EventBus } from '@/services/EventBus'

export function NotificationTester() {
  const { role, setRole, preferences, updatePreferences } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)

  const roles: { id: UserRole; label: string }[] = [
    { id: 'manager', label: 'مدير النظام' },
    { id: 'org', label: 'المؤسسة المانحة' },
    { id: 'coordinator', label: 'المنسق الميداني' },
    { id: 'driver', label: 'السائق' },
  ]

  const triggerDelivery = () => {
    EventBus.publish('WATER_DELIVERED', { amount: 5000, driverName: 'أحمد محمود', pointId: 'P-124' }, 'medium')
  }

  const triggerDepletion = () => {
    EventBus.publish('STATION_DEPLETED', { stationName: 'محطة الرمال المركزية' }, 'critical')
  }

  const triggerReroute = () => {
    EventBus.publish('EMERGENCY_REROUTE', { newPointId: 'P-999', zoneId: 'Z1' }, 'high')
  }

  const triggerBatch = () => {
    EventBus.publish('BATCH_APPROVED', { count: 35 }, 'medium')
  }

  if (!isOpen) {
    return (
      <button 
        style={{
          position: 'fixed', bottom: 24, left: 24, zIndex: 9999,
          background: 'var(--primary)', color: 'white', border: 'none',
          padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontWeight: 'bold'
        }}
        onClick={() => setIsOpen(true)}
      >
        محاكي الإشعارات الموجهة 🔔
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 24, zIndex: 9999,
      background: 'var(--bg-card)', padding: 16, borderRadius: 12,
      border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      width: 320, direction: 'rtl', display: 'flex', flexDirection: 'column', gap: 12
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)' }}>محاكي الإشعارات (RBAC)</h3>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>إغلاق</button>
      </div>

      <div>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>الدور الحالي:</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {roles.map(r => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)',
                background: role === r.id ? 'var(--primary)' : 'transparent',
                color: role === r.id ? 'white' : 'var(--text)',
                cursor: 'pointer', fontSize: '0.8rem'
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input 
          type="checkbox" 
          checked={preferences.muteAll} 
          onChange={(e) => updatePreferences({ muteAll: e.target.checked })}
          id="muteAll"
        />
        <label htmlFor="muteAll" style={{ fontSize: '0.85rem', color: 'var(--text)' }}>كتم جميع الإشعارات (DND)</label>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={triggerDelivery} style={btnStyle}>🚚 محاكاة: إفراغ حمولة مياه</button>
        <button onClick={triggerDepletion} style={{...btnStyle, borderLeftColor: 'var(--danger)'}}>⚠️ محاكاة: نفاد مياه محطة (حرج)</button>
        <button onClick={triggerReroute} style={{...btnStyle, borderLeftColor: 'var(--warning)'}}>🔄 محاكاة: إعادة توجيه طارئ</button>
        <button onClick={triggerBatch} style={{...btnStyle, borderLeftColor: 'var(--success)'}}>✅ محاكاة: اعتماد مجمع للطلبات</button>
      </div>
      
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, marginTop: 4 }}>
        قم بتغيير الدور ثم اضغط على الأزرار لرؤية كيف يقوم (Rules Engine) بفلترة الإشعارات وتغيير محتواها.
      </p>
    </div>
  )
}

const btnStyle = {
  background: 'var(--bg-lighter)', color: 'var(--text)', border: '1px solid var(--border)',
  borderLeft: '4px solid var(--primary)', padding: '8px 12px', borderRadius: 6,
  cursor: 'pointer', textAlign: 'right' as const, fontSize: '0.85rem', transition: 'all 0.2s'
}
