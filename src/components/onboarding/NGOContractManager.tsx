/**
 * NGOContractManager — إدارة تعاقدات المؤسسة مع المحطات
 * Professional contract management panel for NGOs
 * - Used for initial setup AND ongoing contract editing
 * - Supports adding/removing stations, adjusting truck counts
 * - Can sync changes at any time
 */
import { useState, useMemo, useEffect } from 'react'
import { useDataStore } from '@/stores/useDataStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import {
  Droplets, Truck, Building2, ClipboardList,
  FileSignature, Plus, Minus, X, RefreshCw, Trash2, Shield,
  ChevronDown, ChevronUp, Save, Search, Map
} from 'lucide-react'

interface Props {
  /** Whether this is the first-time setup (no contracts yet) */
  isInitialSetup?: boolean
  /** Called when user closes the panel */
  onClose: () => void
}

export function NGOContractManager({ isInitialSetup = false, onClose }: Props) {
  const stations = useDataStore((s) => s.stations)
  const institutions = useDataStore((s) => s.institutions)
  const addInstitution = useDataStore((s) => s.addInstitution)
  const removeInstitution = useDataStore((s) => s.removeInstitution)
  const addNotification = useUIStore((s) => s.addNotification)
  const currentNGO = useAuthStore((s) => s.getCurrentNGO())
  const institutionId = useAuthStore((s) => s.institutionId)
  const completeNGOSetup = useAuthStore((s) => s.completeNGOSetup)
  const preselectedStationId = useAuthStore((s) => s.preselectedStationId) // New field 

  // Find existing contracts for this NGO
  const existingInstitution = institutions.find(i => i.id === institutionId)
  const existingContracts = existingInstitution?.contracts || []
  const existingStationIds = existingInstitution?.stationIds || []

  // Local editing state — initialized from existing contracts
  const [selectedStations, setSelectedStations] = useState<string[]>([])
  const [trucksPerStation, setTrucksPerStation] = useState<Record<string, number>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSection, setExpandedSection] = useState<'current' | 'add' | null>(
    isInitialSetup ? 'add' : (existingContracts.length > 0 ? 'current' : 'add')
  )

  // Load existing contracts into local state
  useEffect(() => {
    let initialIds = [...existingStationIds]
    let initialTrucks: Record<string, number> = {}
    
    if (existingContracts.length > 0) {
      existingContracts.forEach(c => { initialTrucks[c.stationId] = c.trucks })
    }

    // Auto-select a station if it was passed via openContractManager(stationId)
    if (preselectedStationId && !initialIds.includes(preselectedStationId)) {
      initialIds.push(preselectedStationId)
      initialTrucks[preselectedStationId] = 1
      setExpandedSection('current') // Open current section to show the newly added one
    }

    setSelectedStations(initialIds)
    setTrucksPerStation(initialTrucks)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Available (non-contracted) stations
  const availableStations = useMemo(() => {
    return stations.filter(st => 
      !existingStationIds.includes(st.id) && 
      !selectedStations.includes(st.id) &&
      (searchQuery ? st.name.includes(searchQuery) || st.governorate.includes(searchQuery) : true)
    )
  }, [stations, existingStationIds, selectedStations, searchQuery])

  // Track changes
  useEffect(() => {
    // Compare with existing
    const existingIds = new Set(existingStationIds)
    const selectedIds = new Set(selectedStations)
    const idsChanged = existingIds.size !== selectedIds.size || [...existingIds].some(id => !selectedIds.has(id))
    const trucksChanged = existingContracts.some(c => trucksPerStation[c.stationId] !== c.trucks)
    setHasChanges(idsChanged || trucksChanged || (isInitialSetup && selectedStations.length > 0))
  }, [selectedStations, trucksPerStation]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalTrucks = selectedStations.reduce((acc, stId) => acc + (trucksPerStation[stId] || 1), 0)
  const totalCapacity = totalTrucks * 5000

  const handleAddStation = (stId: string) => {
    setSelectedStations(prev => [...prev, stId])
    setTrucksPerStation(prev => ({ ...prev, [stId]: prev[stId] || 1 }))
  }

  const handleRemoveStation = (stId: string) => {
    setSelectedStations(prev => prev.filter(id => id !== stId))
    setTrucksPerStation(prev => {
      const next = { ...prev }
      delete next[stId]
      return next
    })
  }

  const handleSave = () => {
    if (selectedStations.length === 0 || !institutionId || !currentNGO) return

    setSaving(true)

    // Remove old contracts first (clean slate approach)
    if (existingInstitution) {
      // Remove the institution from all stations it was assigned to
      stations.forEach(st => {
        const hasOurInst = st.institutions.find(i => i.id === institutionId)
        if (hasOurInst) {
          removeInstitution(hasOurInst.id)
        }
      })
    }

    // Re-add with new configuration
    setTimeout(() => {
      selectedStations.forEach(stId => {
        const trucksCount = trucksPerStation[stId] || 1
        addInstitution({
          id: institutionId,
          name: currentNGO.nameAr,
          stationIds: [stId],
          trucks: trucksCount,
          color: currentNGO.color,
        })
      })

      completeNGOSetup()

      addNotification(
        `✅ تم ${isInitialSetup ? 'إبرام' : 'تحديث'} تعاقدات "${currentNGO.nameAr}" — ${selectedStations.length} ${selectedStations.length > 1 ? 'محطات' : 'محطة'} بإجمالي ${totalTrucks} شاحنة`,
        'success'
      )

      setSaving(false)
      if (!isInitialSetup) {
        onClose()
      }
    }, 400)
  }

  const ngoColor = currentNGO?.color || 'var(--primary)'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      direction: 'rtl',
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 12, width: 600,
        maxHeight: '90vh', overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ═══ Official Header (Clean Style) ═══ */}
        <div style={{
          background: 'var(--bg-elevated)',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', color: ngoColor,
              boxShadow: 'var(--shadow-sm)'
            }}>
              <FileSignature size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                {isInitialSetup ? 'إعداد التعاقدات للمؤسسة' : 'إدارة التعاقدات الخاصة بالمؤسسة'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {currentNGO?.nameAr || 'مؤسسة المياه'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-muted)', width: 32, height: 32, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-main)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Summary Mini-Bar */}
        <div style={{ 
          display: 'flex', gap: 16, padding: '12px 24px', 
          borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
          fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
             <Building2 size={16} color="var(--primary)" /> {selectedStations.length} محطات
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
             <Truck size={16} color="var(--warning)" /> {totalTrucks} شاحنات تعبئة
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
             <Droplets size={16} color="var(--accent)" /> الإجمالي: {(totalCapacity).toLocaleString()} لتر/يوم
           </div>
        </div>

        {/* ═══ Body ═══ */}
        <div style={{ padding: '0', flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {/* ── Current Contracts Section ── */}
          {(existingContracts.length > 0 || selectedStations.length > 0) && (
            <CollapsibleSection
              title="التعاقدات الحالية"
              icon={<ClipboardList size={18} />}
              expanded={expandedSection === 'current'}
              onToggle={() => setExpandedSection(expandedSection === 'current' ? null : 'current')}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {selectedStations.map((stId, index) => {
                  const st = stations.find(s => s.id === stId)
                  if (!st) return null
                  const count = trucksPerStation[stId] || 1
                  return (
                    <ContractRow
                      key={stId}
                      station={st}
                      trucks={count}
                      isLast={index === selectedStations.length - 1}
                      onTrucksChange={(n) => setTrucksPerStation(p => ({ ...p, [stId]: n }))}
                      onRemove={() => handleRemoveStation(stId)}
                    />
                  )
                })}
              </div>
            </CollapsibleSection>
          )}

          {/* ── Add Stations Section ── */}
          <CollapsibleSection
            title={isInitialSetup ? 'اعتماد محطات التعبئة (تعاقد جديد)' : 'إضافة محطة جديدة للتعاقد'}
            icon={<Map size={18} />}
            expanded={expandedSection === 'add'}
            onToggle={() => setExpandedSection(expandedSection === 'add' ? null : 'add')}
          >
            {/* Search Bar */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--bg-dark)', padding: '8px 12px',
                borderRadius: 8, border: '1px solid var(--border)'
              }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="ابحث عن محطة أو منطقة..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: 'var(--text-main)', width: '100%', fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            {availableStations.length === 0 ? (
              <div style={{
                padding: 24, textAlign: 'center', color: 'var(--warning)',
                background: 'var(--warning-soft)', fontSize: '0.85rem'
              }}>
                {searchQuery ? 'لا توجد محطات تطابق بحثك' : 'تم التعاقد مع جميع المحطات المتاحة، أو لا تتوفر محطات حالياً.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 300, overflowY: 'auto' }}>
                {availableStations.map((st, i) => (
                  <button
                    key={st.id}
                    onClick={() => handleAddStation(st.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', cursor: 'pointer',
                      background: 'var(--bg-card)', borderBottom: i === availableStations.length - 1 ? 'none' : '1px solid var(--border)',
                      borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                      color: 'var(--text-main)', fontFamily: 'inherit', textAlign: 'right',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                  >
                    <Building2 size={18} color="var(--primary)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{st.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        المحافظة: {st.governorate} • السعة: {st.remainingCapacity.toLocaleString()} لتر
                      </div>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600,
                      background: 'var(--primary-soft)', padding: '4px 8px', borderRadius: 6
                    }}>
                      <Plus size={14} /> إضافة للتعاقد
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* ── Security Notice ── */}
          <div style={{
            padding: '16px 36px', display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--bg-dark)', borderTop: '1px solid var(--glass-border)',
            fontSize: '0.75rem', color: 'var(--text-muted)',
          }}>
            <Shield size={14} color={ngoColor} style={{ flexShrink: 0 }} />
            <span>
              يتم تسجيل جميع التعديلات على التعاقدات ومزامنتها تلقائياً مع الخادم المركزي.
              يُمنع حجز نقاط توزيع في غير نطاق المحطات المتعاقد معها.
            </span>
          </div>
        </div>

        {/* ═══ Footer Actions ═══ */}
        <div style={{
          padding: '16px 24px', display: 'flex', gap: 12,
          borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)',
          alignItems: 'center',
        }}>
          {/* Cancel / Skip */}
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px', borderRadius: 8, fontSize: '0.85rem',
              fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              color: 'var(--text-main)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
          >
            {isInitialSetup ? 'تخطي الآن' : 'إغلاق'}
          </button>

          {/* Save / Confirm */}
          <button
            onClick={handleSave}
            disabled={selectedStations.length === 0 || (!hasChanges && !isInitialSetup) || saving}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 8, fontSize: '0.9rem',
              fontWeight: 700, fontFamily: 'inherit',
              cursor: selectedStations.length > 0 && (hasChanges || isInitialSetup) ? 'pointer' : 'not-allowed',
              background: selectedStations.length > 0 && (hasChanges || isInitialSetup)
                ? 'var(--primary)'
                : 'var(--bg-dark)',
              border: 'none', color: '#fff',
              opacity: selectedStations.length > 0 && (hasChanges || isInitialSetup) ? 1 : 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {saving ? (
              <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> مزامنة وتأكيد...</>
            ) : isInitialSetup ? (
              <><Save size={16} /> حفط واعتماد التعاقد الأولي</>
            ) : (
              <><Save size={16} /> حفظ التعديلات والمزامنة</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Sub Components ─── */

function CollapsibleSection({ title, icon, expanded, onToggle, children }: {
  title: string; icon: React.ReactNode; 
  expanded: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 12,
          background: expanded ? 'var(--bg-elevated)' : 'var(--bg-card)',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          textAlign: 'right', color: 'var(--text-main)', transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = expanded ? 'var(--bg-elevated)' : 'var(--bg-card)'}
      >
        <div style={{ color: 'var(--text-muted)' }}>{icon}</div>
        <div style={{ flex: 1, fontWeight: 700, fontSize: '0.9rem' }}>{title}</div>
        {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>
      {expanded && (
        <div style={{ background: 'var(--bg-card)', animation: 'fadeIn 0.2s' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function ContractRow({ station, trucks, isLast, onTrucksChange, onRemove }: {
  station: { id: string; name: string; governorate: string; remainingCapacity: number }
  trucks: number; isLast: boolean
  onTrucksChange: (n: number) => void
  onRemove: () => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 24px', 
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      background: 'var(--bg-card)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{station.name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
           {station.governorate} • طاقة المحطة: {station.remainingCapacity.toLocaleString()} لتر
        </div>
      </div>

      {/* Truck counter */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'var(--bg-elevated)', padding: '2px 4px', borderRadius: 6,
        border: '1px solid var(--border)',
      }}>
        <button
          onClick={() => onTrucksChange(Math.max(1, trucks - 1))}
          style={{
            width: 24, height: 24, borderRadius: 4, fontSize: '1rem', fontWeight: 600,
            background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        ><Minus size={12} /></button>
        <div style={{
          fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)',
          width: 24, textAlign: 'center',
        }}>{trucks}</div>
        <button
          onClick={() => onTrucksChange(trucks + 1)}
          style={{
            width: 24, height: 24, borderRadius: 4, fontSize: '1rem', fontWeight: 600,
            background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        ><Plus size={12} /></button>
      </div>
      
      {/* Trucks Daily Estimate */}
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', width: 80, textAlign: 'center' }}>
        {(trucks * 5000).toLocaleString()} لتر
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'transparent', border: '1px solid var(--danger-soft)',
          color: 'var(--danger)', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-soft)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        title="إلغاء التعاقد"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
