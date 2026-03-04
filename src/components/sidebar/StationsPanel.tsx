/**
 * WaterSync — Stations Panel (Supply Tab) — عرض فقط
 * العرض والمراقبة + إدارة المؤسسات/الجهات الإغاثية كتعاقدات
 * أزرار التحرير والحذف تُحال للمحرر (LayerEditorPanel)
 */
import { useState } from "react";
import { useDataStore } from "@/stores/useDataStore";
import { useMapStore } from "@/stores/useMapStore";
import { useUIStore } from "@/stores/useUIStore";
import { getInstitutionColor } from "@/lib/utils";
import { Plus, Factory, Truck, Trash2, ChevronDown, ChevronRight, Navigation, Edit2, Droplet, Users } from 'lucide-react';

function StatBox({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      flex: 1, padding: '8px 4px',
      background: 'var(--bg-dark, #f8fafc)', 
      borderRight: '1px solid var(--border, #e2e8f0)',
    }}>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted, #64748b)', marginTop: 4, fontWeight: 600, textAlign: 'center' }}>{label}</div>
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
      marginTop: -1, 
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

export function StationsPanel({ onOpenEditor }: { onOpenEditor?: (tab?: 'stations' | 'points') => void } = {}) {
  const stations = useDataStore((s) => s.stations);
  const addInstitution = useDataStore((s) => s.addInstitution);
  const removeInstitution = useDataStore((s) => s.removeInstitution);
  const map = useMapStore((s) => s.map);
  const addNotification = useUIStore((s) => s.addNotification);

  const [expandedStation, setExpandedStation] = useState<string | null>(null);
  const [instName, setInstName] = useState("");
  const [instTrucks, setInstTrucks] = useState<number | ''>("");

  const handleAddInstitution = (stationId: string) => {
    if (!instName.trim())
      return addNotification("يرجى إدخال اسم المؤسسة", "warning");
    if (!instTrucks || instTrucks <= 0)
      return addNotification("يرجى تحديد عدد شاحنات صالح", "warning");

    const station = stations.find((s) => s.id === stationId);
    if (!station) return;
    const color = getInstitutionColor(station.institutions.length);
    
    addInstitution({
      id: `inst_${Date.now()}`,
      name: instName.trim(),
      trucks: Number(instTrucks),
      color,
      stationId,
    });
    setInstName("");
    setInstTrucks("");
    addNotification(`تمت إضافة "${instName.trim()}"`, "success");
  };

  const flyTo = (lat: number, lng: number) =>
    map?.flyTo([lat, lng], 15, { duration: 0.8 });

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
        <StatBox value={stations.length} label="المحطات" color="var(--primary, #2563eb)" />
        <StatBox value={stations.reduce((s, st) => s + st.trucks, 0)} label="الشاحنات" color="var(--accent, #8b5cf6)" />
        <StatBox value={stations.reduce((s, st) => s + st.institutions.length, 0)} label="المؤسسات" color="var(--success, #10b981)" />
        <div style={{ flex: 1 }}>
          <StatBox value={stations.reduce((s, st) => s + (st.dailyCapacity/1000), 0).toFixed(0) + 'K'} label="السعة (لتر)" color="var(--info, #0ea5e9)" />
        </div>
      </div>

      <SectionHeader 
        title="محطات التعبئة (العرض)" 
        icon={Factory} 
        action={
           <button 
            onClick={() => onOpenEditor?.('stations')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'var(--primary, #2563eb)', color: '#fff',
              border: 'none', borderRadius: 4, padding: '4px 8px',
              fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            title="فتح محرر الطبقة"
          >
            <Edit2 size={12} /> محرر الطبقة
          </button>
        }
      />

      {/* List Container */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-elevated, #fff)' }}>
        {stations.length === 0 ? (
          <div style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px 16px', color: 'var(--text-muted, #94a3b8)' 
          }}>
            <Factory size={36} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.5 }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main, #475569)' }}>لا توجد محطات بعد</span>
            <span style={{ fontSize: '0.75rem', marginTop: 4, textAlign: 'center' }}>الرجاء إضافة محطات باستخدام أداة الإضافة على الخريطة</span>
          </div>
        ) : (
          stations.map((station) => {
            const isExpanded = expandedStation === station.id;
            const fillPct = station.dailyCapacity > 0 ? Math.round(((station.usedCapacity ?? 0) / station.dailyCapacity) * 100) : 0;

            return (
              <div key={station.id} style={{
                borderBottom: '1px solid var(--border, rgba(0,0,0,0.05))',
              }}>
                {/* Row Header */}
                <div
                  onClick={() => setExpandedStation(isExpanded ? null : station.id)}
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
                  
                  {/* Status Indicator (Fill circle) */}
                  <div style={{ 
                    width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                    background: `conic-gradient(var(--primary, #2563eb) ${fillPct}%, var(--border, #e2e8f0) 0)` 
                  }} title={`تم استهلاك ${fillPct}% من السعة`} />
                  
                  {/* Info Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ 
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', 
                        fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main, #1e293b)' 
                      }}>
                        {station.name}
                      </span>
                    </div>
                    {/* Compact Subtitle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
                       <span style={{ display: 'flex', alignItems: 'center', gap: 2 }} title="السعة الإجمالية"><Droplet size={10} color="var(--info, #0ea5e9)"/> {station.dailyCapacity.toLocaleString()}</span>
                       <span>•</span>
                       <span style={{ display: 'flex', alignItems: 'center', gap: 2 }} title="الشاحنات والمؤسسات"><Truck size={10}/> {station.trucks} ش ({station.institutions.length} م)</span>
                       <span>•</span>
                       <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{station.governorate || 'غير محدد'}</span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button onClick={(e) => { e.stopPropagation(); flyTo(station.lat, station.lng); }} 
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
                      <div style={{ color: 'var(--text-muted, #64748b)' }}>السعة الإجمالية</div>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                         {(station.dailyCapacity ?? 0).toLocaleString()} لتر
                         <div style={{ flex: 1, height: 4, background: 'var(--border, #e2e8f0)', borderRadius: 2, marginLeft: 8, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${fillPct}%`, background: 'var(--primary, #2563eb)' }}></div>
                         </div>
                      </div>
                      
                      <div style={{ color: 'var(--text-muted, #64748b)' }}>المستخدم</div>
                      <div style={{ fontWeight: 500, color: 'var(--primary, #2563eb)' }}>{(station.usedCapacity ?? 0).toLocaleString()} لتر ({fillPct}%)</div>

                      <div style={{ color: 'var(--text-muted, #64748b)' }}>المحافظة</div>
                      <div style={{ fontWeight: 500 }}>{station.governorate?.replace('_', ' ') || '-'}</div>
                    </div>

                    {/* فتح المحرر للتعديل — لا يوجد تعديل/حذف مباشر هنا */}
                    <button
                      onClick={() => onOpenEditor?.('stations')}
                      style={{ 
                         padding: '5px 14px', background: 'var(--bg-elevated, #fff)', border: '1px solid var(--primary, #2563eb)', 
                         borderRadius: 6, fontSize: '0.7rem', cursor: 'pointer', color: 'var(--primary, #2563eb)', 
                         fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16,
                         transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary, #2563eb)'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated, #fff)'; e.currentTarget.style.color = 'var(--primary, #2563eb)' }}
                    >
                      <Edit2 size={12} /> تعديل في المحرر
                    </button>

                    {/* Institutions Dense List */}
                    <div style={{ 
                        fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-soft, #64748b)', 
                        borderBottom: '1px solid var(--border, #e2e8f0)', paddingBottom: 4, marginBottom: 8,
                        display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <Users size={12} /> المؤسسات الداعمة ({station.institutions.length})
                    </div>

                    {station.institutions.map(inst => (
                      <div key={inst.id} style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '4px 8px', background: 'var(--bg-elevated, #fff)', 
                        border: '1px solid var(--border, #e2e8f0)', borderRadius: 4, marginBottom: 4
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: inst.color }} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main, #334155)' }}>{inst.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                           <span style={{ fontSize: '0.65rem', color: 'var(--text-muted, #64748b)' }}>{inst.trucks} شاحنة</span>
                           <button onClick={() => removeInstitution(inst.id)} style={{
                             background: 'transparent', border: 'none', color: 'var(--danger, #ef4444)', cursor: 'pointer', padding: 2
                           }} title="حذف المؤسسة">
                             <Trash2 size={12} />
                           </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Institution Form Inline */}
                    <div style={{ 
                       display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 
                    }}>
                       <input 
                         value={instName}
                         onChange={e => setInstName(e.target.value)}
                         placeholder="اسم المؤسسة..."
                         onKeyDown={(e) => e.key === "Enter" && handleAddInstitution(station.id)}
                         style={{
                           flex: 1, padding: '4px 8px', fontSize: '0.7rem',
                           border: '1px solid var(--border, #cbd5e1)', borderRadius: 4,
                           background: 'var(--bg-elevated, #fff)', color: 'var(--text-main, #1e293b)'
                         }}
                       />
                       <input 
                         type="number" 
                         min="1"
                         value={instTrucks}
                         onChange={e => setInstTrucks(e.target.value === '' ? '' : +e.target.value)}
                         placeholder="شاحنات"
                         onKeyDown={(e) => e.key === "Enter" && handleAddInstitution(station.id)}
                         style={{
                           width: 50, padding: '4px 8px', fontSize: '0.7rem', textAlign: 'center',
                           border: '1px solid var(--border, #cbd5e1)', borderRadius: 4,
                           background: 'var(--bg-elevated, #fff)', color: 'var(--text-main, #1e293b)'
                         }}
                       />
                       <button onClick={() => handleAddInstitution(station.id)} style={{
                         padding: '4px 10px', background: 'var(--primary, #2563eb)', color: '#fff',
                         border: 'none', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600,
                         cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                       }}>
                         <Plus size={12} />
                       </button>
                    </div>

                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

    </div>
  );
}
