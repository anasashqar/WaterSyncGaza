import type { StateCreator } from 'zustand'
import type { DataState, SyncState } from './types'

export const createSyncSlice: StateCreator<DataState, [], [], SyncState> = (set) => ({
  deliveries: [],

  
  addDelivery: (delivery) => {
    set((s) => ({ deliveries: [...s.deliveries, delivery] }))
    // Persist to IndexedDB in the background
    import('@/stores/useDatabaseStore').then(({ useDatabaseStore }) => {
      useDatabaseStore.getState().saveDelivery(delivery)
    })
  },

  updateDelivery: (id, updates) =>
    set((s) => ({
      deliveries: s.deliveries.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),

  syncPendingDeliveries: async () => {
    if (!navigator.onLine) return

    set((s) => {
      const pending = s.deliveries.filter(d => d.pendingSync)
      if (pending.length === 0) return s

      // Simulate sending to backend
      console.log(`[Sync Worker] Syncing ${pending.length} pending deliveries to server...`)

      // Update state: Mark all as synced
      const syncedDeliveries = s.deliveries.map(d => 
        d.pendingSync ? { ...d, pendingSync: false } : d
      )

      // Update IDB asynchronously
      import('@/stores/useDatabaseStore').then(({ useDatabaseStore }) => {
        pending.forEach(d => {
           useDatabaseStore.getState().saveDelivery({ ...d, pendingSync: false })
        })
      })

      // Optionally show a global Toast
      import('@/stores/useUIStore').then(({ useUIStore }) => {
         useUIStore.getState().addNotification(`تمت مزامنة ${pending.length} عمليات تسليم بنجاح!`, 'success')
      })

      return { deliveries: syncedDeliveries }
    })
  }
})
