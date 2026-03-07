/**
 * WaterSync — Points Panel (Demand Tab) — عرض فقط
 * العرض والمراقبة + البحث والفلترة
 * أزرار التحرير والحذف تُحال للمحرر (LayerEditorPanel)
 */
import React, { useState } from 'react'
import { useDataStore } from '@/stores/useDataStore'
import { useMapStore } from '@/stores/useMapStore'
import { getStatusColor } from '@/lib/utils'
import { TYPE_LABELS } from '@/lib/constants/colors'
import { ChevronDown, ChevronRight, MapPin, Navigation, Search, Filter, Droplet } from 'lucide-react'

// Simple functional stat component
function PtsStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      flex: 1, padding: '8px 4px',
      background: 'var(--bg-dark, #f8fafc)', 
      borderRight: '1px solid var(--border, #e2e8f0)',
    }}>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted, #64748b)', marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function SectionHeader({ title, icon: Icon, action }: { title: string, icon: any, action?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px',
      background: 'var(--bg-dark, #f8fafc)',
      borderBottom: '1px solid var(--border, #e2e8f0)',
      borderTop: '1px solid var(--border, #e2e8f0)',
      marginTop: -1, // Collapse borders
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={16} style={{ color: 'var(--primary-soft, #64748b)' }} strokeWidth={2} />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main, #334155)' }}>
          {title}
        </span>
      </div>
      {action && action}
    </div>
  )
}

