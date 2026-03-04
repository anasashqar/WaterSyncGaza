/**
 * WaterSync — Trips Panel — Professional Desktop-Software Grade UI
 */
import React from 'react'
import { useDataStore } from '@/stores/useDataStore'
import { useMapStore } from '@/stores/useMapStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import {
  Truck,
  PlayCircle,
  Navigation,
  Trash2,
  ChevronDown,
  ChevronRight,
  Route
} from 'lucide-react'

function SectionHeader({ title, icon: Icon, onClear, actionText }: { title: string, icon: any, onClear?: () => void, actionText?: string }) {
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
      {onClear && (
        <button onClick={onClear} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'transparent', border: 'none',
          color: 'var(--danger, #ef4444)', fontSize: '0.75rem', fontWeight: 600,
          cursor: 'pointer', padding: 0
        }} title="مسح النتائج">
          <Trash2 size={12} /> {actionText}
        </button>
      )}
    </div>
  )
}

function TripRow({ trip, onSimulate, flyTo }: { trip: any; onSimulate: (id: string) => void; flyTo: (lat: number, lng: number) => void }) {
  const [expanded, setExpanded] = React.useState(false)
  const stops = trip.stops || []
  const startName = trip.station?.name || 'محطة الانطلاق'

  return (
    <div style={{
      borderBottom: '1px solid var(--border, rgba(0,0,0,0.05))',
    }}>
      {/* Trip Header (Clickable strip) */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: expanded ? 'var(--bg-dark, #f1f5f9)' : 'transparent',
        cursor: 'pointer', transition: 'background-color 0.2s'
      }}
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={(e) => { 
        if(!expanded) e.currentTarget.style.backgroundColor = 'var(--bg-dark, rgba(0,0,0,0.02))' 
      }}
      onMouseLeave={(e) => { 
        if(!expanded) e.currentTarget.style.backgroundColor = 'transparent' 
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ color: 'var(--text-muted, #64748b)', width: 16 }}>
             {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
          <Truck size={16} style={{ color: 'var(--danger, #ef4444)' }} strokeWidth={1.5} />
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main, #1e293b)' }}>
              مسار الدعم {trip.id?.substring(0,4)}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)' }}>
               {stops.length} محطات • {(trip.distance || 0).toFixed(1)} كم • {((trip.demand || 0)).toLocaleString()} لتر
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
           <button onClick={(e) => { e.stopPropagation(); trip.station && flyTo(trip.station.lat, trip.station.lng); }} 
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px',
              color: 'var(--text-muted, #94a3b8)'
            }} title="الذهاب على الخريطة">
              <Navigation size={14} />
           </button>
           <button onClick={(e) => { e.stopPropagation(); onSimulate(trip.id); }} 
            style={{
              background: 'var(--bg-elevated, #fff)', border: '1px solid var(--border, #cbd5e1)',
              borderRadius: 4, cursor: 'pointer', padding: '2px 8px',
              display: 'flex', alignItems: 'center', gap: 4,
              color: 'var(--primary, #2563eb)', fontSize: '0.7rem', fontWeight: 600
            }} title="محاكاة الرحلة">
              <PlayCircle size={12} /> محاكاة
           </button>
        </div>
      </div>

      {/* Expanded Stops Tree View */}
      {expanded && (
        <div style={{
          background: 'var(--bg-dark, #f8fafc)',
          padding: '8px 16px 12px 32px',
          borderTop: '1px solid var(--border, rgba(0,0,0,0.03))',
        }}>
           <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
             
             {/* Vertical Line */}
             <div style={{
               position: 'absolute', top: 12, bottom: 12, right: 6,
               width: 2, background: 'var(--border, #cbd5e1)', zIndex: 0
             }}/>

             {/* Start Node */}
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', position: 'relative', zIndex: 1 }}>
               <div style={{
                 width: 14, height: 14, borderRadius: 4, background: 'var(--primary, #6A4C93)',
                 border: '2px solid var(--bg-dark, #f8fafc)', flexShrink: 0
               }} />
               <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                 <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main, #334155)' }}>{startName} (الانطلاق)</span>
               </div>
             </div>

             {/* Stops */}
             {stops.map((stop: any, idx: number) => (
               <div key={stop.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', position: 'relative', zIndex: 1 }}>
                 <div style={{
                   width: 14, height: 14, borderRadius: '50%', background: 'var(--success, #10b981)',
                   border: '2px solid var(--bg-dark, #f8fafc)', flexShrink: 0,
                   display: 'flex', alignItems: 'center', justifyContent: 'center'
                 }}>
                   <span style={{ fontSize: '0.45rem', color: '#fff', fontWeight: 'bold' }}>{idx+1}</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                   <span style={{ fontSize: '0.75rem', color: 'var(--text-main, #334155)' }}>{stop.name}</span>
                   <span style={{ fontSize: '0.7rem', color: 'var(--success, #10b981)', fontWeight: 600 }}>{stop.demand.toLocaleString()} لتر</span>
                 </div>
               </div>
             ))}

             {/* Return Node */}
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', position: 'relative', zIndex: 1 }}>
               <div style={{
                 width: 14, height: 14, borderRadius: 4, background: 'var(--text-muted, #94a3b8)',
                 border: '2px solid var(--bg-dark, #f8fafc)', flexShrink: 0
               }} />
               <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>العودة للمحطة</span>
               </div>
             </div>

           </div>
        </div>
      )}
    </div>
  )
}

export function TripsPanel() {
  const trips = useDataStore((s) => s.trips)
  const clearTrips = useDataStore((s) => s.clearTrips)
  const map = useMapStore((s) => s.map)
  const { startSimulation } = useSimulationStore();

  const flyTo = (lat: number, lng: number) => map?.flyTo([lat, lng], 14, { duration: 0.8 })

  const simulateTrip = (tripId: string) => {
    startSimulation(tripId);
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
      
      <SectionHeader 
        title={`الرحلات المحسوبة (${trips.length})`} 
        icon={Route} 
        onClear={trips.length > 0 ? clearTrips : undefined} 
        actionText="تفريغ القائمة"
      />

      {trips.length === 0 ? (
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '48px 16px', color: 'var(--text-muted, #94a3b8)' 
        }}>
          <Truck size={36} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.5 }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main, #475569)' }}>لا توجد رحلات حالياً</span>
          <span style={{ fontSize: '0.75rem', marginTop: 4, textAlign: 'center' }}>الرجاء تشغيل المعالج لحساب مسارات التوزيع الذكية</span>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {trips.map((trip) => (
             <TripRow key={trip.id} trip={trip} onSimulate={simulateTrip} flyTo={flyTo} />
          ))}
        </div>
      )}
      
    </div>
  )
}
