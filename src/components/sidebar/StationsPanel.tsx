/**
 * WaterSync — Stations Panel (Supply Tab) — عرض فقط
 * العرض والمراقبة + إدارة المؤسسات/الجهات الإغاثية كتعاقدات
 * أزرار التحرير والحذف تُحال للمحرر (LayerEditorPanel)
 */
import { useState } from "react";
import { useDataStore } from "@/stores/useDataStore";
import { useMapStore } from "@/stores/useMapStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { ChevronDown, ChevronRight, Navigation, Droplet, Users, Factory, Truck, FileSignature, X, Check, Building2 } from 'lucide-react';

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

export function StationsPanel() {
  const allStations = useDataStore((s) => s.stations);
  const institutions = useDataStore((s) => s.institutions);
  const addInstitution = useDataStore((s) => s.addInstitution);
  const registeredNGOs = useAuthStore((s) => s.registeredNGOs);
  const role = useAuthStore((s) => s.role);
  const institutionId = useAuthStore((s) => s.institutionId);
  const isAdmin = role === 'admin';
  const isNGO = role === 'ngo';
  const map = useMapStore((s) => s.map);

  // NGO view: only show stations where this NGO has contracts
  const stations = isNGO && institutionId
    ? allStations.filter(st => st.institutions.some(inst => inst.id === institutionId))
    : allStations;

  // For NGO view: filter institutions within each station to only show own
  const getVisibleInstitutions = (stationInstitutions: any[]) => {
    if (isNGO && institutionId) {
      return stationInstitutions.filter((inst: any) => inst.id === institutionId);
    }
    return stationInstitutions;
  };

  const [expandedStation, setExpandedStation] = useState<string | null>(null);
  const [contractingNGO, setContractingNGO] = useState<{ id: string; name: string; color: string } | null>(null);
  const [contractStations, setContractStations] = useState<string[]>([]);
  const [contractTrucks, setContractTrucks] = useState<Record<string, number>>({});

  const handleAdminContract = () => {
    if (!contractingNGO || contractStations.length === 0) return;
    contractStations.forEach(stId => {
      const trucksCount = contractTrucks[stId] || 1;
      addInstitution({
        id: contractingNGO.id,
        name: contractingNGO.name,
        stationIds: [stId],
        trucks: trucksCount,
        color: contractingNGO.color,
      });
    });
    setContractingNGO(null);
    setContractStations([]);
    setContractTrucks({});
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
        <StatBox value={stations.reduce((s, st) => s + (isNGO && institutionId ? getVisibleInstitutions(st.institutions).reduce((sum: number, i: any) => sum + i.trucks, 0) : st.trucks), 0)} label="الشاحنات" color="var(--accent, #8b5cf6)" />
        <StatBox value={isNGO ? stations.length : stations.reduce((s, st) => s + st.institutions.length, 0)} label={isNGO ? 'محطاتي' : 'المؤسسات'} color="var(--success, #10b981)" />
        <div style={{ flex: 1 }}>
          <StatBox value={stations.reduce((s, st) => s + (st.dailyCapacity/1000), 0).toFixed(0) + 'K'} label="السعة (لتر)" color="var(--info, #0ea5e9)" />
        </div>
      </div>

      <SectionHeader 
        title="محطات التعبئة (العرض)" 
        icon={Factory}
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
                       <span style={{ display: 'flex', alignItems: 'center', gap: 2 }} title="الشاحنات">
                         <Truck size={10}/> {isNGO && institutionId ? getVisibleInstitutions(station.institutions).reduce((s: number, i: any) => s + i.trucks, 0) : station.trucks} ش
                         {!isNGO && <> ({station.institutions.length} م)</>}
                       </span>
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

                    {/* Institutions Dense List */}
                    <div style={{ 
                        fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-soft, #64748b)', 
                        borderBottom: '1px solid var(--border, #e2e8f0)', paddingBottom: 4, marginBottom: 8,
                        display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <Users size={12} /> {isNGO ? 'تعاقداتي' : `المؤسسات الداعمة (${station.institutions.length})`}
                    </div>

                    {getVisibleInstitutions(station.institutions).map((inst: any) => (
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
                        </div>
                      </div>
                    ))}

                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ═══ Registered NGOs Section (Admin only) ═══ */}
      {isAdmin && registeredNGOs.length > 0 && (
        <>
          <SectionHeader
            title={`المؤسسات المسجلة (${registeredNGOs.length})`}
            icon={Users}
          />
          <div style={{ padding: 8, background: 'var(--bg-elevated, #fff)', borderTop: '1px solid var(--border, #e2e8f0)' }}>
            {registeredNGOs.map(ngo => {
              const isContracted = institutions.some(inst => inst.id === ngo.id);
              const inst = institutions.find(i => i.id === ngo.id);
              return (
                <div key={ngo.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 10px', background: 'var(--bg-dark, #f8fafc)',
                  border: '1px solid var(--border, #e2e8f0)', borderRadius: 6, marginBottom: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: ngo.color }} />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main, #334155)' }}>
                        {ngo.nameAr || ngo.name}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted, #64748b)' }}>
                        {isContracted
                          ? `✅ متعاقدة — ${inst?.trucks || 0} شاحنة`
                          : '⏳ لم يتم التعاقد بعد'
                        }
                      </div>
                    </div>
                  </div>
                  {!isContracted && (
                    <button
                      onClick={() => {
                        setContractingNGO({ id: ngo.id, name: ngo.nameAr || ngo.name, color: ngo.color });
                        setContractStations([]);
                        setContractTrucks({});
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', borderRadius: 6,
                        background: 'var(--bg-elevated, #fff)', border: '1px solid var(--border, #cbd5e1)',
                        color: 'var(--primary, #2563eb)', fontSize: '0.7rem', fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      <FileSignature size={12} /> إبرام تعاقد
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══ Admin Contracting Modal ═══ */}
      {contractingNGO && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          direction: 'rtl',
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 20, width: 500,
            maxHeight: '80vh', overflow: 'hidden',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 28px', borderBottom: '1px solid var(--border, #e2e8f0)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: `linear-gradient(135deg, ${contractingNGO.color}15, transparent)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileSignature size={20} color={contractingNGO.color} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>تعاقد: {contractingNGO.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>تخصيص المحطات والشاحنات</div>
                </div>
              </div>
              <button
                onClick={() => setContractingNGO(null)}
                style={{
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', cursor: 'pointer', padding: 6, borderRadius: 8,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 28px', flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                اختر المحطات التي ستتعاقد معها هذه المؤسسة:
              </div>

              {stations.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                  لا توجد محطات متاحة
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stations.map(st => {
                    const isSelected = contractStations.includes(st.id);
                    return (
                      <div key={st.id}>
                        <button
                          onClick={() => {
                            setContractStations(prev =>
                              prev.includes(st.id) ? prev.filter(id => id !== st.id) : [...prev, st.id]
                            );
                            if (!contractTrucks[st.id]) {
                              setContractTrucks(prev => ({ ...prev, [st.id]: 1 }));
                            }
                          }}
                          style={{
                            width: '100%', textAlign: 'right',
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                            background: isSelected ? `${contractingNGO.color}12` : 'var(--bg-dark)',
                            border: isSelected ? `2px solid ${contractingNGO.color}` : '2px solid var(--glass-border)',
                            color: 'var(--text)', fontFamily: 'inherit',
                            transition: 'all 0.2s',
                          }}
                        >
                          <Building2 size={18} color={isSelected ? contractingNGO.color : 'var(--text-muted)'} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{st.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                              {st.governorate} — السعة: {st.remainingCapacity.toLocaleString()} لتر
                            </div>
                          </div>
                          <div style={{
                            width: 22, height: 22, borderRadius: 6,
                            border: `2px solid ${isSelected ? contractingNGO.color : 'var(--text-muted)'}`,
                            background: isSelected ? contractingNGO.color : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                          </div>
                        </button>
                        {isSelected && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 14px', marginTop: 4,
                            background: 'var(--bg-elevated)', borderRadius: 8,
                            border: '1px solid var(--glass-border)',
                          }}>
                            <Truck size={14} color={contractingNGO.color} />
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>عدد الشاحنات:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                onClick={() => setContractTrucks(p => ({ ...p, [st.id]: Math.max(1, (p[st.id] || 1) - 1) }))}
                                style={{
                                  width: 28, height: 28, borderRadius: 6, fontSize: '1rem', fontWeight: 800,
                                  background: 'var(--bg-dark)', border: 'none', color: 'var(--text)', cursor: 'pointer',
                                }}
                              >−</button>
                              <span style={{ fontSize: '1rem', fontWeight: 900, width: 24, textAlign: 'center' }}>
                                {contractTrucks[st.id] || 1}
                              </span>
                              <button
                                onClick={() => setContractTrucks(p => ({ ...p, [st.id]: (p[st.id] || 1) + 1 }))}
                                style={{
                                  width: 28, height: 28, borderRadius: 6, fontSize: '1rem', fontWeight: 800,
                                  background: 'var(--bg-dark)', border: 'none', color: 'var(--text)', cursor: 'pointer',
                                }}
                              >+</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 28px', borderTop: '1px solid var(--border, #e2e8f0)',
              display: 'flex', gap: 12,
            }}>
              <button
                onClick={() => setContractingNGO(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: 'var(--bg-dark)', border: '1px solid var(--glass-border)',
                  color: 'var(--text)', fontWeight: 600, fontSize: '0.85rem',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleAdminContract}
                disabled={contractStations.length === 0}
                style={{
                  flex: 2, padding: '12px', borderRadius: 10,
                  background: contractStations.length > 0 ? contractingNGO.color : 'var(--bg-dark)',
                  border: 'none', color: '#fff',
                  fontWeight: 800, fontSize: '0.9rem',
                  cursor: contractStations.length > 0 ? 'pointer' : 'not-allowed',
                  opacity: contractStations.length > 0 ? 1 : 0.4,
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Check size={18} strokeWidth={3} /> تأكيد التعاقد
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
