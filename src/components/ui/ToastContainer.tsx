/**
 * WaterSync — Toast Notifications — Original toast.css Clone
 */
import { useUIStore } from '@/stores/useUIStore'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

export function ToastContainer() {
  const notifications = useUIStore((s) => s.notifications)
  const removeNotification = useUIStore((s) => s.removeNotification)

  if (notifications.length === 0) return null

  const icons: Record<string, React.ReactNode> = {
    success: <CheckCircle2 size={18} strokeWidth={2.5} color="var(--success)" />, 
    warning: <AlertTriangle size={18} strokeWidth={2.5} color="var(--warning)" />, 
    error: <XCircle size={18} strokeWidth={2.5} color="var(--danger)" />, 
    info: <Info size={18} strokeWidth={2.5} color="var(--primary)" />,
  }

  return (
    <div style={{
      position: 'fixed', top: 120, right: 24,
      zIndex: 10002, display: 'flex', flexDirection: 'column',
      gap: 10, maxWidth: 380, pointerEvents: 'none',
      direction: 'rtl',
    }}>
      {notifications.map((notif) => {
        const typeColors: Record<string, string> = {
          success: 'var(--success)', warning: 'var(--warning)',
          error: 'var(--danger)', info: 'var(--primary)',
        }
        const typeBgs: Record<string, string> = {
          success: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(0,135,90,0.08) 100%)',
          warning: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(217,119,6,0.08) 100%)',
          error: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(196,30,58,0.08) 100%)',
          info: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(30,58,95,0.1) 100%)',
        }

        return (
          <div key={notif.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px',
            background: typeBgs[notif.type] || typeBgs.info,
            borderRadius: 12, border: '1px solid var(--border)',
            borderLeft: `3px solid ${typeColors[notif.type] || typeColors.info}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)',
            pointerEvents: 'all', cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            animation: 'toastSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
            position: 'relative',
          }}
            onClick={() => removeNotification(notif.id)}
          >
            {/* Icon */}
            <div style={{
              flexShrink: 0, fontSize: '1.3rem', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32,
            }}>
              {icons[notif.type]}
            </div>
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.5 }}>
                {notif.message}
              </div>
            </div>
            {/* Close */}
            <button style={{
              flexShrink: 0, width: 26, height: 26, borderRadius: 6,
              border: 'none', background: 'transparent', color: 'var(--text-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', fontSize: '0.75rem', opacity: 0.5,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.background = 'transparent' }}
            ><X size={14} /></button>
            {/* Progress bar */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: 3, background: 'rgba(255,255,255,0.08)',
              borderRadius: '0 0 12px 12px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: '100%', transformOrigin: 'left',
                background: typeColors[notif.type] || typeColors.info,
                animation: 'toastProgress 4s linear forwards',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
