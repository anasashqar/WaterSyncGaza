import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import { GAZA_BOUNDS } from '@/lib/constants/geography'
import { useUIStore } from '@/stores/useUIStore'
import { useDatabaseStore } from '@/stores/useDatabaseStore'
import { useMapStore } from '@/stores/useMapStore'
import { MapSetup, MapClickHandler, StationsLayer, PointsLayer, RoutesLayer, ExclusionZonesLayer, GovernoratesLayer, NeighborhoodsLayer, StreetsLayer, BufferZoneLayer, SpatialAnalysisControls, SimulationLayer } from '@/components/map'
import { AppToolbar } from '@/components/toolbar'
import { Sidebar } from '@/components/sidebar'
import { ToastContainer, NotificationTester, SimulationPanel } from '@/components/ui'
import { DashboardView, ReportsView } from '@/components/reports'
import { LayerEditorPanel } from '@/components/editor'
import { NotificationRulesEngine } from '@/services/NotificationRulesEngine'

/** Current full-screen view overlay */
type AppView = 'map' | 'dashboard' | 'reports'

/**
 * WaterSync — نظام إدارة توزيع المياه الذكي
 * Root — Two-row header + Map + Sidebar layout (matching original)
 */
function App() {
  const theme = useUIStore((s) => s.theme)
  const initDB = useDatabaseStore((s) => s.initialize)
  const [view, setView] = useState<AppView>('map')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorInitialTab, setEditorInitialTab] = useState<'tools' | 'stations' | 'points'>('tools')
  const baseMapVisible = useMapStore((s) => s.layerVisibility.baseMap)
  const baseMapSource = useMapStore((s) => s.baseMapSource)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    initDB()
    
    // Load initial data
    import('@/services/DataLoaderService').then(({ DataLoaderService }) => {
      DataLoaderService.loadMainData()
    })

    // Start Notification Rules Engine
    NotificationRulesEngine.start()
    
    return () => {
      NotificationRulesEngine.stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ──── Keyboard Shortcuts ────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Ignore if user is typing in input/textarea
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault()
            setView((v) => (v === 'dashboard' ? 'map' : 'dashboard'))
            break
          case 'r':
            // Don't hijack browser refresh
            if (!e.shiftKey) break
            e.preventDefault()
            setView((v) => (v === 'reports' ? 'map' : 'reports'))
            break
           case 'e':
            e.preventDefault()
            setEditorOpen(v => !v)
            if (!editorOpen) setEditorInitialTab('tools')
            break
        }
      }
      if (e.key === 'Escape') {
        setView('map')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [editorOpen])

  // ──── Open Editor with context sync ────
  const openEditorWithTab = (tab?: 'stations' | 'points') => {
    setEditorInitialTab(tab || 'tools')
    setEditorOpen(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Row 1: App Header + Row 2: Toolbar */}
      <AppToolbar
        onOpenDashboard={() => setView('dashboard')}
        onOpenReports={() => setView('reports')}
        onOpenEditor={() => setEditorOpen(v => !v)}
      />

      {/* Main content: Map + Sidebar — calc(100vh - 56px header - 52px toolbar) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Map */}
        <div style={{ flex: 1, position: 'relative', minWidth: 400, background: 'var(--bg-dark)' }}>
          <MapContainer
            center={GAZA_BOUNDS.center as [number, number]}
            zoom={12}
            minZoom={10}
            maxZoom={16}
            zoomControl={false}
            attributionControl={false}
            maxBounds={[
              [GAZA_BOUNDS.south - 0.04, GAZA_BOUNDS.west - 0.04],
              [GAZA_BOUNDS.north + 0.04, GAZA_BOUNDS.east + 0.04],
            ]}
            maxBoundsViscosity={1.0}
            style={{ width: '100%', height: '100%' }}
          >
            <MapSetup />
            <MapClickHandler />
            <ZoomControl position="topleft" />

            {baseMapVisible && (
              <TileLayer
                url={baseMapSource === 'offline' 
                  ? "/tiles/osm/{z}/{x}/{y}.webp" 
                  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                maxZoom={16} minZoom={10}
                errorTileUrl="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
            )}

            <BufferZoneLayer />
            <GovernoratesLayer />
            <NeighborhoodsLayer />
            <StreetsLayer />
            <StationsLayer />
            <PointsLayer />
            <RoutesLayer />
            <ExclusionZonesLayer />
            <SimulationLayer />
            <SpatialAnalysisControls />
          </MapContainer>

          {/* Editor Panel (floats on top of map) */}
          {editorOpen && <LayerEditorPanel onClose={() => setEditorOpen(false)} initialTab={editorInitialTab} />}

          {/* Simulation controls (floats on map) */}
          <SimulationPanel />
        </div>

        {/* Sidebar */}
        <Sidebar onOpenEditor={openEditorWithTab} />
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
      <NotificationTester />

      {/* Full-screen Overlays */}
      {view === 'dashboard' && <DashboardView onClose={() => setView('map')} />}
      {view === 'reports' && <ReportsView onClose={() => setView('map')} />}
    </div>
  )
}

export default App
