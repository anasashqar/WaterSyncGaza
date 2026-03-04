/**
 * WaterSync — Layer Editor Panel (Floating on Map)
 * لوحة المحرر العائمة — تعمل فوق الخريطة مباشرة
 * استيراد/تصدير، بحث OSM، فلاتر، تحرير مباشر، سحب وإفلات
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useDataStore } from '@/stores/useDataStore'
import { useMapStore } from '@/stores/useMapStore'
import { useUIStore } from '@/stores/useUIStore'
import { TYPE_LABELS, TRUCK_CAPACITY } from '@/lib/constants/colors'
import type { Station, Point, MapMode } from '@/types'
import {
  Edit3, Trash2, MapPin, X, Factory, Search, Upload, Download,
  ChevronDown, ChevronUp, Globe, Plus, Crosshair,
  Truck, Droplets, Users, Check, MousePointer, Layers,
  AlertTriangle, FileJson, FileSpreadsheet, ChevronRight
} from 'lucide-react'

/* ═══════ Types ═══════ */
type EditorTab = 'tools' | 'stations' | 'points'
type StatusFilter = 'all' | 'supplied' | 'warning' | 'critical'
type TypeFilter = 'all' | 'hospital' | 'residential' | 'camp' | 'shelter'

interface OsmResult {
  place_id: number; display_name: string; lat: string; lon: string; type: string
}

/* ═══════ Styles ═══════ */
const inputSt: React.CSSProperties = {
  padding: '7px 10px', borderRadius: 7, background: 'var(--bg-elevated)',
  border: '1.5px solid var(--glass-border)', color: 'var(--text)',
  fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none', width: '100%',
}
const lblSt: React.CSSProperties = { fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }

