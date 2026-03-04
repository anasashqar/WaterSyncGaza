import { useEffect, useMemo, useRef } from 'react'
import { GeoJSON } from 'react-leaflet'
import { useMapStore } from '@/stores/useMapStore'
import { useDataStore } from '@/stores/useDataStore'
import * as turf from '@turf/turf'
import type L from 'leaflet'

/**
 * NeighborhoodsLayer — طبقة الأحياء
 * تلوين الأحياء بناءً على حالة وصول المياه بعد التوزيع:
 *   🟢 أخضر = جميع النقاط تم تزويدها
 *   🟠 برتقالي = جزء من النقاط تم تزويدها
 *   🔴 أحمر = لم يتم تزويد أي نقطة
 *   🔵 الافتراضي = لا توجد نقاط في هذا الحي أو لم يتم التوزيع بعد
 */

function isPointInFeature(lat: number, lng: number, geometry: any): boolean {
  if (!geometry) return false
  try {
    const pt = turf.point([lng, lat])
    const poly = { type: 'Feature' as const, geometry, properties: {} }
    return turf.booleanPointInPolygon(pt, poly as any)
  } catch {
    return false
  }
}

export function NeighborhoodsLayer() {
  const visible = useMapStore((s) => s.layerVisibility.neigh)
  const features = useMapStore((s) => s.neighFeatures)
  const baseColor = useMapStore((s) => s.layerColors.neigh) || '#0ea5e9'
  const showLabels = useMapStore((s) => s.showLabels)

  const points = useDataStore((s) => s.points)
  const distributionCount = useDataStore((s) => s.distributionCount)
  const geoJsonRef = useRef<L.GeoJSON>(null)

  // Whether distribution has been run at least once
  const hasDistributed = distributionCount > 0

  /**
   * Pre-build bounding boxes for each feature for fast filtering.
   * Then do point-in-polygon only for candidate features.
   */
  const featureBBoxes = useMemo(() => {
    if (!features || features.length === 0) return []
    return features.map((f: any) => {
      try {
        const bbox = turf.bbox({ type: 'Feature', geometry: f.geometry, properties: {} } as any)
        return bbox // [minLng, minLat, maxLng, maxLat]
      } catch {
        return null
      }
    })
  }, [features])

  /**
   * Determine each feature's stats using point-in-polygon.
   * Maps feature index → { total, reached }
   */
  const featureStats = useMemo(() => {
    const statsMap = new Map<number, { total: number; reached: number }>()
    if (!hasDistributed || !features || features.length === 0 || points.length === 0) return statsMap

    for (const point of points) {
      for (let i = 0; i < features.length; i++) {
        const feature = features[i] as any
        if (!feature.geometry) continue

        // Quick bounding box check first
        const bbox = featureBBoxes[i]
        if (bbox) {
          const [minLng, minLat, maxLng, maxLat] = bbox
          if (point.lng < minLng || point.lng > maxLng || point.lat < minLat || point.lat > maxLat) {
            continue // Outside bbox, skip expensive polygon check
          }
        }

        if (isPointInFeature(point.lat, point.lng, feature.geometry)) {
          const existing = statsMap.get(i) || { total: 0, reached: 0 }
          existing.total += 1
          if (point.visitedByTrucks && point.visitedByTrucks.length > 0) {
            existing.reached += 1
          }
          statsMap.set(i, existing)
          break // Each point belongs to one neighborhood only
        }
      }
    }

    return statsMap
  }, [points, features, featureBBoxes, hasDistributed])

  const getFeatureStyle = (_feature: any, isHovered = false, featureIndex?: number) => {
    let fillColor = baseColor
    let color = baseColor
    let fillOpacity = isHovered ? 0.35 : 0.12
    let weight = isHovered ? 3.5 : 2.0

    // Only colorize after distribution
    if (hasDistributed && featureIndex !== undefined && featureStats.has(featureIndex)) {
      const { total, reached } = featureStats.get(featureIndex)!
      if (reached === 0) {
        // 🔴 Red - Not reached at all
        fillColor = '#ef4444'
        color = '#dc2626'
        fillOpacity = isHovered ? 0.50 : 0.30
      } else if (reached < total) {
        // 🟠 Orange - Partially reached
        fillColor = '#f97316'
        color = '#ea580c'
        fillOpacity = isHovered ? 0.50 : 0.30
      } else {
        // 🟢 Green - Fully reached
        fillColor = '#22c55e'
        color = '#16a34a'
        fillOpacity = isHovered ? 0.50 : 0.30
      }
    }

    return { color, fillColor, weight, fillOpacity }
  }

  // Auto‑update styles when stats change without full remount
  useEffect(() => {
    if (!geoJsonRef.current) return
    let idx = 0
    geoJsonRef.current.eachLayer((layer: any) => {
      if (layer.feature) {
        layer.setStyle(getFeatureStyle(layer.feature, false, idx))
      }
      idx++
    })
  }, [featureStats, baseColor, hasDistributed])

  if (!visible || !features || features.length === 0) return null

  // We track the feature index via a closure counter in onEachFeature
  let featureIdx = 0

  return (
    <GeoJSON
      ref={geoJsonRef}
      key={features.length + '-' + String(showLabels) + '-' + distributionCount}
      data={features as any}
      style={(feature) => {
        const idx = features.indexOf(feature as any)
        return getFeatureStyle(feature, false, idx >= 0 ? idx : undefined)
      }}
      onEachFeature={(feature, layer: any) => {
        const currentIdx = featureIdx++

        // Interactivity
        layer.on('mouseover', (e: any) => {
          e.target.setStyle(getFeatureStyle(feature, true, currentIdx))
        })
        layer.on('mouseout', (e: any) => {
          e.target.setStyle(getFeatureStyle(feature, false, currentIdx))
        })

        // Label
        const name = feature.properties.Name_AR || feature.properties.Name || feature.properties.NAME
        if (name && showLabels) {
          layer.bindTooltip(`${name}`, {
            direction: 'center',
            className: 'map-label map-label-neighborhoods',
            permanent: false,
            opacity: 0.9,
            sticky: true,
          })
        }
      }}
    />
  )
}
