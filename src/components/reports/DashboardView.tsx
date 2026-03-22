/**
 * WaterSync — Enterprise Dashboard View
 * مركز العمليات والتحكم - متوافق مع تصميم المشروع ومركز التقارير
 */
import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { useDataStore } from '@/stores/useDataStore'
import { useUIStore } from '@/stores/useUIStore'
import { 
  Activity, MapPin, Truck, AlertTriangle, 
  CheckCircle2, ShieldAlert, BarChart2,
  X, Clock, Navigation, LayoutDashboard, Database
} from 'lucide-react'

ChartJS.register(
  CategoryScale, LinearScale, ArcElement, Tooltip, Legend
)

export function DashboardView({ onClose }: { onClose: () => void }) {
  const stations = useDataStore((s) => s.stations)
  const points = useDataStore((s) => s.points)
  const trips = useDataStore((s) => s.trips)
  const exclusionZones = useDataStore((s) => s.exclusionZones)

  const theme = useUIStore((s) => s.theme)
  const isDark = theme === 'dark'

  // ──── Operation Metrics ────
  const metrics = useMemo(() => {
    const totalCapacity = stations.reduce((s, st) => s + st.dailyCapacity, 0)
    const usedCapacity = stations.reduce((s, st) => s + (st.usedCapacity || 0), 0)
    const totalDemand = points.reduce((s, p) => s + p.demand, 0)
    const totalTrucks = stations.reduce((s, st) => s + st.trucks, 0)
    
    const supplied = points.filter((p) => p.status === 'supplied').length
    const warning = points.filter((p) => p.status === 'warning').length
    const critical = points.filter((p) => p.status === 'critical').length
    const coverage = points.length > 0 ? (supplied / points.length) * 100 : 0
    
    const totalDistance = trips.reduce((s, t) => s + t.distance, 0) / 1000 // km
    const avgDistance = trips.length > 0 ? totalDistance / trips.length : 0

    const surplus = totalCapacity - totalDemand
    const systemHealth = coverage === 100 ? 'excellent' : coverage > 75 ? 'good' : 'critical'

    return { 
      totalCapacity, usedCapacity, totalDemand, surplus,
      totalTrucks, supplied, warning, critical, coverage, 
      totalDistance, avgDistance, zones: exclusionZones.length,
      systemHealth
    }
  }, [stations, points, trips, exclusionZones])



  const statusDoughnutData = useMemo(() => {
    return {
      labels: ['مستقر', 'تحذير', 'حرج'],
      datasets: [{
        data: [metrics.supplied, metrics.warning, metrics.critical],
        backgroundColor: ['rgba(16,185,129,0.85)', 'rgba(245,158,11,0.85)', 'rgba(239,68,68,0.85)'],
        borderColor: isDark ? '#0f172a' : '#ffffff',
        borderWidth: 2,
        hoverOffset: 6,
      }],
    }
  }, [metrics, isDark])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { 
        position: 'right' as const,
        labels: { color: isDark ? '#cbd5e1' : '#64748b', font: { family: 'inherit', size: 12 }, usePointStyle: true, boxWidth: 8 } 
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#64748b',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
        borderWidth: 1,
        rtl: true,
        textDirection: 'rtl' as const,
        padding: 12,
      },
    }
  }

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(Math.round(num))
  
  // Theme Variables and Styles
  const primaryColor = 'var(--primary)'
  const dangerColor = 'var(--danger)'
  const successColor = 'var(--success)'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'var(--bg-dark)', color: 'var(--text)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'inherit',
      animation: 'fadeIn 0.2s ease',
    }}>
      {/* ──── Header ──── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37,99,235,0.95) 0%, rgba(15,23,42,0.95) 100%)',
        backdropFilter: 'blur(10px)',
        color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 64, flexShrink: 0,
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LayoutDashboard size={22} className="opacity-90" />
          <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.5px' }}>لوحة التحكم والعمليات</span>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s', padding: 6, borderRadius: 10
        }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
          <X size={20} />
        </button>
      </div>

      {/* ──── Body ──── */}
      <div style={{ flex: 1, overflow: 'auto', padding: 32, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 32 }}>
          


          {/* TOP LEVEL METRICS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
             <MiniCard label="نسبة التغطية الكلية" value={`${metrics.coverage.toFixed(1)}%`} icon={<CheckCircle2 size={24}/>} color={successColor} valueColor={metrics.coverage === 0 ? 'var(--danger)' : metrics.coverage < 50 ? 'var(--warning)' : 'var(--success)'} />
             <MiniCard label="إجمالي الطلب" value={`${formatNumber(metrics.totalDemand)} L`} icon={<BarChart2 size={24}/>} color={primaryColor} />
             <MiniCard label="مسافة مقطوعة" value={`${formatNumber(metrics.totalDistance)} كم`} icon={<Navigation size={24}/>} color={primaryColor} />
             <MiniCard label="مناطق استبعاد/حرجة" value={`${metrics.zones} / ${metrics.critical}`} icon={<ShieldAlert size={24}/>} color={dangerColor} valueColor={metrics.critical > 0 ? 'var(--danger)' : undefined} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
            
            {/* DISTRIBUTION STATUS & LOGISTICS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-sm)', padding: 24 }}>
                 <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 24px 0', paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
                  <MapPin size={18} color="var(--primary)" /> حالة التوزيع اللوجستي للنقاط
                </h3>
                <div style={{ height: 200, position: 'relative' }}>
                  {points.length > 0 ? (
                    <Doughnut data={statusDoughnutData} options={chartOptions as any} />
                  ) : (
                    <EmptyState text="لا توجد بيانات توزيع متاحة" />
                  )}
                </div>
              </div>

               <div style={{ background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-sm)', padding: 24 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px 0' }}>
                  <Truck size={18} color="var(--primary)" /> تفاصيل الأسطول والحركة
                </h3>
                {metrics.totalTrucks === 0 && trips.length === 0 ? (
                  <EmptyState text="لم تُسجّل رحلات توزيع بعد" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <ListMetric label="إجمالي الشاحنات العاملة" value={metrics.totalTrucks} icon={<Truck size={16}/>} />
                    <ListMetric label="رحلات التوزيع والمسارات" value={trips.length} icon={<Clock size={16}/>} />
                    <ListMetric label="متوسط المسافة للرحلة المخططة" value={`${metrics.avgDistance.toFixed(2)} كم`} icon={<Navigation size={16}/>} />
                  </div>
                )}
              </div>

            </div>

             {/* STATIONS STATUS & ALERTS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
               <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ padding: '24px 24px 16px', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0, borderBottom: '1px solid var(--glass-border)' }}>
                  <Database size={18} color="var(--primary)" /> المؤشر التشغيلي للمحطات
                </h3>
                
                <div style={{ overflowY: 'auto', padding: 16 }}>
                  {stations.length === 0 ? (
                     <EmptyState text="لم يتم تسجيل محطات بعد" />
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-muted)' }}>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>المحطة</th>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>السعة / L</th>
                          <th style={{ padding: '8px 12px', fontWeight: 600, width: '40%' }}>مؤشر التحميل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...stations].sort((a, b) => {
                          const ratioA = a.dailyCapacity > 0 ? ((a.usedCapacity || 0) / a.dailyCapacity) : 0;
                          const ratioB = b.dailyCapacity > 0 ? ((b.usedCapacity || 0) / b.dailyCapacity) : 0;
                          return ratioB - ratioA;
                        }).map(st => {
                          const usageRatio = st.dailyCapacity > 0 ? ((st.usedCapacity || 0) / st.dailyCapacity) * 100 : 0;
                          const indicatorColor = usageRatio > 90 ? 'var(--danger)' : usageRatio > 70 ? 'var(--warning)' : 'var(--success)';
                          return (
                            <tr key={st.id}>
                              <td style={{ padding: '14px 12px', fontWeight: 700, borderBottom: '1px solid var(--glass-border)' }}>{st.name || `م. ${st.id.substring(0,4)}`}</td>
                              <td style={{ padding: '14px 12px', color: 'var(--text-muted)', fontFamily: 'monospace', borderBottom: '1px solid var(--glass-border)' }}>{formatNumber(st.dailyCapacity)}</td>
                              <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ flex: 1, height: 6, background: 'var(--bg-dark)', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(usageRatio, 100)}%`, height: '100%', background: indicatorColor, borderRadius: 4 }} />
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 28, fontWeight: 600, fontFamily: 'monospace' }}>{usageRatio.toFixed(0)}%</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Quick Alerts */}
              {metrics.critical > 0 && (
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', 
                  borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 
                }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 12 }}>
                    <AlertTriangle size={24} color={dangerColor} />
                  </div>
                  <div>
                    <h4 style={{ color: dangerColor, fontSize: '1.05rem', fontWeight: 700, margin: '0 0 8px 0' }}>تنبيه تشغيلي عالي الأهمية</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                      تم رصد <strong style={{ color: 'var(--text)' }}>{metrics.critical} مهام توزيع</strong> تعاني من حالة عجز وحرج شديد. يجب التدخل الفوري وتوجيه أسطول الطوارئ أو إعادة جدولة المسارات وتغليف النقص في أسرع وقت.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>



        </div>
      </div>
    </div>
  )
}

// ─── Shared UI Components ───

function MiniCard({ label, value, icon, color, valueColor }: any) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
      padding: '24px 20px', borderRadius: 16, boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'center', gap: 16
    }}>
      <div style={{ 
        width: 48, height: 48, borderRadius: 12, background: 'var(--bg-elevated)', 
        color: color || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--glass-border)'
      }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: valueColor || 'var(--text)', fontFamily: 'system-ui' }}>{value}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      </div>
    </div>
  )
}

function ListMetric({ label, value, icon }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)' }}>
        <div style={{ color: 'var(--primary)' }}>{icon}</div>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
      </div>
      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>{value}</span>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
      <Activity size={32} style={{ opacity: 0.2 }} />
      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{text}</span>
    </div>
  )
}
