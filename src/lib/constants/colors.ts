/**
 * WaterSync — Color Constants
 * ألوان النظام والخريطة
 */

/** Application color palette */
export const COLORS = {
  // Core semantic
  station: '#6B4C9A',
  supplied: '#00875A',
  warning: '#D97706',
  critical: '#C41E3A',

  // GIS Layers
  gov: '#673AB7',
  govBorder: '#D1C4E9',
  govLight: '#B39DDB',
  loc: '#2196F3',
  locLight: '#90CAF9',
  neigh: '#039BE5',
  neighBorder: '#81D4FA',
  neighLight: '#81D4FA',
  street: '#37474F',
  streetLight: '#78909C',

  // Route Colors (high contrast neon)
  route: [
    '#00FFFF', '#FF00FF', '#FFFF00', '#00FF00', '#FF4500',
    '#1E90FF', '#FF1493', '#ADFF2F', '#FFD700', '#7FFF00',
  ],
} as const

/** Unified truck capacity (15,000L) */
export const TRUCK_CAPACITY = 15_000

/** Point type → map marker shape */
export const TYPES: Record<string, string> = {
  hospital: 'diamond',
  residential: 'circle',
  camp: 'triangle',
  shelter: 'square',
}

/** Arabic labels for point types */
export const TYPE_LABELS: Record<string, string> = {
  hospital: 'مستشفى',
  residential: 'مربع سكني',
  camp: 'مخيم',
  shelter: 'مدرسة إيواء',
}

/** Exclusion zone types */
export const ZONE_TYPES = {
  danger: { name: 'منطقة خطرة', color: '#C41E3A', icon: '!' },
} as const

/** Status labels (Arabic) */
export const STATUS_LABELS: Record<string, string> = {
  supplied: 'مزوّد',
  warning: 'تحذير',
  critical: 'حرج',
}

/** Reservation status labels and colors (Plan 3) */
export const RESERVATION_STATUS = {
  available:  { name: 'متاح', color: '#6B7280', icon: '○' },
  reserved:   { name: 'محجوز', color: '#F59E0B', icon: '🔒' },
  in_transit: { name: 'في الطريق', color: '#3B82F6', icon: '🚛' },
  delivered:  { name: 'تم التوصيل', color: '#10B981', icon: '📦' },
  verified:   { name: 'مُؤكّد', color: '#059669', icon: '✅' },
} as const
