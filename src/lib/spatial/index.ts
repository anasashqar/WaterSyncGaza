/**
 * WaterSync — Spatial Utilities
 * أدوات مكانية: point-in-polygon، تحديد المحافظة/الحي
 */
import * as turf from '@turf/turf'
import type { GeoJSONFeature } from '@/types'
import { GOVERNORATE_NAMES } from '@/lib/constants/geography'
import { haversine } from '@/lib/engine/routing'

// ============================================
// Point-In-Polygon
// ============================================

/**
 * Check if point [lat, lng] is inside a GeoJSON Feature geometry.
 * Uses turf.booleanPointInPolygon for reliable results.
 */
export function pointInGeoJSONGeometry(
  lat: number,
  lng: number,
  geometry: GeoJSONFeature['geometry']
): boolean {
  if (!geometry) return false
  try {
    const pt = turf.point([lng, lat]) // turf uses [lng, lat]
    const poly = { type: 'Feature' as const, geometry, properties: {} }
    return turf.booleanPointInPolygon(pt, poly as any)
  } catch {
    return false
  }
}

// ============================================
// Feature Name Extraction
// ============================================

/** Get the Arabic name from a GeoJSON feature's properties */
export function getFeatureName(
  feature: GeoJSONFeature,
  fileType: 'governorates' | 'neighborhoods'
): string | null {
  const props = feature?.properties
  if (!props) return null
  let name = (props.Name_AR || props.Name || props.NAME || null) as string | null
  if (!name && fileType === 'governorates' && props.id !== undefined) {
    name = GOVERNORATE_NAMES[props.id as number] || null
  }
  return name
}

// ============================================
// Polygon Lookup (Governorate / Neighborhood)
// ============================================

export interface PolygonLookupOptions {
  fileType: 'governorates' | 'neighborhoods'
  features: GeoJSONFeature[]
  lat: number
  lng: number
}

/**
 * Find which polygon contains a given point.
 * Phase 1: True point-in-polygon via turf.
 * Phase 2: Nearest polygon fallback within threshold.
 */
export function findPolygonContaining(options: PolygonLookupOptions): string | null {
  const { fileType, features, lat, lng } = options

  // Phase 1: True Point-in-Polygon
  for (const feature of features) {
    if (pointInGeoJSONGeometry(lat, lng, feature.geometry)) {
      const name = getFeatureName(feature, fileType)
      if (name) return name
    }
  }

  // Phase 2: Nearest polygon fallback
  const FALLBACK_THRESHOLD_KM = fileType === 'governorates' ? 0.5 : 0.3
  let nearestName: string | null = null
  let nearestDist = Infinity

  for (const feature of features) {
    let minDistToPolygon = Infinity

    // Check distance to polygon edge vertices
    const geom = feature.geometry
    if (geom) {
      const rings: number[][][] =
        geom.type === 'Polygon'
          ? [(geom.coordinates as number[][][])[0]]
          : geom.type === 'MultiPolygon'
            ? (geom.coordinates as number[][][][]).map((p) => p[0])
            : []

      for (const ring of rings) {
        for (let i = 0; i < ring.length; i += 3) {
          const d = haversine(lat, lng, ring[i][1], ring[i][0])
          if (d < minDistToPolygon) minDistToPolygon = d
        }
      }
    }

    if (minDistToPolygon < nearestDist) {
      nearestDist = minDistToPolygon
      nearestName = getFeatureName(feature, fileType)
    }
  }

  if (nearestDist <= FALLBACK_THRESHOLD_KM && nearestName) {
    return nearestName
  }

  return null
}

/**
 * Create a governorate lookup function given loaded GeoJSON features.
 */
export function createGovernorateLookup(features: GeoJSONFeature[]) {
  return (lat: number, lng: number): string | null => {
    return findPolygonContaining({ fileType: 'governorates', features, lat, lng })
  }
}

/**
 * Create a neighborhood lookup function given loaded GeoJSON features.
 */
export function createNeighborhoodLookup(features: GeoJSONFeature[]) {
  return (lat: number, lng: number): string | null => {
    return findPolygonContaining({ fileType: 'neighborhoods', features, lat, lng })
  }
}
