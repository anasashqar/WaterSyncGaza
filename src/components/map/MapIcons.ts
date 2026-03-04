/**
 * WaterSync — Map Icon Factory
 * إنشاء أيقونات الخريطة بصيغة SVG
 */
import L from 'leaflet'

/**
 * Create a Leaflet DivIcon with an SVG marker shape.
 * Matches the original app's icon system exactly.
 */
export function createIcon(shape: string, bgColor: string, size?: number): L.DivIcon {
  let svg = ''

  if (shape === 'station') {
    svg = `<svg viewBox="0 0 24 24" fill="${bgColor}" stroke="#ffffff" stroke-width="2">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3" fill="#ffffff" stroke="none"/>
    </svg>`
  } else if (shape === 'diamond' || shape === 'hospital') {
    svg = `<svg viewBox="0 0 24 24" fill="${bgColor}" stroke="#ffffff" stroke-width="1.5">
      <circle cx="12" cy="12" r="11" />
      <path d="M12 7v10 M7 12h10" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
    </svg>`
  } else if (shape === 'triangle' || shape === 'school') {
    svg = `<svg viewBox="0 0 24 24" fill="${bgColor}" stroke="#ffffff" stroke-width="2" stroke-linejoin="round">
      <polygon points="12,3 22,20 2,20" />
    </svg>`
  } else if (shape === 'square' || shape === 'shelter') {
    svg = `<svg viewBox="0 0 24 24" fill="${bgColor}" stroke="#ffffff" stroke-width="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>`
  } else {
    // circle (residential / default)
    svg = `<svg viewBox="0 0 24 24" fill="${bgColor}" stroke="#ffffff" stroke-width="2">
      <circle cx="12" cy="12" r="9" />
    </svg>`
  }

  let finalSize = size || 16
  if (shape === 'station') finalSize = 24

  const shadowFilter = 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))'

  return L.divIcon({
    className: 'minimal-geo-icon',
    html: `<div style="width:${finalSize}px; height:${finalSize}px; filter:${shadowFilter}; transition: transform 0.2s;">${svg}</div>`,
    iconSize: [finalSize, finalSize],
    iconAnchor: [finalSize / 2, finalSize / 2],
    popupAnchor: [0, -finalSize / 2],
  })
}
