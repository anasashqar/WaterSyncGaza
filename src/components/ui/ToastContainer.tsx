import { useUIStore } from '@/stores/useUIStore'
import { AlertTriangle, XCircle, Info, X } from 'lucide-react'

// System notifications container. Toasts are reserved for critical exceptions or warnings.
export function ToastContainer() {
  const notifications = useUIStore((s) => s.notifications)
  const removeNotification = useUIStore((s) => s.removeNotification)

  if (notifications.length === 0) return null

  // Redefined icons for dark enterprise aesthetic
  const icons: Record<string, React.ReactNode> = {
    // success: Used extremely rarely now, maps to info
    success: <Info className="w-4 h-4 text-blue-500" strokeWidth={2.5} />, 
    warning: <AlertTriangle className="w-4 h-4 text-yellow-500" strokeWidth={2.5} />,
    error: <XCircle className="w-4 h-4 text-red-500" strokeWidth={2.5} />,
    info: <Info className="w-4 h-4 text-blue-500" strokeWidth={2.5} />,
  }

  return (
    <div 
      className="fixed top-[80px] left-0 right-0 z-[99999] flex flex-col items-center gap-2.5 pointer-events-none" 
      dir="rtl"
    >
      {notifications.map((notif) => {
        return (
          <div 
            key={notif.id} 
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-3 px-4 py-3 bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl pointer-events-auto cursor-pointer relative animate-[dropdownFade_0.3s_ease_forwards] min-w-[300px] max-w-[450px]"
            onClick={() => removeNotification(notif.id)}
          >
            {/* Icon */}
            <div className="shrink-0 flex items-center justify-center w-[18px] h-[18px] mt-[1px]">
              {icons[notif.type] || icons.info}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="text-[0.85rem] font-medium text-neutral-100 leading-snug">
                {notif.message}
              </div>
            </div>
            
            {/* Close */}
            <button 
              className="shrink-0 w-[22px] h-[22px] rounded border-none bg-transparent text-neutral-400 cursor-pointer flex items-center justify-center transition-all duration-150 p-0 -ml-1 -mt-0.5 hover:text-white hover:bg-white/10"
              onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notif.id);
              }}
              aria-label="إغلاق التنبيه"
            >
                <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
