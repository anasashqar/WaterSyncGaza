import { useState } from 'react'
import { StationsPanel } from './StationsPanel'
import { PointsPanel } from './PointsPanel'
import { MapPin, Factory } from 'lucide-react'

export function SupplyDemandPanel() {
  const [activeTab, setActiveTab] = useState<'supply' | 'demand'>('supply')

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%',
    }}>
       {/* Segmented Control */}
       <div style={{ 
         display: 'flex', background: 'var(--bg-dark, #f1f5f9)', 
         borderRadius: 8, padding: 4, marginBottom: 16, border: '1px solid var(--border, #e2e8f0)',
         flexShrink: 0
       }}>
         <button 
           onClick={() => setActiveTab('supply')}
           style={{
             flex: 1, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
             borderRadius: 6, border: 'none', cursor: 'pointer',
             background: activeTab === 'supply' ? 'var(--bg-elevated, #fff)' : 'transparent',
             color: activeTab === 'supply' ? 'var(--primary, #2563eb)' : 'var(--text-muted, #64748b)',
             boxShadow: activeTab === 'supply' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
             fontWeight: activeTab === 'supply' ? 700 : 500, fontSize: '0.8rem',
             transition: 'all 0.2s'
           }}>
           <Factory size={16} /> المحطات (العرض)
         </button>
         <button 
           onClick={() => setActiveTab('demand')}
           style={{
             flex: 1, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
             borderRadius: 6, border: 'none', cursor: 'pointer',
             background: activeTab === 'demand' ? 'var(--bg-elevated, #fff)' : 'transparent',
             color: activeTab === 'demand' ? 'var(--primary, #2563eb)' : 'var(--text-muted, #64748b)',
             boxShadow: activeTab === 'demand' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
             fontWeight: activeTab === 'demand' ? 700 : 500, fontSize: '0.8rem',
             transition: 'all 0.2s'
           }}>
           <MapPin size={16} /> نقاط التوزيع (الطلب)
         </button>
       </div>

       {/* Content View */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {activeTab === 'supply' 
            ? <StationsPanel /> 
            : <PointsPanel />
          }
       </div>
    </div>
  )
}
