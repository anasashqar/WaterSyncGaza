import { useState } from 'react'
import { useDataStore } from '@/stores/useDataStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { Droplets, Truck, MapPin, ChevronLeft, ChevronRight, Check, Building2, ClipboardList, LogOut, SkipForward } from 'lucide-react'

interface Props {
  onComplete: () => void
}

export function NGOSetupWizard({ onComplete }: Props) {
  const stations = useDataStore((s) => s.stations)
  const addInstitution = useDataStore((s) => s.addInstitution)
  const addNotification = useUIStore((s) => s.addNotification)
  const currentNGO = useAuthStore((s) => s.getCurrentNGO())
  const institutionId = useAuthStore((s) => s.institutionId)
  const logout = useAuthStore((s) => s.logout)

  const [step, setStep] = useState(1)
  const [selectedStations, setSelectedStations] = useState<string[]>([])
  const [trucksPerStation, setTrucksPerStation] = useState<Record<string, number>>({})

  const handleComplete = () => {
    if (selectedStations.length === 0 || !institutionId || !currentNGO) return

    let totalTrucks = 0
    selectedStations.forEach(stId => {
      const trucksCount = trucksPerStation[stId] || 1
      totalTrucks += trucksCount

      // Register the institution at EACH chosen station with its specific truck count
      addInstitution({
        id: institutionId,
        name: currentNGO.nameAr,
        stationIds: [stId],
        trucks: trucksCount,
        color: currentNGO.color,
      })
    })

    addNotification(
      `✅ تم إبرام التعاقد لـ "${currentNGO.nameAr}" مع ${selectedStations.length} ${selectedStations.length > 1 ? 'محطات' : 'محطة'} بإجمالي ${totalTrucks} شاحنة`,
      'success'
    )
    onComplete()
  }

  const ngoColor = currentNGO?.color || '#3B82F6'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      direction: 'rtl',
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 24, width: 600,
        maxHeight: '90vh', overflow: 'hidden',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 30px 100px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Header (Formal) */}
        <div style={{
          background: `linear-gradient(135deg, ${ngoColor}22, ${ngoColor}05)`,
          padding: '24px 36px 24px',
          borderBottom: `1px solid ${ngoColor}30`,
        }}>
          {/* Top row: Skip + Logout */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button
              onClick={() => onComplete()}
              style={{
                background: 'transparent', border: '1px solid var(--glass-border)',
                color: 'var(--text-muted)', padding: '6px 14px', borderRadius: 8,
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-dark)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <SkipForward size={14} /> تخطي الإعداد
            </button>
            <button
              onClick={() => logout()}
              style={{
                background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', padding: '6px 14px', borderRadius: 8,
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={14} /> تسجيل خروج
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: `${ngoColor}20`, border: `2px solid ${ngoColor}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', boxShadow: `0 8px 24px ${ngoColor}30`
            }}>
              {currentNGO?.logo || '🏢'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                نموذج تعاقد: {currentNGO?.nameAr || 'المؤسسة'}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                إجراءات اعتماد نقاط التعبئة وتخصيص أسطول النقل المائي
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{
                flex: 1, height: 5, borderRadius: 5,
                background: s <= step ? ngoColor : 'var(--bg-dark)',
                boxShadow: s === step ? `0 0 10px ${ngoColor}80` : 'none',
                transition: 'all 0.4s ease',
              }} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 36px', flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {/* STEP 1: Choose Station */}
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
                <MapPin size={22} color={ngoColor} /> 1. اعتماد محطات التعبئة
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
                الرجاء تحديد المحطات التي سيتم التعاقد معها لتزويد النقاط التابعة لكم. يمكنك اختيار أكثر من محطة. (يُمنع حجز نقاط في غير نطاق هذه المحطات).
              </p>

              {stations.length === 0 ? (
                <div style={{
                  padding: 32, textAlign: 'center', color: 'var(--warning)',
                  background: 'var(--warning-soft)', borderRadius: 12, border: '1px solid var(--warning)'
                }}>
                  ⚠️ لا تتوفر استطاعة حالية في أي محطة — يُرجى مراجعة إدارة النظام.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {stations.map((st) => {
                    const isSelected = selectedStations.includes(st.id)
                    const toggleStation = () => {
                      setSelectedStations(prev => {
                        const next = prev.includes(st.id) ? prev.filter(id => id !== st.id) : [...prev, st.id]
                        if (!prev.includes(st.id)) {
                           // Initialize with 1 truck when selected
                           setTrucksPerStation(curr => ({ ...curr, [st.id]: curr[st.id] || 1 }))
                        }
                        return next
                      })
                    }
                    return (
                      <button
                        key={st.id}
                        onClick={toggleStation}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 16,
                          padding: '16px 20px', borderRadius: 16, cursor: 'pointer',
                          background: isSelected ? `${ngoColor}15` : 'var(--bg-dark)',
                          border: isSelected ? `2px solid ${ngoColor}` : '2px solid var(--glass-border)',
                          color: 'var(--text)', fontFamily: 'inherit', textAlign: 'right',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? `0 4px 15px ${ngoColor}20` : 'none',
                        }}
                      >
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: isSelected ? `${ngoColor}25` : 'var(--bg-card)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, border: `1px solid ${isSelected ? ngoColor : 'var(--glass-border)'}`
                        }}>
                          <Building2 size={22} color={isSelected ? ngoColor : 'var(--text-muted)'} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{st.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, display:'flex', gap: 12 }}>
                             <span>السعة المتاحة: {(st.remainingCapacity).toLocaleString()} لتر</span>
                             <span>المحافظة: {st.governorate}</span>
                          </div>
                        </div>
                        <div style={{
                          width: 26, height: 26, borderRadius: 6,
                          border: `2px solid ${isSelected ? ngoColor : 'var(--text-muted)'}`,
                          background: isSelected ? ngoColor : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, transition: 'all 0.2s'
                        }}>
                          {isSelected && <Check size={16} color="#fff" strokeWidth={3} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Choose Trucks */}
          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
                <Truck size={22} color={ngoColor} /> 2. تخصيص الأسطول
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 24px' }}>
                يرجى تحديد عدد شاحنات النقل (السيارات) المخصصة لكل محطة تم اعتمادها:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {selectedStations.map(stId => {
                  const st = stations.find(s => s.id === stId)!
                  const count = trucksPerStation[stId] || 1
                  return (
                    <div key={stId} style={{
                      background: 'var(--bg-dark)', border: '1px solid var(--glass-border)',
                      borderRadius: 16, padding: '16px 20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20
                    }}>
                       <div style={{ flex: 1 }}>
                         <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{st.name}</div>
                         <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, display:'flex', alignItems:'center', gap:4 }}>
                           <Droplets size={14} color={ngoColor} />
                           سعة الحصة اليومية: <strong style={{ color: ngoColor }}>{(count * 5000).toLocaleString()}</strong> لتر
                         </div>
                       </div>

                       <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-elevated)', padding: '6px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                          <button
                            onClick={() => setTrucksPerStation(p => ({ ...p, [stId]: Math.max(1, count - 1) }))}
                            style={{
                              width: 36, height: 36, borderRadius: 8, fontSize: '1.2rem', fontWeight: 800,
                              background: 'var(--bg-card)', border: 'none', color: 'var(--text)', cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >−</button>
                          
                          <div style={{
                            fontSize: '1.2rem', fontWeight: 900, color: 'var(--text)',
                            width: 30, textAlign: 'center', fontFamily: 'monospace'
                          }}>{count}</div>

                          <button
                            onClick={() => setTrucksPerStation(p => ({ ...p, [stId]: count + 1 }))}
                            style={{
                              width: 36, height: 36, borderRadius: 8, fontSize: '1.2rem', fontWeight: 800,
                              background: 'var(--bg-card)', border: 'none', color: 'var(--text)', cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >+</button>
                       </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Confirm */}
          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
                <ClipboardList size={22} color={ngoColor} /> 3. مراجعة وتأكيد التعاقد
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 24px' }}>
                هذا نموذج تعاقد رسمي لتخصيص محطات التعبئة وحركة الشاحنات التابعة لمؤسستكم.
              </p>

              <div style={{
                background: 'var(--bg-elevated)', borderRadius: 16, padding: '24px',
                border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>الجهة المتعاقدة</span>
                  <strong style={{ color: 'var(--text)', fontSize: '1.1rem' }}>{currentNGO?.logo} {currentNGO?.nameAr}</strong>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>تفاصيل التخصيص:</span>
                  {selectedStations.map(stId => {
                     const st = stations.find(s => s.id === stId)!
                     const count = trucksPerStation[stId] || 1
                     return (
                        <div key={stId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', background: 'var(--bg-dark)', padding: '10px 14px', borderRadius: 8 }}>
                           <span style={{ color: 'var(--text)' }}>محطة {st.name}</span>
                           <strong style={{ color: ngoColor }}>{count} شاحنات ({(count * 5000).toLocaleString()} لتر)</strong>
                        </div>
                     )
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', paddingTop: 16, borderTop: '1px solid var(--glass-border)', marginTop: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>الإجمالي اليومي</span>
                  <strong style={{ color: 'var(--success)', fontWeight: 900 }}>
                    {(selectedStations.reduce((acc, st) => acc + (trucksPerStation[st] || 1), 0) * 5000).toLocaleString()} لتر
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 36px 28px', display: 'flex', gap: 16,
          borderTop: '1px solid var(--glass-border)', background: 'var(--bg-card)'
        }}>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                flex: 1, padding: '14px', borderRadius: 12, fontSize: '0.95rem',
                fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                background: 'var(--bg-dark)', border: '1px solid var(--glass-border)',
                color: 'var(--text)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-dark)'}
            >
              <ChevronRight size={18} /> رجوع
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && selectedStations.length === 0}
              style={{
                flex: 2, padding: '14px', borderRadius: 12, fontSize: '0.95rem',
                fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                background: (step === 1 && selectedStations.length === 0) ? 'var(--bg-dark)' : ngoColor,
                border: 'none', color: '#fff',
                opacity: (step === 1 && selectedStations.length === 0) ? 0.4 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
                boxShadow: (step === 1 && selectedStations.length > 0) ? `0 4px 15px ${ngoColor}40` : 'none',
              }}
            >
              متابعة الإجراء <ChevronLeft size={18} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              style={{
                flex: 2, padding: '14px', borderRadius: 12, fontSize: '1rem',
                fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
                background: `linear-gradient(135deg, ${ngoColor}, ${ngoColor}DD)`,
                border: 'none', color: '#fff',
                boxShadow: `0 8px 25px ${ngoColor}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s transform 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Check size={20} strokeWidth={3} /> تأكيد الاعتماد
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
