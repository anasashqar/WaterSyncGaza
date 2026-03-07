/**
 * WaterSync — Sidebar (Exact clone of original layout.css sidebar)
 * شريط جانبي: شريط تنقل عمودي + محتوى اللوحة
 */
import { useUIStore } from '@/stores/useUIStore'
import { SupplyDemandPanel } from './SupplyDemandPanel'
import { TripsPanel } from './TripsPanel'
import { ConstraintsPanel } from './ConstraintsPanel'
import type { SidebarPanel } from '@/types'

import { MapPin, Truck, Settings } from 'lucide-react'

const NAV_ITEMS: { key: SidebarPanel; icon: React.ReactNode; label: string }[] = [
  { key: 'supply', icon: <MapPin size={22} />, label: 'المواقع' },
  { key: 'trips', icon: <Truck size={22} />, label: 'الرحلات' },
  { key: 'constraints', icon: <Settings size={22} />, label: 'القيود' },
]

export function Sidebar() {
  const activePanel = useUIStore((s) => s.activePanel)
  const setActivePanel = useUIStore((s) => s.setActivePanel)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  if (!sidebarOpen) return null

  // All roles see all tabs; edit actions inside panels are admin-gated
  const visibleItems = NAV_ITEMS

  return (
    <aside style={{
      width: 400, flexShrink: 0,
      background: 'var(--bg-card)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRight: '1px solid var(--glass-border)',
      display: 'flex', flexDirection: 'row', overflow: 'hidden',
      boxShadow: 'var(--shadow-md)',
    }}>
      {/* ===== Vertical Rail Navigation (Always Dark Navy) ===== */}
      <nav style={{
        width: 80, flexShrink: 0,
        background: 'linear-gradient(180deg, #0f172a 0%, #003366 100%)',
        color: '#ffffff',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '20px 0', gap: 12,
        overflowY: 'auto', scrollbarWidth: 'none',
      }}>
        {visibleItems.map((item) => {
          const isActive = activePanel === item.key
          return (
            <button
              key={item.key}
              onClick={() => setActivePanel(item.key)}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                width: 64, height: 60, padding: 8,
                borderRadius: 14, border: isActive ? '1px solid rgba(56,189,248,0.4)' : 'none',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(56,189,248,0.05) 100%)'
                  : 'transparent',
                color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                position: 'relative',
                boxShadow: isActive ? '0 0 20px rgba(56,189,248,0.15)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.color = '#ffffff'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
                  e.currentTarget.style.transform = ''
                }
              }}
            >
              {/* Active indicator bar (RTL: left side) */}
              {isActive && (
                <div style={{
                  position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
                  height: 24, width: 4, borderRadius: 4,
                  background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)',
                }} />
              )}
              <span style={{
                marginBottom: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                filter: isActive ? 'drop-shadow(0 0 8px rgba(56,189,248,0.5))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                transition: 'filter 0.3s, transform 0.3s',
              }}>{item.icon}</span>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, whiteSpace: 'nowrap',
              }}>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* ===== Content Panel ===== */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: 16,
        background: 'var(--bg-card)', height: '100%',
      }}>
        {activePanel === 'supply' && <SupplyDemandPanel />}
        {activePanel === 'trips' && <TripsPanel />}
        {activePanel === 'constraints' && <ConstraintsPanel />}
      </div>
    </aside>
  )
}
