/**
 * WaterSync — Editor Store (Zustand)
 * حالة محرر الطبقات
 */
import { create } from 'zustand'
import type { DiscoveredPOI } from '@/types'

interface EditorState {
  // Edit mode
  isActive: boolean
  isDirty: boolean
  enterEditMode: () => void
  exitEditMode: () => void
  markDirty: () => void

  // POI Discovery
  poiScope: 'gaza' | 'viewport'
  discoveredPOIs: DiscoveredPOI[]
  setPoiScope: (scope: 'gaza' | 'viewport') => void
  setDiscoveredPOIs: (pois: DiscoveredPOI[]) => void
  togglePOISelection: (osmId: number) => void
  clearDiscoveredPOIs: () => void

  // Geocode suggestion
  geocodeSuggestion: { lat: number; lng: number } | null
  setGeocodeSuggestion: (suggestion: { lat: number; lng: number } | null) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  isActive: false,
  isDirty: false,
  enterEditMode: () => set({ isActive: true, isDirty: false }),
  exitEditMode: () => set({ isActive: false }),
  markDirty: () => set({ isDirty: true }),

  poiScope: 'gaza',
  discoveredPOIs: [],
  setPoiScope: (scope) => set({ poiScope: scope }),
  setDiscoveredPOIs: (pois) => set({ discoveredPOIs: pois }),
  togglePOISelection: (osmId) =>
    set((s) => ({
      discoveredPOIs: s.discoveredPOIs.map((p) =>
        p.osmId === osmId ? { ...p, selected: !p.selected } : p
      ),
    })),
  clearDiscoveredPOIs: () => set({ discoveredPOIs: [] }),

  geocodeSuggestion: null,
  setGeocodeSuggestion: (suggestion) => set({ geocodeSuggestion: suggestion }),
}))
