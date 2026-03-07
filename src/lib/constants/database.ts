/**
 * WaterSync — Database Constants
 * ثوابت قاعدة البيانات
 */

export const DB_NAME = 'WaterSyncDB'
export const DB_VERSION = 2

export const STORES = {
  stations: 'stations',
  points: 'points',
  trips: 'trips',
  zones: 'exclusionZones',
  executions: 'executions',
  history: 'history',
  deliveries: 'deliveries',
} as const
