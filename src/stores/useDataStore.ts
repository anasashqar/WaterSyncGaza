import { create } from 'zustand'
import { enableCrossTabSync } from '@/lib/syncMiddleware'
import type { DataState, ReservationResult } from './data/types'
import { createCoreSlice } from './data/coreSlice'
import { createReservationSlice } from './data/reservationSlice'
import { createSyncSlice } from './data/syncSlice'

// Re-export nested types for backward compatibility
export type { DataState, ReservationResult }

export const useDataStore = create<DataState>((...a) => ({
  ...createCoreSlice(...a),
  ...createReservationSlice(...a),
  ...createSyncSlice(...a),
}))

// ── Background Sync Listener ──
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
     console.log('[Network] Reconnected! Triggering Background Sync...')
     useDataStore.getState().syncPendingDeliveries()
  })
}

// ── Enable Cross-Tab Sync for multi-window testing ──
enableCrossTabSync(useDataStore)
