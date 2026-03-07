/**
 * WaterSync — Routes Layer
 * طبقة مسارات الرحلات
 */
import React from 'react'
import { Polyline, Tooltip } from 'react-leaflet'
import { useDataStore } from '@/stores/useDataStore'
import { useMapStore } from '@/stores/useMapStore'

export function RoutesLayer() {
  const trips = useDataStore((s) => s.trips)
  const visible = useMapStore((s) => s.layerVisibility.routes)

  if (!visible || trips.length === 0) return null

  return (
    <>
      {trips.map((tripData) => {
        const trip = tripData as any; // Cast to access MDCVRPTrip fields
        if (!trip.path || trip.path.length === 0) return null

        // Path is stored as [lng, lat] pairs — convert to [lat, lng] for Leaflet
        const positions = trip.path.map((coord: any) => [coord[1], coord[0]] as [number, number])
        
        // Use institution color, fallback to neon cyan
        const routeColor = trip.color || trip.institution?.color || '#00FFFF'

        return (
          <React.Fragment key={trip.id}>
            {/* Outer Glow / Shadow Line */}
            <Polyline
              positions={positions}
              pathOptions={{
                color: routeColor,
                weight: 10,
                opacity: 0.25,
                lineCap: 'round',
                lineJoin: 'round',
                className: 'route-glow-anim',
              }}
            />
            {/* Main Core Line */}
            <Polyline
              positions={positions}
              pathOptions={{
                color: routeColor,
                weight: 3.5,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            >
              <Tooltip sticky direction="top" className="route-tooltip-custom">
                <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'var(--font-sans)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: routeColor, marginBottom: 4 }}>
                    {trip.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>
                    <b>المؤسسة:</b> {trip.institution?.name || 'غير محدد'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <b>رقم الرحلة:</b> {trip.tripNumber} | <b>الشاحنة:</b> المخصصة رقم {trip.truckNumber}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <b>الحمولة:</b> {(trip.demand || 0).toLocaleString()} لتر
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <b>المسافة:</b> {(trip.distance || 0).toFixed(1)} كم
                  </div>
                </div>
              </Tooltip>
            </Polyline>
          </React.Fragment>
        )
      })}
    </>
  )
}