export function PointsPanel() {
  const points = useDataStore((s) => s.points)
  const map = useMapStore((s) => s.map)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'critical'>('all')

  const flyTo = (lat: number, lng: number) => map?.flyTo([lat, lng], 16, { duration: 0.8 })

  const supplied = points.filter((p) => p.status === 'supplied').length
  const warning = points.filter((p) => p.status === 'warning').length
  const critical = points.filter((p) => p.status === 'critical').length
  const total = points.length

  const filteredPoints = points.filter((p) => {
    if (filter === 'critical' && p.status !== 'critical') return false
    if (searchQuery && !p.name.includes(searchQuery)) return false
    return true
  })

  // Status mapping for arabic
  const getStatusArabic = (status: string) => {
    if (status === 'supplied') return 'مزوّد'
    if (status === 'warning') return 'تحذير'
    return 'حرج'
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-elevated, #ffffff)',
      border: '1px solid var(--border, #e2e8f0)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      
      {/* 4-Stat Row */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
        <PtsStat value={total} label="إجمالي" color="var(--text-main, #334155)" />
        <PtsStat value={supplied} label="مزوّد" color="var(--success, #10b981)" />
        <PtsStat value={warning} label="تحذير" color="var(--warning, #f59e0b)" />
        <div style={{ flex: 1 }}> {/* To remove right border on last item */}
          <PtsStat value={critical} label="حرج" color="var(--danger, #ef4444)" />
        </div>
      </div>

      <SectionHeader 
        title="نقاط التوزيع (الطلب)" 
        icon={MapPin}
      />

      {/* Search and Filters Strip */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: 8, 
        padding: '8px 12px', background: 'var(--bg-elevated, #fff)',
        borderBottom: '1px solid var(--border, #e2e8f0)'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', right: 8, top: 6, color: 'var(--text-muted, #94a3b8)' }} />
          <input
            type="text"
            placeholder="بحث عن نقطة..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '4px 8px 4px 28px',
              border: '1px solid var(--border, #cbd5e1)', borderRadius: 4,
              fontSize: '0.75rem', outline: 'none', background: 'var(--bg-dark, #f8fafc)',
              color: 'var(--text-main, #1e293b)'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border, #cbd5e1)', borderRadius: 4, overflow: 'hidden' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '4px 10px', fontSize: '0.7rem', border: 'none',
              background: filter === 'all' ? 'var(--bg-dark, #e2e8f0)' : 'transparent',
              color: filter === 'all' ? 'var(--text-main, #1e293b)' : 'var(--text-muted, #64748b)', 
              cursor: 'pointer', fontWeight: filter === 'all' ? 600 : 500
            }}
          >
            الكل
          </button>
          <button
            onClick={() => setFilter('critical')}
            style={{
              padding: '4px 10px', fontSize: '0.7rem', border: 'none', borderRight: '1px solid var(--border, #cbd5e1)',
              background: filter === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
              color: filter === 'critical' ? 'var(--danger, #ef4444)' : 'var(--text-muted, #64748b)', 
              cursor: 'pointer', fontWeight: filter === 'critical' ? 600 : 500,
              display: 'flex', alignItems: 'center', gap: 4
            }}
          >
             حرج {filter === 'critical' && <Filter size={10} />}
          </button>
        </div>
      </div>

      {/* List Container */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {points.length === 0 ? (
           <div style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px 16px', color: 'var(--text-muted, #94a3b8)' 
          }}>
            <MapPin size={36} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.5 }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main, #475569)' }}>لا توجد نقاط توزيع</span>
            <span style={{ fontSize: '0.75rem', marginTop: 4, textAlign: 'center' }}>الرجاء إضافة نقاط باستخدام أداة الإضافة على الخريطة</span>
          </div>
        ) : filteredPoints.length === 0 ? (
           <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '0.8rem' }}>
             لا توجد نتائج مطابقة للبحث
           </div>
        ) : (
          filteredPoints.map((point) => {
            const sc = getStatusColor(point.status)
            const isExpanded = expandedId === point.id

            return (
              <div key={point.id} style={{
                borderBottom: '1px solid var(--border, rgba(0,0,0,0.05))',
              }}>
                {/* Row Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : point.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', cursor: 'pointer',
                    backgroundColor: isExpanded ? 'var(--bg-dark, #f1f5f9)' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => { 
                    if(!isExpanded) e.currentTarget.style.backgroundColor = 'var(--bg-dark, rgba(0,0,0,0.02))' 
                  }}
                  onMouseLeave={(e) => { 
                    if(!isExpanded) e.currentTarget.style.backgroundColor = 'transparent' 
                  }}
                >
                  <div style={{ color: 'var(--text-muted, #64748b)', width: 14 }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                  
                  {/* Status Indicator */}
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc, flexShrink: 0 }} title={getStatusArabic(point.status)} />
                  
                  {/* Info Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ 
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', 
                        fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main, #1e293b)' 
                      }}>
                        {point.name}
                      </span>
                      <span style={{ 
                         fontSize: '0.65rem', color: 'var(--text-muted, #64748b)', background: 'var(--bg-dark, #e2e8f0)', 
                         padding: '1px 4px', borderRadius: 3, flexShrink: 0 
                      }}>
                        {TYPE_LABELS[point.type] || point.type}
                      </span>
                    </div>
                    {/* Compact Subtitle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
                       <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Droplet size={10} color="var(--info, #0ea5e9)"/> {point.demand.toLocaleString()} لتر</span>
                       <span>•</span>
                       <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{point.neighborhood?.replace('_', ' ') || 'غير محدد'}</span>
                    </div>
                  </div>

                  {/* Quick Actions (Always visible) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button onClick={(e) => { e.stopPropagation(); flyTo(point.lat, point.lng); }} 
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px',
                        color: 'var(--text-muted, #94a3b8)'
                      }} title="الذهاب على الخريطة">
                        <Navigation size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div style={{
                    padding: '8px 12px 12px 32px', 
                    background: 'var(--bg-dark, #f8fafc)',
                    borderTop: '1px solid var(--border, rgba(0,0,0,0.03))'
                  }}>
                    {/* Properties Grid */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px 8px',
                      fontSize: '0.75rem', marginBottom: 12, color: 'var(--text-main, #334155)'
                    }}>
                      <div style={{ color: 'var(--text-muted, #64748b)' }}>الكمية المطلوبة</div>
                      <div style={{ fontWeight: 600 }}>{point.demand.toLocaleString()} لتر</div>
                      
                      <div style={{ color: 'var(--text-muted, #64748b)' }}>المستفيدون</div>
                      <div style={{ fontWeight: 500 }}>-</div>
                      
                      <div style={{ color: 'var(--text-muted, #64748b)' }}>المنطقة / الحي</div>
                      <div style={{ fontWeight: 500 }}>{point.neighborhood?.replace('_', ' ') || '-'}</div>

                      <div style={{ color: 'var(--text-muted, #64748b)' }}>المحافظة</div>
                      <div style={{ fontWeight: 500 }}>{point.governorate?.replace('_', ' ') || '-'}</div>
                      
                      <div style={{ color: 'var(--text-muted, #64748b)' }}>حالة الطلب</div>
                      <div style={{ fontWeight: 600, color: sc }}>{getStatusArabic(point.status)}</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
