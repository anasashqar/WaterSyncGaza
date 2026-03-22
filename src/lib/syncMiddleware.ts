/**
 * WaterSync — Cross-Tab Sync via BroadcastChannel
 * مزامنة الحالة بين النوافذ المفتوحة
 *
 * عند تغيير أي بيانات في نافذة (مثلاً: المؤسسة تحجز نقطة)،
 * يتم بث التحديث فوراً لجميع النوافذ الأخرى.
 *
 * يستخدم debounce بـ 50ms لتجميع التحديثات المتتالية السريعة
 * (مثل setStations ثم setPoints) في بث واحد يحتوي الحالة النهائية.
 */
import type { StoreApi } from 'zustand'

const CHANNEL_NAME = 'watersync-sync'
const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

/** Debounce delay in ms — batches rapid sequential set() calls into one broadcast */
const SYNC_DEBOUNCE_MS = 50

// Keys to sync (data only — no functions)
const SYNC_KEYS = [
  'stations',
  'points',
  'trips',
  'exclusionZones',
  'institutions',
  'distributionCount',
  'deliveries',
] as const

interface SyncPayload {
  type?: 'SYNC' | 'REQUEST_SYNC' | 'SYNC_STATE'
  tabId: string
  state: Record<string, unknown>
  ts: number
}

/**
 * Attach cross-tab synchronization to an existing Zustand store.
 * Call this ONCE after creating the store (e.g. in a top-level module or component).
 */
export function enableCrossTabSync<T extends object>(store: StoreApi<T>): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => {}

  const bc = new BroadcastChannel(CHANNEL_NAME)

  /** True while applying inbound state — suppresses outbound echo */
  let _receiving = false

  /** Debounce timer for outbound broadcasts */
  let _syncTimer: ReturnType<typeof setTimeout> | null = null

  /** Read current state and build a sync payload */
  const buildPayload = (type: SyncPayload['type'] = 'SYNC'): SyncPayload => {
    const currentState = store.getState() as Record<string, unknown>
    const payload: SyncPayload = {
      type,
      tabId: TAB_ID,
      state: {},
      ts: Date.now(),
    }
    for (const key of SYNC_KEYS) {
      if (key in currentState) {
        payload.state[key] = currentState[key]
      }
    }
    return payload
  }

  // ── Outbound: debounced broadcast of local changes ──
  const unsub = store.subscribe(() => {
    if (_receiving) return

    // Clear any pending broadcast and schedule a new one.
    // This ensures rapid sequential calls like setStations() + setPoints()
    // are batched into a single broadcast with the final complete state.
    if (_syncTimer) clearTimeout(_syncTimer)
    _syncTimer = setTimeout(() => {
      _syncTimer = null
      try {
        bc.postMessage(buildPayload('SYNC'))
      } catch {
        // structured clone failure — ignore
      }
    }, SYNC_DEBOUNCE_MS)
  })

  // ── Inbound: receive changes from other tabs ──
  const handler = (event: MessageEvent<SyncPayload>) => {
    const { type, tabId, state: incoming } = event.data
    if (tabId === TAB_ID) return // ignore our own messages

    if (type === 'REQUEST_SYNC') {
      // Another tab opened and is asking for state. Send our current state.
      const currentState = store.getState() as Record<string, unknown>
      // Only reply if we actually have populated data
      if (currentState.points && Array.isArray(currentState.points) && currentState.points.length > 0) {
        try { bc.postMessage(buildPayload('SYNC_STATE')) } catch {}
      }
      return
    }

    if (!incoming) return

    // Apply incoming state while suppressing outbound echo
    _receiving = true
    const patch: Partial<Record<string, unknown>> = {}
    for (const key of SYNC_KEYS) {
      if (key in incoming) {
        patch[key] = incoming[key]
      }
    }
    store.setState(patch as Partial<T>)

    // Reset _receiving after the synchronous subscribe callback has fired.
    // queueMicrotask runs after the current synchronous execution but before
    // any setTimeout(0), ensuring the subscribe callback (which fires
    // synchronously inside setState) sees _receiving = true.
    queueMicrotask(() => { _receiving = false })
  }

  bc.addEventListener('message', handler)

  // ── Ask for state on load ──
  bc.postMessage({ type: 'REQUEST_SYNC', tabId: TAB_ID, state: {}, ts: Date.now() } as SyncPayload)

  // Return cleanup function
  return () => {
    unsub()
    bc.removeEventListener('message', handler)
    bc.close()
    if (_syncTimer) clearTimeout(_syncTimer)
  }
}
