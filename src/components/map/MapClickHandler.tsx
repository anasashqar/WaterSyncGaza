/**
 * WaterSync — Map Click Handler
 * معالج النقر على الخريطة لإضافة محطات/نقاط/مناطق
 */
import { useState, useEffect } from 'react'
import { useMapEvents } from 'react-leaflet'
import { Rectangle } from 'react-leaflet'
import L from 'leaflet'
import { useMapStore } from '@/stores/useMapStore'
import { useDataStore } from '@/stores/useDataStore'
import { useUIStore } from '@/stores/useUIStore'
import { TRUCK_CAPACITY } from '@/lib/constants/colors'
import { isInExclusionZone } from '@/lib/engine/routing'

export function MapClickHandler() {
  const mode = useMapStore((s) => s.mode)
  const setMode = useMapStore((s) => s.setMode)
  const findGovernorate = useMapStore((s) => s.findGovernorate)
  const findNeighborhood = useMapStore((s) => s.findNeighborhood)
  const exclusionZones = useDataStore((s) => s.exclusionZones)
  const stations = useDataStore((s) => s.stations)
  const points = useDataStore((s) => s.points)
  const addStation = useDataStore((s) => s.addStation)
  const addPoint = useDataStore((s) => s.addPoint)
  const addExclusionZone = useDataStore((s) => s.addExclusionZone)
  const addNotification = useUIStore((s) => s.addNotification)
  const setActivePanel = useUIStore((s) => s.setActivePanel)
  
  const mapStore = useMapStore()

  const [drawStart, setDrawStart] = useState<L.LatLng | null>(null)
  const [drawCurrent, setDrawCurrent] = useState<L.LatLng | null>(null)

  useEffect(() => {
    const map = mapStore.map
    if (!map) return
    if (mode === 'zone_rect') {
      map.dragging.disable()
      map.getContainer().style.cursor = 'crosshair'
    } else {
      map.dragging.enable()
      map.getContainer().style.cursor = ''
      setDrawStart(null)
      setDrawCurrent(null)
    }
  }, [mode, mapStore.map])

  useMapEvents({
    mousedown(e) {
      if (mode === 'zone_rect') {
        setDrawStart(e.latlng)
        setDrawCurrent(e.latlng)
      }
    },
    mousemove(e) {
      if (mode === 'zone_rect' && drawStart) {
        setDrawCurrent(e.latlng)
      }
    },
    mouseup(e) {
      if (mode === 'zone_rect' && drawStart && drawCurrent) {
        if (drawStart.distanceTo(e.latlng) > 10) { // Min size to avoid accidental clicks
          const bounds = L.latLngBounds(drawStart, e.latlng)
          const zone = {
            id: `zone_${Date.now()}`,
            name: `مساحة خطرة ${exclusionZones.length + 1}`,
            type: 'danger',
            lat: bounds.getCenter().lat,
            lng: bounds.getCenter().lng,
            active: true,
            shape: 'rectangle' as const,
            bounds: [
              [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
              [bounds.getNorthEast().lat, bounds.getNorthEast().lng]
            ] as [[number, number], [number, number]]
          }
          addExclusionZone(zone)
          useMapStore.getState().setLayerVisibility('exclusionZones', true)
          addNotification(`تمت إضافة منطقة استبعاد جديدة`, 'success')
          setActivePanel('constraints')
        }
        setDrawStart(null)
        setDrawCurrent(null)
        const editorMode = useMapStore.getState().editorMode
        if (!editorMode) setMode(null)
      }
    },
    click(e) {
      if (!mode || mode === 'zone_rect') return
      
      const { lat, lng } = e.latlng
      const gov = findGovernorate(lat, lng) || 'غير محدد'
      const neigh = findNeighborhood(lat, lng) || 'غير محدد'

      if (mode === 'station') {
        const station = {
          id: `stn_${Date.now()}`,
          name: `محطة ${stations.length + 1}`,
          lat,
          lng,
          governorate: gov,
          neighborhood: neigh,
          dailyCapacity: 0,
          usedCapacity: 0,
          remainingCapacity: 0,
          institutions: [],
          trucks: 0,
        }
        addStation(station)
        addNotification(`تمت إضافة "${station.name}" في ${gov}`, 'success')
        setActivePanel('supply')
      } else if (mode === 'point') {
        const point = {
          id: `pt_${Date.now()}`,
          name: `نقطة ${points.length + 1}`,
          type: 'residential' as const,
          lat,
          lng,
          governorate: gov,
          neighborhood: neigh,
          population: 0,
          demand: TRUCK_CAPACITY,
          capacity: TRUCK_CAPACITY,
          currentFill: 0,
          remainingCapacity: TRUCK_CAPACITY,
          totalReceived: 0,
          status: 'critical' as const,
          lastSupply: null,
          stationId: null,
          visitedByTrucks: [],
          missedCount: 0,
          // Reservation defaults (Plan 3)
          reservedBy: null,
          reservedAt: null,
          reservedUntil: null,
          reservationStatus: 'available' as const,
        }

        const inZone = isInExclusionZone(exclusionZones, lat, lng)
        if (inZone) {
          addNotification(`هذه النقطة تقع ضمن ${inZone.name} (استبعاد)`, 'warning')
        }

        addPoint(point)
        addNotification(`تمت إضافة "${point.name}" في ${gov}`, 'success')
        setActivePanel('demand')
      } else if (mode === 'zone_street') {
        addNotification('يرجى النقر على الشارع المحدد ليتم إغلاقه', 'info')
      }

      const editorMode = useMapStore.getState().editorMode
      if (!editorMode) setMode(null)
    },
  })

  return drawStart && drawCurrent ? (
    <Rectangle bounds={[[drawStart.lat, drawStart.lng], [drawCurrent.lat, drawCurrent.lng]]} pathOptions={{ color: '#ef4444', weight: 2, dashArray: '5, 5', fillOpacity: 0.15 }} />
  ) : null
}
