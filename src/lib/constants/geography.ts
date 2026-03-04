/**
 * WaterSync — Geographic Constants
 * حدود قطاع غزة والثوابت الجغرافية
 */

/** Gaza Strip bounding box */
export const GAZA_BOUNDS = {
  north: 31.6,
  south: 31.2,
  west: 34.2,
  east: 34.6,
  center: [31.42, 34.4] as [number, number],
} as const

/** Streets coordinate offset (streets layer only) */
export const STREETS_OFFSET = {
  lat: 0.00043,
  lng: 0.00073,
} as const

/** Zero offset for other layers */
export const NO_OFFSET = {
  lat: 0,
  lng: 0,
} as const

/** Governorate names by ID */
export const GOVERNORATE_NAMES: Record<number, string> = {
  0: 'رفح',
  1: 'خان يونس',
  2: 'دير البلح',
  3: 'شمال غزة',
  4: 'غزة',
}
