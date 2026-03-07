/**
 * WaterSync — Cross-Tab Sync via BroadcastChannel
 * مزامنة الحالة بين النوافذ المفتوحة
 *
 * عند تغيير أي بيانات في نافذة (مثلاً: المؤسسة تحجز نقطة)،
 * يتم بث التحديث فوراً لجميع النوافذ الأخرى.
 */
import type { StoreApi } from 'zustand'

const CHANNEL_NAME = 'watersync-sync'
const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

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
  let _ignoreNext = false

  // ── Outbound: broadcast local changes ──
  const unsub = store.subscribe((state) => {
    if (_ignoreNext) {
      _ignoreNext = false
      return
    }
    const payload: SyncPayload = {
      type: 'SYNC',
      tabId: TAB_ID,
      state: {},
      ts: Date.now(),
    }
    for (const key of SYNC_KEYS) {
      if (key in (state as Record<string, unknown>)) {
        payload.state[key] = (state as Record<string, unknown>)[key]
      }
    }
    try {
      bc.postMessage(payload)
    } catch {
      // structured clone failure — ignore
    }
  })

  // ── Inbound: receive changes from other tabs ──
  const handler = (event: MessageEvent<SyncPayload>) => {
    const { type, tabId, state: incoming } = event.data
    if (tabId === TAB_ID) return // ignore our own messages

    if (type === 'REQUEST_SYNC') {
      // Another tab opened and is asking for state. Send our current state!
      const currentState = store.getState() as Record<string, unknown>
      // Only send if we actually have populated data (e.g. points loaded)
      if (currentState.points && Array.isArray(currentState.points) && currentState.points.length > 0) {
        const payload: SyncPayload = {
          type: 'SYNC_STATE',
          tabId: TAB_ID,
          state: {},
          ts: Date.now()
        }
        for (const key of SYNC_KEYS) {
          if (key in currentState) payload.state[key] = currentState[key]
        }
        try { bc.postMessage(payload) } catch {}
      }
      return
    }

    if (!incoming) return

    _ignoreNext = true
    const patch: Partial<Record<string, unknown>> = {}
    for (const key of SYNC_KEYS) {
      if (key in incoming) {
        patch[key] = incoming[key]
      }
    }
    store.setState(patch as Partial<T>)
  }

  bc.addEventListener('message', handler)

  // ── Ask for state on load ──
  bc.postMessage({ type: 'REQUEST_SYNC', tabId: TAB_ID, state: {}, ts: Date.now() } as SyncPayload)

  // Return cleanup function
  return () => {
    unsub()
    bc.removeEventListener('message', handler)
    bc.close()
  }
}
