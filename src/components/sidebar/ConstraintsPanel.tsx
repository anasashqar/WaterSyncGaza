/**
 * WaterSync — Control Panel — Professional Desktop-Software Grade UI
 */

import { useDataStore } from '@/stores/useDataStore'
import { useMapStore } from '@/stores/useMapStore'
import {
  Map as MapIcon,
  Layers,
  AlertOctagon,
  Settings,
  Globe,
  Tag,
  Eye,
  EyeOff
} from 'lucide-react'

// Helper component for a single layer row
function LayerRow({
  label, isActive, onToggle, color, onChangeColor, isBaseMap = false
}: {
  label: string, isActive: boolean, onToggle: () => void,
  color?: string, onChangeColor?: (c: string) => void, isBaseMap?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 16px',
      borderBottom: '1px solid var(--border, rgba(0,0,0,0.05))',
      transition: 'background-color 0.2s',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-dark, rgba(0,0,0,0.02))'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    onClick={onToggle}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Visibility Icon toggle instead of checkbox for professional look */}
        <div style={{ color: isActive ? 'var(--primary, #2563eb)' : 'var(--text-muted, #94a3b8)' }}>
          {isActive ? <Eye size={18} strokeWidth={1.5} /> : <EyeOff size={18} strokeWidth={1.5} />}
        </div>

        {/* Color picker block */}
        {onChangeColor && color ? (
          <div style={{ position: 'relative', width: 14, height: 14 }} onClick={e => e.stopPropagation()}>
            <input
              type="color"
              value={color}
              onChange={(e) => onChangeColor(e.target.value)}
              style={{
                opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer'
              }}
            />
            <div style={{
              width: '100%', height: '100%', borderRadius: 3,
              backgroundColor: color,
              border: '1px solid rgba(0,0,0,0.2)'
            }} />
          </div>
        ) : (
             isBaseMap && <Globe size={16} color="var(--text-muted, #64748b)" />
        )}
        
        <span style={{
          fontSize: '0.85rem',
          fontWeight: isActive ? 600 : 500,
          color: isActive ? 'var(--text-main, #1e293b)' : 'var(--text-muted, #64748b)'
        }}>
          {label}
        </span>
      </div>
    </div>
  )
}

function SectionHeader({ title, icon: Icon }: { title: string, icon: any }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 16px',
      background: 'var(--bg-dark, #f8fafc)',
      borderBottom: '1px solid var(--border, #e2e8f0)',
      borderTop: '1px solid var(--border, #e2e8f0)',
      marginTop: -1, // Collapse borders
    }}>
      <Icon size={16} style={{ color: 'var(--primary-soft, #64748b)' }} strokeWidth={2} />
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main, #334155)' }}>
        {title}
      </span>
    </div>
  )
}

export function ConstraintsPanel() {
  const exclusionZones = useDataStore((s) => s.exclusionZones)
  
  const layerVisibility = useMapStore((s) => s.layerVisibility)
  const toggleLayerVisibility = useMapStore((s) => s.toggleLayerVisibility)
  const layerColors = useMapStore((s) => s.layerColors) || {} 
  const setLayerColor = useMapStore((s) => s.setLayerColor)

  const baseMapSource = useMapStore((s) => s.baseMapSource)
  const setBaseMapSource = useMapStore((s) => s.setBaseMapSource)

  const showLabels = useMapStore((s) => s.showLabels)
  const setShowLabels = useMapStore((s) => s.setShowLabels)

  const GIS_LAYERS = [
    { key: 'gov', label: 'المحافظات' },
    { key: 'neigh', label: 'الأحياء' },
    { key: 'streets', label: 'الشوارع' },
    { key: 'bufferZone', label: 'المنطقة العازلة (الصفراء)' },
  ]

  const WORK_LAYERS = [
    { key: 'stations', label: 'المحطات' },
    { key: 'points', label: 'نقاط التوزيع' },
    { key: 'routes', label: 'المسارات' },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-elevated, #ffffff)',
      border: '1px solid var(--border, #e2e8f0)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <SectionHeader title="إعدادات الخريطة والعرض" icon={Settings} />
      
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '1px solid var(--border, #e2e8f0)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Globe size={16} color="var(--text-muted, #64748b)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-main, #334155)', fontWeight: 500 }}>مصدر الخريطة</span>
        </div>
        <select
          value={baseMapSource}
          onChange={(e) => setBaseMapSource(e.target.value as 'online' | 'offline')}
          style={{
            appearance: 'none',
            background: 'var(--bg-dark, #f1f5f9)', border: '1px solid var(--border, #cbd5e1)',
            borderRadius: 4, padding: '4px 12px',
            fontSize: '0.8rem', color: 'var(--text-main, #1e293b)', cursor: 'pointer',
            fontFamily: 'inherit', outline: 'none'
          }}
        >
          <option value="online">متصل (أونلاين)</option>
          <option value="offline">غير متصل (أوفلاين)</option>
        </select>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '1px solid var(--border, #e2e8f0)',
        cursor: 'pointer', transition: 'background-color 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-dark, rgba(0,0,0,0.02))'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      onClick={() => setShowLabels(!showLabels)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Tag size={16} color="var(--text-muted, #64748b)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-main, #334155)', fontWeight: 500 }}>إظهار المسميات على الخريطة</span>
        </div>
        <div style={{ color: showLabels ? 'var(--primary, #2563eb)' : 'var(--text-muted, #94a3b8)' }}>
          {showLabels ? <Eye size={18} strokeWidth={1.5} /> : <EyeOff size={18} strokeWidth={1.5} />}
        </div>
      </div>

      <LayerRow
        label="خريطة الأساس (Base Map)"
        isActive={layerVisibility['baseMap'] ?? true} 
        onToggle={() => toggleLayerVisibility('baseMap')} 
        isBaseMap
      />

      <SectionHeader title="الطبقات الجغرافية الأساسية" icon={MapIcon} />
      {GIS_LAYERS.map((layer) => (
        <LayerRow
          key={layer.key}
          label={layer.label}
          isActive={layerVisibility[layer.key] ?? false}
          onToggle={() => toggleLayerVisibility(layer.key)}
          color={layerColors[layer.key] || '#cccccc'}
          onChangeColor={(c) => setLayerColor?.(layer.key, c)}
        />
      ))}

      <SectionHeader title="البيانات التشغيلية" icon={Layers} />
      {WORK_LAYERS.map((layer) => (
        <LayerRow
          key={layer.key}
          label={layer.label}
          isActive={layerVisibility[layer.key] ?? false}
          onToggle={() => toggleLayerVisibility(layer.key)}
          color={layerColors[layer.key] || '#cccccc'}
          onChangeColor={(c) => setLayerColor?.(layer.key, c)}
        />
      ))}

      <SectionHeader title={`القيود ومناطق الاستبعاد (${exclusionZones.length})`} icon={AlertOctagon} />
      <LayerRow
        label="إظهار مناطق الاستبعاد على الخريطة"
        isActive={layerVisibility['exclusionZones']}
        onToggle={() => toggleLayerVisibility('exclusionZones')}
        color={layerColors['exclusionZones'] || '#ef4444'}
        onChangeColor={(c) => setLayerColor?.('exclusionZones', c)}
      />
    </div>
  )
}
