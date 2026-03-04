/**
 * WaterSync — Unified App Header + Toolbar
 * شريط موحد واحد — شعار + أدوات + أزرار العرض
 */
import { useUIStore } from '@/stores/useUIStore'
import { useMapStore } from '@/stores/useMapStore'
import { useDataStore } from '@/stores/useDataStore'
import { calculateMDCVRP } from '@/lib/engine/mdcvrp'
import {
  Calculator, Moon, Sun, PanelLeftClose, PanelLeftOpen,
  BarChart3, FileText, Edit3, Factory, MapPin,
  AlertTriangle, X, Droplets
} from 'lucide-react'

interface ToolbarProps {
  onOpenDashboard?: () => void
  onOpenReports?: () => void
  onOpenEditor?: () => void
}

export function AppToolbar({ onOpenDashboard, onOpenReports, onOpenEditor }: ToolbarProps) {
  const theme = useUIStore(s => s.theme)
  const toggleTheme = useUIStore(s => s.toggleTheme)
  const sidebarOpen = useUIStore(s => s.sidebarOpen)
  const toggleSidebar = useUIStore(s => s.toggleSidebar)
  const addNotification = useUIStore(s => s.addNotification)

  const setMode = useMapStore(s => s.setMode)
  const mode = useMapStore(s => s.mode)
  const graph = useMapStore(s => s.graph)
  const findGovernorate = useMapStore(s => s.findGovernorate)

  const stations = useDataStore(s => s.stations)
  const points = useDataStore(s => s.points)
  const exclusionZones = useDataStore(s => s.exclusionZones)
  const setTrips = useDataStore(s => s.setTrips)
  const incrementDistribution = useDataStore(s => s.incrementDistribution)

  const handleCalculate = () => {
    if (stations.length === 0) return addNotification('يرجى إضافة محطة تعبئة أولاً', 'warning')
    if (points.length === 0) return addNotification('يرجى إضافة نقاط توزيع أولاً', 'warning')
    const totalInstitutions = stations.reduce((sum, s) => sum + s.institutions.length, 0)
    if (totalInstitutions === 0) return addNotification('يرجى إضافة مؤسسات للمحطات أولاً', 'warning')

    const result = calculateMDCVRP({
      stations: [...stations], points: [...points], exclusionZones, graph, findGovernorate,
    })
    setTrips(result.trips)
    incrementDistribution()
    if (result.unservedPoints.length > 0) {
      addNotification(`${result.trips.length} رحلة | عجز: ${result.unservedPoints.length} نقطة`, 'warning')
    } else {
      addNotification(`تم حساب ${result.trips.length} رحلة بنجاح`, 'success')
    }
  }

  return (
    <header style={{
      background: 'linear-gradient(135deg, #0a1628 0%, #122240 50%, #0a1628 100%)',
      borderBottom: '1px solid rgba(56,189,248,0.08)',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', height: 54,
      boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      flexShrink: 0, zIndex: 100, gap: 0,
    }}>

      {/* ═══ Logo ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginInlineEnd: 16 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(59,130,246,0.1))',
          border: '1px solid rgba(56,189,248,0.2)',
        }}><Droplets size={18} color="#38bdf8" /></div>
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', letterSpacing: 0.5, lineHeight: 1.1 }}>WaterSync</div>
          <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>نظام توزيع المياه الذكي</div>
        </div>
      </div>

      {/* ═══ Separator ═══ */}
      <Divider />

      {/* ═══ Navigation Group ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 10, padding: '3px 4px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <NavBtn icon={<BarChart3 size={15} />} label="لوحة التحكم" onClick={() => onOpenDashboard?.()} />
        <NavBtn icon={<FileText size={15} />} label="التقارير" onClick={() => onOpenReports?.()} />
        <NavBtn icon={<Edit3 size={15} />} label="المحرر" onClick={() => onOpenEditor?.()} />
      </div>

      {/* ═══ Spacer ═══ */}
      <div style={{ flex: 1 }} />

      {/* ═══ Calculate — Hero Button ═══ */}
      <button onClick={handleCalculate} style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 20px', borderRadius: 10, marginInlineEnd: 12,
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 0 16px rgba(5,150,105,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
        fontSize: '0.82rem', fontWeight: 700, fontFamily: 'inherit',
        cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: 0.3,
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(5,150,105,0.5), inset 0 1px 0 rgba(255,255,255,0.15)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 16px rgba(5,150,105,0.35), inset 0 1px 0 rgba(255,255,255,0.1)' }}
      >
        <Calculator size={15} /> حساب التوزيع
      </button>

      {/* ═══ Separator ═══ */}
      <Divider />

      {/* ═══ Theme Toggle ═══ */}
      <ToolBtn
        icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        tip="تبديل المظهر"
        onClick={toggleTheme}
      />

      {/* ═══ Sidebar Toggle ═══ */}
      <ToolBtn
        icon={sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        tip={sidebarOpen ? 'إخفاء اللوحة' : 'إظهار اللوحة'}
        onClick={toggleSidebar}
      />

      {/* ═══ Active Mode Indicator (appears when placing items) ═══ */}
      {mode && (
        <div style={{
          position: 'absolute', bottom: -36, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 18px', borderRadius: '0 0 10px 10px',
          background: mode === 'station' ? 'rgba(139,92,246,0.95)' : mode === 'point' ? 'rgba(59,130,246,0.95)' : 'rgba(239,68,68,0.95)',
          color: '#fff', fontSize: '0.78rem', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)', zIndex: 200,
          animation: 'fadeIn 0.25s ease',
          whiteSpace: 'nowrap',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
          <span>{mode === 'station' ? <Factory size={14} /> : mode === 'point' ? <MapPin size={14} /> : <AlertTriangle size={14} />}</span>
          <span>
            {mode === 'station' && 'انقر على الخريطة لوضع محطة'}
            {mode === 'point' && 'انقر على الخريطة لوضع نقطة توزيع'}
            {mode === 'zone' && 'انقر على الخريطة لوضع منطقة خطرة'}
          </span>
          <button onClick={() => setMode(null)} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            width: 22, height: 22, borderRadius: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginInlineStart: 2,
          }}><X size={13} /></button>
        </div>
      )}
    </header>
  )
}

/* ─── Sub Components ─── */

function NavBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '6px 12px', borderRadius: 7,
      background: 'transparent', border: 'none',
      color: 'rgba(255,255,255,0.65)', fontSize: '0.73rem', fontWeight: 600,
      fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s',
      whiteSpace: 'nowrap',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
    >
      {icon} {label}
    </button>
  )
}

function ToolBtn({ icon, tip, onClick }: { icon: React.ReactNode; tip: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={tip} style={{
      width: 32, height: 32, borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      color: 'rgba(255,255,255,0.55)', cursor: 'pointer', transition: 'all 0.2s',
      flexShrink: 0, marginInlineStart: 4,
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
    >{icon}</button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)', margin: '0 12px', flexShrink: 0 }} />
}
