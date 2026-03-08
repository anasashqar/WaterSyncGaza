import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import { GAZA_BOUNDS } from '@/lib/constants/geography'
import { useUIStore } from '@/stores/useUIStore'
import { useDatabaseStore } from '@/stores/useDatabaseStore'
import { useDataStore } from '@/stores/useDataStore'
import { useMapStore } from '@/stores/useMapStore'
import { MapSetup, MapClickHandler, StationsLayer, PointsLayer, RoutesLayer, ExclusionZonesLayer, GovernoratesLayer, NeighborhoodsLayer, StreetsLayer, BufferZoneLayer, SpatialAnalysisControls, SimulationLayer } from '@/components/map'
import { AppToolbar } from '@/components/toolbar'
import { Sidebar } from '@/components/sidebar'
import { ToastContainer, SimulationPanel } from '@/components/ui'
import { DashboardView, ReportsView } from '@/components/reports'
import { DriverFieldView } from '@/components/driver'
import { LayerEditorPanel } from '@/components/editor'
import { NotificationRulesEngine } from '@/services/NotificationRulesEngine'
import { useAuthStore } from '@/stores/useAuthStore'
import { NGOContractManager } from '@/components/onboarding/NGOContractManager'
import { LoginScreen } from '@/components/auth/LoginScreen'

/** Current full-screen view overlay (removed for router) */
// type AppView = 'map' | 'dashboard' | 'reports' | 'driver'

/**
 * WaterSync — نظام إدارة توزيع المياه الذكي
 * Root — Two-row header + Map + Sidebar layout (matching original)
 */
function App() {
  const theme = useUIStore((s) => s.theme)
  const initDB = useDatabaseStore((s) => s.initialize)
  const navigate = useNavigate()
  const location = useLocation()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorInitialTab, setEditorInitialTab] = useState<'tools' | 'stations' | 'points'>('tools')
  const baseMapVisible = useMapStore((s) => s.layerVisibility.baseMap)
  const baseMapSource = useMapStore((s) => s.baseMapSource)

  const role = useAuthStore((s) => s.role)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const ngoSetupComplete = useAuthStore((s) => s.ngoSetupComplete)
  const contractManagerOpen = useAuthStore((s) => s.contractManagerOpen)
  const institutionId = useAuthStore((s) => s.institutionId)
  const institutions = useDataStore((s) => s.institutions)
  const isAdmin = role === 'admin'
  const isNGO = role === 'ngo'
  const isDriver = role === 'driver'
  
  // Check if NGO has existing contracts
  const ngoHasContracts = isNGO && institutionId ? institutions.some(i => i.id === institutionId) : false
  // Show initial setup only when NGO has no contracts AND setup flag is not set
  const showInitialSetup = isNGO && !ngoSetupComplete && !ngoHasContracts

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

  // ──── Keyboard Shortcuts (role-gated) ────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            if (!isAdmin) break
            e.preventDefault()
            navigate(location.pathname === '/dashboard' ? '/' : '/dashboard')
            break
          case 'r':
            if (!isAdmin || !e.shiftKey) break
            e.preventDefault()
            navigate(location.pathname === '/reports' ? '/' : '/reports')
            break
           case 'e':
            if (!isAdmin) break
            e.preventDefault()
            setEditorOpen(v => !v)
            if (!editorOpen) setEditorInitialTab('tools')
            break
          case 'f':
            e.preventDefault()
            if (isDriver) {
              navigate(location.pathname === '/driver' ? '/' : '/driver')
            }
            break
        }
      }
      if (e.key === 'Escape') {
        navigate('/')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [editorOpen, isAdmin, isDriver, navigate, location.pathname])



  // Show role selection screen on first launch
  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Row 1: App Header + Row 2: Toolbar */}
      <AppToolbar
        onOpenDashboard={() => navigate('/dashboard')}
        onOpenReports={() => navigate('/reports')}
        onOpenEditor={() => setEditorOpen(v => !v)}
        onOpenDriver={() => navigate('/driver')}
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
            {isAdmin && <MapClickHandler />}
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
            {isAdmin && <ExclusionZonesLayer />}
            <SimulationLayer />
            {isAdmin && <SpatialAnalysisControls />}
          </MapContainer>

          {/* Editor Panel (admin only) */}
          {isAdmin && editorOpen && <LayerEditorPanel onClose={() => setEditorOpen(false)} initialTab={editorInitialTab} />}

          {/* Simulation controls */}
          <SimulationPanel />
        </div>

        {/* Sidebar */}
        <Sidebar />
      </div>

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Full-screen Overlays routed by React Router */}
      <Routes>
        <Route path="/dashboard" element={isAdmin ? <DashboardView onClose={() => navigate('/')} /> : null} />
        <Route path="/reports" element={(isAdmin || isNGO) ? <ReportsView onClose={() => navigate('/')} /> : null} />
        <Route path="/driver" element={isDriver ? <DriverFieldView onClose={() => navigate('/')} /> : null} />
      </Routes>

      {/* NGO Contract Manager — Initial Setup (first time only, when no contracts exist) */}
      {showInitialSetup && (
        <NGOContractManager
          isInitialSetup
          onClose={() => useAuthStore.getState().completeNGOSetup()}
        />
      )}

      {/* NGO Contract Manager — On-demand editing */}
      {isNGO && contractManagerOpen && !showInitialSetup && (
        <NGOContractManager
          onClose={() => useAuthStore.getState().closeContractManager()}
        />
      )}
    </div>
  )
}

export default App
