/**
 * WaterSync — Map Store (Zustand)
 * حالة الخريطة: مرجع الخريطة، الرسم البياني، وضع التفاعل
 */
import { create } from 'zustand'
import type L from 'leaflet'
import type { RoutingGraph, MapMode, GeoJSONData, GeoJSONFeature } from '@/types'
import { buildRoutingGraph } from '@/lib/engine/routing'
import { createGovernorateLookup, createNeighborhoodLookup } from '@/lib/spatial'

interface MapState {
  // Core map reference
  map: L.Map | null
  setMap: (map: L.Map) => void

  // Routing graph (built from streets GeoJSON)
  graph: RoutingGraph | null
  buildGraph: (streetsGeoJSON: GeoJSONData) => void

  // GeoJSON data (for spatial lookups)
  govFeatures: GeoJSONFeature[]
  neighFeatures: GeoJSONFeature[]
  streetsGeoJSON?: GeoJSONData
  setGovFeatures: (features: GeoJSONFeature[]) => void
  setNeighFeatures: (features: GeoJSONFeature[]) => void

  // Spatial lookups (created from features)
  findGovernorate: (lat: number, lng: number) => string | null
  findNeighborhood: (lat: number, lng: number) => string | null

  // Interaction mode
  mode: MapMode
  setMode: (mode: MapMode) => void

  // Editor mode (persistent - doesn't reset after click)
  editorMode: boolean
  setEditorMode: (on: boolean) => void

  zoneRadius: number
  setZoneRadius: (radius: number) => void

  // Simulation state
  activeSimulation: { intervalId: number; tripId: string } | null
  setActiveSimulation: (sim: { intervalId: number; tripId: string } | null) => void

  // Navigation
  flyTo: (lat: number, lng: number, zoom?: number) => void

  // Layer visibility & colors
  layerVisibility: Record<string, boolean>
  toggleLayerVisibility: (layerKey: string) => void
  setLayerVisibility: (layerKey: string, visible: boolean) => void

  showLabels: boolean
  setShowLabels: (show: boolean) => void

  baseMapSource: 'online' | 'offline'
  setBaseMapSource: (source: 'online' | 'offline') => void

  layerColors: Record<string, string>
  setLayerColor: (layerKey: string, color: string) => void
}

export const useMapStore = create<MapState>((set, get) => ({
  map: null,
  setMap: (map) => set({ map }),

  graph: null,
  buildGraph: (streetsGeoJSON) => {
    const graph = buildRoutingGraph(streetsGeoJSON)
    set({ graph })
    console.log(`[OK] تم بناء الرسم البياني: ${graph.list.length} عقدة`)
  },

  govFeatures: [],
  neighFeatures: [],
  setGovFeatures: (features) => {
    const lookup = createGovernorateLookup(features)
    set({ govFeatures: features, findGovernorate: lookup })
  },
  setNeighFeatures: (features) => {
    const lookup = createNeighborhoodLookup(features)
    set({ neighFeatures: features, findNeighborhood: lookup })
  },

  findGovernorate: () => null,
  findNeighborhood: () => null,

  mode: null,
  setMode: (mode) => set({ mode }),

  editorMode: false,
  setEditorMode: (on) => set({ editorMode: on, mode: on ? null : null }),

  zoneRadius: 300,
  setZoneRadius: (radius) => set({ zoneRadius: radius }),

  activeSimulation: null,
  setActiveSimulation: (sim) => set({ activeSimulation: sim }),

  flyTo: (lat, lng, zoom = 15) => {
    const map = get().map
    if (map) map.flyTo([lat, lng], zoom, { duration: 0.8 })
  },

  layerVisibility: {
    baseMap: true,
    gov: true,
    neigh: true,
    streets: false,
    stations: true,
    points: true,
    routes: true,
    exclusionZones: true,
  },
  toggleLayerVisibility: (layerKey) =>
    set((s) => ({
      layerVisibility: {
        ...s.layerVisibility,
        [layerKey]: !s.layerVisibility[layerKey],
      },
    })),
  setLayerVisibility: (layerKey, visible) =>
    set((s) => ({
      layerVisibility: { ...s.layerVisibility, [layerKey]: visible },
    })),

  showLabels: false,
  setShowLabels: (show) => set({ showLabels: show }),

  layerColors: {
    gov: '#6b21a8',     // Purple
    neigh: '#0ea5e9',   // Blue
    streets: '#334155', // Slate
    stations: '#7e22ce',// Purple Custom
    points: '#e11d48',  // Rose
    routes: '#16a34a',  // Green
    exclusionZones: '#fbbf24', // Amber
  },
  setLayerColor: (layerKey, color) =>
    set((s) => ({
      layerColors: { ...s.layerColors, [layerKey]: color },
    })),

  baseMapSource: 'offline',
  setBaseMapSource: (source) => set({ baseMapSource: source }),
}))