/* ═══════ Main Panel ═══════ */
export function LayerEditorPanel({ onClose, initialTab = 'tools' }: { onClose: () => void; initialTab?: EditorTab }) {
  const stations = useDataStore(s => s.stations)
  const points = useDataStore(s => s.points)
  const updateStation = useDataStore(s => s.updateStation)
  const removeStation = useDataStore(s => s.removeStation)
  const updatePoint = useDataStore(s => s.updatePoint)
  const removePoint = useDataStore(s => s.removePoint)
  const addStation = useDataStore(s => s.addStation)
  const addPoint = useDataStore(s => s.addPoint)
  const setStations = useDataStore(s => s.setStations)
  const setPoints = useDataStore(s => s.setPoints)
  const clearAll = useDataStore(s => s.clearAll)
  const addNotification = useUIStore(s => s.addNotification)
  const flyTo = useMapStore(s => s.flyTo)
  const mode = useMapStore(s => s.mode)
  const setMode = useMapStore(s => s.setMode)
  const setEditorMode = useMapStore(s => s.setEditorMode)


  const [tab, setTab] = useState<EditorTab>(initialTab)

  // Sync tab when initialTab changes (editor already open, sidebar triggers different tab)
  useEffect(() => { setTab(initialTab) }, [initialTab])
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [osmQuery, setOsmQuery] = useState('')
  const [osmResults, setOsmResults] = useState<OsmResult[]>([])
  const [osmLoading, setOsmLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ═══ Enable editor mode on mount, disable on close ═══
  const handleClose = () => { setEditorMode(false); setMode(null); onClose() }

  // Activate editor mode
  const activateMode = (m: MapMode) => {
    setEditorMode(true)
    setMode(m)
  }

  // ═══ Filtering ═══
  const filteredStations = useMemo(() => {
    let list = stations.filter(s => !search || s.name.includes(search) || s.governorate.includes(search))
    if (sortDir === 'desc') list = [...list].reverse()
    return list
  }, [stations, search, sortDir])

  const filteredPoints = useMemo(() => {
    let list = points.filter(p => !search || p.name.includes(search) || p.governorate.includes(search))
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter)
    if (typeFilter !== 'all') list = list.filter(p => p.type === typeFilter)
    if (sortDir === 'desc') list = [...list].reverse()
    return list
  }, [points, search, statusFilter, typeFilter, sortDir])

  // ═══ Handlers ═══
  const handleDelete = (id: string, type: 'station' | 'point') => {
    type === 'station' ? removeStation(id) : removePoint(id)
    addNotification(`تم حذف ${type === 'station' ? 'المحطة' : 'النقطة'}`, 'info')
    if (editId === id) setEditId(null)
    selectedIds.delete(id); setSelectedIds(new Set(selectedIds))
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    const t = tab === 'stations' ? 'station' : 'point'
    selectedIds.forEach(id => t === 'station' ? removeStation(id) : removePoint(id))
    addNotification(`تم حذف ${selectedIds.size} عنصر`, 'info')
    setSelectedIds(new Set()); setEditId(null)
  }

  const toggleSelect = (id: string) => {
    const n = new Set(selectedIds); n.has(id) ? n.delete(id) : n.add(id); setSelectedIds(n)
  }

  // ═══ Import ═══
  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        let n = 0
        if (data.stations?.length) { setStations(data.stations); n += data.stations.length }
        if (data.points?.length) { setPoints(data.points); n += data.points.length }
        if (Array.isArray(data) && data[0]?.lat) {
          if (data[0].dailyCapacity !== undefined) { setStations(data); n += data.length }
          else { setPoints(data); n += data.length }
        }
        addNotification(`تم استيراد ${n} عنصر`, 'success')
      } catch { addNotification('خطأ في قراءة الملف', 'error') }
    }
    reader.readAsText(file); e.target.value = ''
  }, [setStations, setPoints, addNotification])

  // ═══ Export ═══
  const doExport = (format: 'json' | 'csv') => {
    const isStations = tab === 'stations'
    if (format === 'json') {
      const data = isStations
        ? { stations: stations.map(({ marker, latlng, ...r }) => r) }
        : { points: points.map(({ marker, latlng, ...r }) => r) }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      dl(blob, `watersync_${tab}_${Date.now()}.json`)
    } else {
      let csv = ''
      if (isStations) {
        csv = 'id,name,lat,lng,governorate,trucks,dailyCapacity\n'
        stations.forEach(s => { csv += `${s.id},${s.name},${s.lat},${s.lng},${s.governorate},${s.trucks},${s.dailyCapacity}\n` })
      } else {
        csv = 'id,name,type,lat,lng,governorate,demand,population,status\n'
        points.forEach(p => { csv += `${p.id},${p.name},${p.type},${p.lat},${p.lng},${p.governorate},${p.demand},${p.population},${p.status}\n` })
      }
      dl(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }), `watersync_${tab}_${Date.now()}.csv`)
    }
    addNotification(`تم التصدير بنجاح`, 'success')
  }
  const dl = (blob: Blob, name: string) => { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u) }

  // ═══ OSM Search ═══
  const searchOSM = async () => {
    if (!osmQuery.trim()) return; setOsmLoading(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(osmQuery + ' Gaza')}&format=json&limit=8&accept-language=ar`)
      const data: OsmResult[] = await res.json(); setOsmResults(data)
      if (!data.length) addNotification('لا توجد نتائج', 'warning')
    } catch { addNotification('خطأ في الاتصال', 'error') }
    setOsmLoading(false)
  }

  const addOsmAs = (r: OsmResult, as: 'station' | 'point') => {
    const name = r.display_name.split(',')[0]
    if (as === 'station') {
      addStation({
        id: `stn_osm_${Date.now()}`, name, lat: +r.lat, lng: +r.lon,
        governorate: '', dailyCapacity: 0, usedCapacity: 0, remainingCapacity: 0,
        institutions: [], trucks: 0,
      })
    } else {
      addPoint({
        id: `pt_osm_${Date.now()}`, name, type: 'residential', lat: +r.lat, lng: +r.lon,
        governorate: '', neighborhood: '', population: 0, demand: TRUCK_CAPACITY,
        capacity: TRUCK_CAPACITY, currentFill: 0, remainingCapacity: TRUCK_CAPACITY,
        totalReceived: 0, status: 'critical', lastSupply: null, stationId: null,
        visitedByTrucks: [], missedCount: 0,
      })
    }
    addNotification(`تم إضافة "${name}"`, 'success')
    flyTo?.(+r.lat, +r.lon)
  }

  // ═══ File Drop ═══
  const onFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file?.name.endsWith('.json')) { addNotification('يرجى إسقاط ملف JSON', 'warning'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target?.result as string); let c = 0
        if (d.stations) { setStations(d.stations); c += d.stations.length }
        if (d.points) { setPoints(d.points); c += d.points.length }
        addNotification(`تم استيراد ${c} عنصر`, 'success')
      } catch { addNotification('خطأ في الملف', 'error') }
    }
    reader.readAsText(file)
  }

  if (collapsed) {
    return (
      <div style={{
        position: 'fixed', top: 120, right: 12, zIndex: 1500,
        background: 'var(--bg-card)', borderRadius: 12, padding: 6,
        border: '1.5px solid var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <MiniBtn icon={<Layers size={16} />} tooltip="فتح المحرر" onClick={() => setCollapsed(false)} active />
        <MiniBtn icon={<Factory size={16} />} tooltip="إضافة محطة" onClick={() => activateMode('station')} active={mode === 'station'} />
        <MiniBtn icon={<MapPin size={16} />} tooltip="إضافة نقطة" onClick={() => activateMode('point')} active={mode === 'point'} />
        <MiniBtn icon={<AlertTriangle size={16} />} tooltip="استبعاد مساحة" onClick={() => activateMode('zone_rect')} active={mode === 'zone_rect'} />
        <MiniBtn icon={<AlertTriangle size={16} />} tooltip="إغلاق شارع" onClick={() => { activateMode('zone_street'); useMapStore.getState().setLayerVisibility('streets', true) }} active={mode === 'zone_street'} />
        <MiniBtn icon={<MousePointer size={16} />} tooltip="إيقاف" onClick={() => { setMode(null); setEditorMode(false) }} />
        <div style={{ height: 1, background: 'var(--glass-border)' }} />
        <MiniBtn icon={<X size={16} />} tooltip="إغلاق المحرر" onClick={handleClose} danger />
      </div>
    )
  }

  return (
    <div
      onDragOver={e => e.preventDefault()} onDrop={onFileDrop}
      style={{
        position: 'fixed', top: 116, right: 12, zIndex: 1500,
        width: 380, maxHeight: 'calc(100vh - 130px)',
        background: 'var(--bg-card)', borderRadius: 14,
        border: '1.5px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        display: 'flex', flexDirection: 'column',
        animation: 'fadeIn 0.25s ease', overflow: 'hidden',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* ═══ Header ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)',
        color: '#fff', display: 'flex', alignItems: 'center', padding: '10px 14px',
        gap: 8, flexShrink: 0,
      }}>
        <Edit3 size={18} />
        <span style={{ fontSize: '0.92rem', fontWeight: 700, flex: 1 }}>محرر الطبقات</span>
        <HdrBtn icon={<ChevronRight size={14} />} onClick={() => setCollapsed(true)} tip="تصغير" />
        <HdrBtn icon={<X size={14} />} onClick={handleClose} tip="إغلاق" />
      </div>

      {/* ═══ Active Mode Indicator ═══ */}
      {mode && (
        <div style={{
          padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
          background: mode === 'station' ? 'rgba(139,92,246,0.1)' : mode === 'point' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
          borderBottom: '1px solid var(--glass-border)', fontSize: '0.78rem', fontWeight: 600,
          color: mode === 'station' ? '#8b5cf6' : mode === 'point' ? '#3b82f6' : '#ef4444',
          animation: 'fadeIn 0.2s',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'currentColor', animation: 'pulse 1.5s infinite',
          }} />
          {mode === 'station' && 'انقر على الخريطة لإضافة محطة'}
          {mode === 'point' && 'انقر على الخريطة لإضافة نقطة توزيع'}
          {mode === 'zone_rect' && 'انقر واسحب على الخريطة لرسم مساحة استبعاد'}
          {mode === 'zone_street' && 'انقر على أي شارع لإغلاقه وتحويله لمنطقة استبعاد'}
          <button onClick={() => { setMode(null); setEditorMode(false) }} style={{
            marginRight: 'auto', background: 'none', border: 'none', color: 'inherit',
            cursor: 'pointer', padding: 2,
          }}><X size={14} /></button>
        </div>
      )}

      {/* ═══ Tabs ═══ */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--glass-border)', flexShrink: 0,
      }}>
        {([
          { key: 'tools' as EditorTab, label: 'أدوات', icon: <Layers size={13} /> },
          { key: 'stations' as EditorTab, label: `محطات (${stations.length})`, icon: <Factory size={13} /> },
          { key: 'points' as EditorTab, label: `نقاط (${points.length})`, icon: <MapPin size={13} /> },
        ] as const).map(({ key, label, icon }) => (
          <button key={key} onClick={() => { setTab(key); setSelectedIds(new Set()); setEditId(null) }} style={{
            flex: 1, padding: '9px 6px', fontSize: '0.75rem', fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer', border: 'none',
            borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
            background: tab === key ? 'rgba(56,189,248,0.06)' : 'transparent',
            color: tab === key ? 'var(--accent)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'all 0.2s',
          }}>{icon} {label}</button>
        ))}
      </div>

      {/* ═══ Content ═══ */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>

        {/* ──── Tools Tab ──── */}
        {tab === 'tools' && (
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Placement Tools */}
            <Section title="أدوات الوضع">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <ToolBtn icon={<Factory size={18} />} label="محطة" color="#8b5cf6"
                  active={mode === 'station'} onClick={() => activateMode('station')} />
                <ToolBtn icon={<MapPin size={18} />} label="نقطة" color="#3b82f6"
                  active={mode === 'point'} onClick={() => activateMode('point')} />
                <ToolBtn icon={<AlertTriangle size={18} />} label="استبعاد مساحة" color="#ef4444"
                  active={mode === 'zone_rect'} onClick={() => activateMode('zone_rect')} />
                <ToolBtn icon={<AlertTriangle size={18} />} label="إغلاق شارع" color="#ef4444"
                  active={mode === 'zone_street'} onClick={() => { activateMode('zone_street'); useMapStore.getState().setLayerVisibility('streets', true) }} />
              </div>

              {mode && (
                <button onClick={() => { setMode(null); setEditorMode(false) }} style={{
                  padding: '6px 0', borderRadius: 8, background: 'var(--bg-elevated)',
                  border: '1px solid var(--glass-border)', color: 'var(--text)',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: '100%',
                }}><MousePointer size={13} /> إيقاف وضع الإضافة</button>
              )}
            </Section>

            {/* Import / Export */}
            <Section title="استيراد وتصدير">
              <input ref={fileRef} type="file" accept=".json,.csv" onChange={handleImport} style={{ display: 'none' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <ActionBtn icon={<Upload size={14} />} label="استيراد JSON" onClick={() => fileRef.current?.click()} />
                <ActionBtn icon={<Download size={14} />} label="تصدير JSON" onClick={() => doExport('json')} />
                <ActionBtn icon={<FileSpreadsheet size={14} />} label="تصدير CSV" onClick={() => doExport('csv')} />
                <ActionBtn icon={<FileJson size={14} />} label="سحب ملف هنا" onClick={() => fileRef.current?.click()} muted />
              </div>
            </Section>

            {/* Clear Data */}
            <Section title="مسح النظام">
              <button onClick={() => {
                if(window.confirm('هل أنت متأكد من مسح جميع البيانات (محطات، نقاط، مناطق خطرة، رحلات)؟ هذه العملية لا يمكن التراجع عنها.')) {
                  clearAll();
                  addNotification('تم مسح جميع البيانات بنجاح', 'success');
                }
              }} style={{
                padding: '8px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s',
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)',
                color: 'rgb(239, 68, 68)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.borderColor = 'rgb(239, 68, 68)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)' }}
              >
                <Trash2 size={16} /> مسح جميع البيانات بأمان
              </button>
            </Section>

            {/* OSM Search */}
            <Section title="بحث نقاط OSM">
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={osmQuery} onChange={e => setOsmQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchOSM()}
                  placeholder="مدرسة، مستشفى، مخيم..."
                  style={{ ...inputSt, flex: 1, fontSize: '0.76rem' }}
                />
                <button onClick={searchOSM} disabled={osmLoading} style={{
                  padding: '7px 14px', borderRadius: 7, background: 'var(--accent)', color: '#fff',
                  border: 'none', fontWeight: 600, fontSize: '0.76rem', cursor: 'pointer',
                  fontFamily: 'inherit', opacity: osmLoading ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}><Globe size={13} /> {osmLoading ? '...' : 'بحث'}</button>
              </div>
              {osmResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 180, overflow: 'auto' }}>
                  {osmResults.map(r => (
                    <div key={r.place_id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                      background: 'var(--bg-elevated)', borderRadius: 8,
                      border: '1px solid var(--glass-border)', fontSize: '0.76rem',
                    }}>
                      <MapPin size={12} color="var(--accent)" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                        {r.display_name.split(',')[0]}
                      </div>
                      <SmBtn icon={<Plus size={12} />} tip="نقطة" onClick={() => addOsmAs(r, 'point')} />
                      <SmBtn icon={<Factory size={12} />} tip="محطة" onClick={() => addOsmAs(r, 'station')} />
                      <SmBtn icon={<Crosshair size={12} />} tip="عرض" onClick={() => flyTo?.(+r.lat, +r.lon)} />
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Quick Stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
              padding: '10px 0',
            }}>
              <StatBox label="محطات" value={stations.length} color="#8b5cf6" />
              <StatBox label="نقاط" value={points.length} color="#3b82f6" />
              <StatBox label="خطرة" value={useDataStore.getState().exclusionZones.length} color="#ef4444" />
            </div>
          </div>
        )}

        {/* ──── Stations Tab ──── */}
        {tab === 'stations' && (
          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ListToolbar search={search} setSearch={setSearch} sortDir={sortDir} setSortDir={setSortDir}
              selectedCount={selectedIds.size} onBulkDelete={handleBulkDelete}
              onSelectAll={() => {
                if (selectedIds.size === filteredStations.length) setSelectedIds(new Set())
                else setSelectedIds(new Set(filteredStations.map(s => s.id)))
              }} allSelected={selectedIds.size === filteredStations.length && filteredStations.length > 0}
            />
            {filteredStations.length === 0 ? <EmptyMsg text="لا توجد محطات" /> : filteredStations.map(st => (
              <StationCard key={st.id} station={st}
                editing={editId === st.id} selected={selectedIds.has(st.id)}
                onEdit={() => setEditId(editId === st.id ? null : st.id)}
                onUpdate={u => { updateStation(st.id, u); addNotification('تم التحديث', 'success') }}
                onDelete={() => handleDelete(st.id, 'station')}
                onFlyTo={() => flyTo?.(st.lat, st.lng)}
                onSelect={() => toggleSelect(st.id)}
              />
            ))}
          </div>
        )}

        {/* ──── Points Tab ──── */}
        {tab === 'points' && (
          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ListToolbar search={search} setSearch={setSearch} sortDir={sortDir} setSortDir={setSortDir}
              selectedCount={selectedIds.size} onBulkDelete={handleBulkDelete}
              onSelectAll={() => {
                if (selectedIds.size === filteredPoints.length) setSelectedIds(new Set())
                else setSelectedIds(new Set(filteredPoints.map(p => p.id)))
              }} allSelected={selectedIds.size === filteredPoints.length && filteredPoints.length > 0}
            />
            {/* Filters */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <FilterSel value={statusFilter} onChange={v => setStatusFilter(v as StatusFilter)}
                options={[['all', 'كل الحالات'], ['supplied', 'مزوّد'], ['warning', 'تحذير'], ['critical', 'حرج']]} />
              <FilterSel value={typeFilter} onChange={v => setTypeFilter(v as TypeFilter)}
                options={[['all', 'كل الأنواع'], ['hospital', 'مستشفى'], ['residential', 'سكني'], ['camp', 'مخيم'], ['shelter', 'إيواء']]} />
            </div>
            {filteredPoints.length === 0 ? <EmptyMsg text="لا توجد نقاط مطابقة" /> : filteredPoints.map(pt => (
              <PointCard key={pt.id} point={pt}
                editing={editId === pt.id} selected={selectedIds.has(pt.id)}
                onEdit={() => setEditId(editId === pt.id ? null : pt.id)}
                onUpdate={u => { updatePoint(pt.id, u); addNotification('تم التحديث', 'success') }}
                onDelete={() => handleDelete(pt.id, 'point')}
                onFlyTo={() => flyTo?.(pt.lat, pt.lng)}
                onSelect={() => toggleSelect(pt.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════════ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  )
}

function ToolBtn({ icon, label, color, active, onClick }: {
  icon: React.ReactNode; label: string; color: string; active: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '14px 8px', borderRadius: 10, cursor: 'pointer',
      fontFamily: 'inherit', transition: 'all 0.2s',
      background: active ? `${color}18` : 'var(--bg-elevated)',
      border: `1.5px solid ${active ? color : 'var(--glass-border)'}`,
      color: active ? color : 'var(--text)',
      boxShadow: active ? `0 0 12px ${color}30` : 'none',
    }}>
      {icon}
      <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{label}</span>
    </button>
  )
}

function ActionBtn({ icon, label, onClick, muted }: { icon: React.ReactNode; label: string; onClick: () => void; muted?: boolean }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 10px', borderRadius: 8, fontSize: '0.73rem', fontWeight: 600,
      fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s',
      background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
      color: muted ? 'var(--text-muted)' : 'var(--text)',
      display: 'flex', alignItems: 'center', gap: 5,
    }}>{icon} {label}</button>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '10px 6px', borderRadius: 10,
      background: `${color}0d`, border: `1px solid ${color}25`,
    }}>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function HdrBtn({ icon, onClick, tip }: { icon: React.ReactNode; onClick: () => void; tip: string }) {
  return (
    <button onClick={onClick} title={tip} style={{
      width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
      color: '#fff', cursor: 'pointer', transition: 'all 0.2s',
    }}>{icon}</button>
  )
}

function MiniBtn({ icon, tooltip, onClick, active, danger }: {
  icon: React.ReactNode; tooltip: string; onClick: () => void; active?: boolean; danger?: boolean
}) {
  return (
    <button onClick={onClick} title={tooltip} style={{
      width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: danger ? 'var(--danger-soft)' : active ? 'rgba(56,189,248,0.12)' : 'var(--bg-elevated)',
      border: `1.5px solid ${danger ? 'var(--danger)' : active ? 'var(--accent)' : 'var(--glass-border)'}`,
      color: danger ? 'var(--danger)' : active ? 'var(--accent)' : 'var(--text)',
      cursor: 'pointer', transition: 'all 0.2s',
    }}>{icon}</button>
  )
}

function SmBtn({ icon, tip, onClick, danger }: { icon: React.ReactNode; tip: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick() }} title={tip} style={{
      width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: danger ? 'var(--danger-soft)' : 'transparent',
      border: `1px solid ${danger ? 'var(--danger)' : 'var(--glass-border)'}`,
      color: danger ? 'var(--danger)' : 'var(--text)', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
    }}>{icon}</button>
  )
}

function EmptyMsg({ text }: { text: string }) {
  return <div style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{text}</div>
}

function ListToolbar({ search, setSearch, sortDir, setSortDir, selectedCount, onBulkDelete, onSelectAll, allSelected }: {
  search: string; setSearch: (s: string) => void; sortDir: string; setSortDir: (d: 'asc' | 'desc') => void
  selectedCount: number; onBulkDelete: () => void; onSelectAll: () => void; allSelected: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 100 }}>
        <Search size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
          style={{ ...inputSt, paddingRight: 26, fontSize: '0.74rem' }} />
      </div>
      <SmBtn icon={sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        tip={sortDir === 'asc' ? 'تنازلي' : 'تصاعدي'} onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} />
      <SmBtn icon={allSelected ? <Check size={13} /> : <div style={{ width: 10, height: 10, borderRadius: 2, border: '1.5px solid var(--text-muted)' }} />}
        tip="تحديد الكل" onClick={onSelectAll} />
      {selectedCount > 0 && (
        <button onClick={onBulkDelete} style={{
          padding: '4px 10px', borderRadius: 6, background: 'var(--danger-soft)',
          border: '1px solid var(--danger)', color: 'var(--danger)',
          fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 3,
        }}><Trash2 size={11} /> {selectedCount}</button>
      )}
    </div>
  )
}

function FilterSel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[][] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      padding: '4px 8px', borderRadius: 6, background: 'var(--bg-elevated)',
      border: '1px solid var(--glass-border)', color: 'var(--text)',
      fontSize: '0.72rem', fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
    }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

/* ─── Station Card ─── */
function StationCard({ station, editing, selected, onEdit, onUpdate, onDelete, onFlyTo, onSelect }: {
  station: Station; editing: boolean; selected: boolean
  onEdit: () => void; onUpdate: (u: Partial<Station>) => void
  onDelete: () => void; onFlyTo: () => void; onSelect: () => void
}) {
  const [name, setName] = useState(station.name)
  const [trucks, setTrucks] = useState(station.trucks)
  const [gov, setGov] = useState(station.governorate)

  return (
    <div style={{
      background: selected ? 'rgba(56,189,248,0.05)' : 'var(--bg-elevated)', borderRadius: 10,
      border: `1.5px solid ${editing ? 'var(--accent)' : selected ? 'rgba(56,189,248,0.4)' : 'var(--glass-border)'}`,
      padding: 10, transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={selected} onChange={onSelect} style={{ accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }} />
        <Factory size={16} color="#8b5cf6" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)' }}>{station.name || `محطة ${station.id.slice(-4)}`}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', gap: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Truck size={9} /> {station.trucks}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Droplets size={9} /> {station.dailyCapacity.toLocaleString()}</span>
          </div>
        </div>
        <SmBtn icon={<Crosshair size={12} />} tip="عرض" onClick={onFlyTo} />
        <SmBtn icon={editing ? <X size={12} /> : <Edit3 size={12} />} tip={editing ? 'إغلاق' : 'تعديل'} onClick={onEdit} />
        <SmBtn icon={<Trash2 size={12} />} tip="حذف" onClick={onDelete} danger />
      </div>
      {editing && (
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, animation: 'fadeIn 0.2s' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={lblSt}>الاسم</div>
            <input value={name} onChange={e => setName(e.target.value)} onBlur={() => onUpdate({ name })} style={inputSt} />
          </div>
          <div>
            <div style={lblSt}>المحافظة</div>
            <input value={gov} onChange={e => setGov(e.target.value)} onBlur={() => onUpdate({ governorate: gov })} style={inputSt} />
          </div>
          <div>
            <div style={lblSt}>الشاحنات</div>
            <input type="number" value={trucks} onChange={e => setTrucks(+e.target.value)}
              onBlur={() => onUpdate({ trucks, dailyCapacity: trucks * TRUCK_CAPACITY, remainingCapacity: trucks * TRUCK_CAPACITY })} style={inputSt} />
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            {station.lat.toFixed(5)}, {station.lng.toFixed(5)}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Point Card ─── */
function PointCard({ point, editing, selected, onEdit, onUpdate, onDelete, onFlyTo, onSelect }: {
  point: Point; editing: boolean; selected: boolean
  onEdit: () => void; onUpdate: (u: Partial<Point>) => void
  onDelete: () => void; onFlyTo: () => void; onSelect: () => void
}) {
  const [name, setName] = useState(point.name)
  const [demand, setDemand] = useState(point.demand)
  const [pop, setPop] = useState(point.population)
  const sc = point.status === 'supplied' ? 'var(--success)' : point.status === 'warning' ? 'var(--warning)' : 'var(--danger)'

  return (
    <div style={{
      background: selected ? 'rgba(56,189,248,0.05)' : 'var(--bg-elevated)', borderRadius: 10,
      border: `1.5px solid ${editing ? 'var(--accent)' : selected ? 'rgba(56,189,248,0.4)' : 'var(--glass-border)'}`,
      padding: 10, transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={selected} onChange={onSelect} style={{ accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc, boxShadow: `0 0 5px ${sc}`, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{point.name}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', gap: 6 }}>
            <span>{TYPE_LABELS[point.type] || point.type}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Users size={9} /> {point.population.toLocaleString()}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Droplets size={9} /> {point.demand.toLocaleString()}</span>
          </div>
        </div>
        <SmBtn icon={<Crosshair size={12} />} tip="عرض" onClick={onFlyTo} />
        <SmBtn icon={editing ? <X size={12} /> : <Edit3 size={12} />} tip={editing ? 'إغلاق' : 'تعديل'} onClick={onEdit} />
        <SmBtn icon={<Trash2 size={12} />} tip="حذف" onClick={onDelete} danger />
      </div>
      {editing && (
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, animation: 'fadeIn 0.2s' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={lblSt}>الاسم</div>
            <input value={name} onChange={e => setName(e.target.value)} onBlur={() => onUpdate({ name })} style={inputSt} />
          </div>
          <div>
            <div style={lblSt}>النوع</div>
            <select value={point.type} onChange={e => onUpdate({ type: e.target.value as Point['type'] })} style={{ ...inputSt, cursor: 'pointer' }}>
              <option value="hospital">مستشفى</option>
              <option value="residential">مربع سكني</option>
              <option value="camp">مخيم</option>
              <option value="shelter">مدرسة إيواء</option>
            </select>
          </div>
          <div>
            <div style={lblSt}>الطلب (لتر)</div>
            <input type="number" value={demand} onChange={e => setDemand(+e.target.value)} onBlur={() => onUpdate({ demand })} style={inputSt} />
          </div>
          <div>
            <div style={lblSt}>السكان</div>
            <input type="number" value={pop} onChange={e => setPop(+e.target.value)} onBlur={() => onUpdate({ population: pop })} style={inputSt} />
          </div>
          <div>
            <div style={lblSt}>الحالة</div>
            <select value={point.status} onChange={e => onUpdate({ status: e.target.value as Point['status'] })} style={{ ...inputSt, cursor: 'pointer' }}>
              <option value="critical">حرج</option>
              <option value="warning">تحذير</option>
              <option value="supplied">مزوّد</option>
            </select>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
          </div>
        </div>
      )}
    </div>
  )
}
