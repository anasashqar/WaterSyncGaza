/**
 * WaterSync — Database Store (Zustand)
 * حالة قاعدة البيانات: حفظ واسترجاع
 */
import { create } from 'zustand'
import { initDatabase, dbAdd, dbGetAll, dbClear } from '@/lib/database'
import { STORES } from '@/lib/constants/database'
import type { Station, Point, ExclusionZone, DeliveryRecord } from '@/types'

interface DatabaseState {
  isReady: boolean
  isLoading: boolean
  error: string | null

  initialize: () => Promise<void>

  saveAllData: (
    stations: Station[],
    points: Point[],
    zones: ExclusionZone[]
  ) => Promise<boolean>

  loadAllData: () => Promise<{
    stations: Station[]
    points: Point[]
    zones: ExclusionZone[]
  } | null>

  clearAllData: () => Promise<void>

  saveDelivery: (delivery: DeliveryRecord) => Promise<void>
  loadDeliveries: () => Promise<DeliveryRecord[]>

  exportToJSON: (
    stations: Station[],
    points: Point[],
    zones: ExclusionZone[]
  ) => void
}

export const useDatabaseStore = create<DatabaseState>((set) => ({
  isReady: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null })
      await initDatabase()
      set({ isReady: true, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },

  saveAllData: async (stations, points, zones) => {
    try {
      set({ isLoading: true })

      for (const station of stations) {
        const data = { ...station } as Record<string, unknown>
        delete data.marker
        delete data.latlng
        await dbAdd(STORES.stations, data)
      }

      for (const point of points) {
        const data = { ...point } as Record<string, unknown>
        delete data.marker
        delete data.latlng
        if (data.lastSupply instanceof Date) {
          data.lastSupply = (data.lastSupply as Date).toISOString()
        }
        await dbAdd(STORES.points, data)
      }

      for (const zone of zones) {
        const data = { ...zone } as Record<string, unknown>
        delete data.circle
        await dbAdd(STORES.zones, data)
      }

      set({ isLoading: false })
      return true
    } catch (err) {
      console.error('خطأ في الحفظ:', err)
      set({ isLoading: false, error: (err as Error).message })
      return false
    }
  },

  loadAllData: async () => {
    try {
      set({ isLoading: true })

      const stations = await dbGetAll<Station>(STORES.stations)
      const points = await dbGetAll<Point>(STORES.points)
      const zones = await dbGetAll<ExclusionZone>(STORES.zones)

      // Restore Date objects
      points.forEach((p) => {
        if (p.lastSupply) p.lastSupply = new Date(p.lastSupply as string)
      })

      set({ isLoading: false })
      return { stations, points, zones }
    } catch (err) {
      console.error('خطأ في التحميل:', err)
      set({ isLoading: false, error: (err as Error).message })
      return null
    }
  },

  clearAllData: async () => {
    try {
      await dbClear(STORES.stations)
      await dbClear(STORES.points)
      await dbClear(STORES.zones)
      await dbClear(STORES.executions)
      await dbClear(STORES.deliveries)
    } catch (err) {
      console.error('خطأ في الحذف:', err)
    }
  },

  saveDelivery: async (delivery) => {
    try {
      await dbAdd(STORES.deliveries, delivery)
    } catch (err) {
      console.error('خطأ في حفظ سجل التسليم:', err)
    }
  },

  loadDeliveries: async () => {
    try {
      return await dbGetAll<DeliveryRecord>(STORES.deliveries)
    } catch (err) {
      console.error('خطأ في تحميل سجلات التسليم:', err)
      return []
    }
  },

  exportToJSON: (stations, points, zones) => {
    const clean = (obj: Record<string, unknown>, ...keys: string[]) => {
      const c = { ...obj }
      keys.forEach((k) => delete c[k])
      return c
    }

    const data = {
      exportDate: new Date().toISOString(),
      stations: stations.map((s) => clean(s as unknown as Record<string, unknown>, 'marker', 'latlng')),
      points: points.map((p) => {
        const c = clean(p as unknown as Record<string, unknown>, 'marker', 'latlng')
        if (c.lastSupply instanceof Date) c.lastSupply = (c.lastSupply as Date).toISOString()
        return c
      }),
      exclusionZones: zones.map((z) => clean(z as unknown as Record<string, unknown>, 'circle')),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `watersync_backup_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  },
}))
