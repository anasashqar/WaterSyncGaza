// Types of System Events
export type SystemEventTypes =
  | 'WATER_DELIVERED'
  | 'STATION_DEPLETED'
  | 'EMERGENCY_REROUTE'
  | 'BATCH_APPROVED'
  | 'DAILY_REPORT_GEN'
  | 'RESERVATION_CONFLICT'
  | 'POINT_RESERVED'

export interface SystemEventPayload {
  id: string
  type: SystemEventTypes
  timestamp: number
  data: any // The specific payload associated with the event
  importance: 'low' | 'medium' | 'high' | 'critical'
}

type EventCallback = (event: SystemEventPayload) => void

class EventBusService {
  private listeners: Map<string, EventCallback[]> = new Map()

  // Subscribe to all events or specific events
  subscribe(callback: EventCallback, eventType?: SystemEventTypes) {
    const key = eventType || 'ALL'
    if (!this.listeners.has(key)) {
      this.listeners.set(key, [])
    }
    this.listeners.get(key)!.push(callback)

    return () => this.unsubscribe(callback, eventType)
  }

  unsubscribe(callback: EventCallback, eventType?: SystemEventTypes) {
    const key = eventType || 'ALL'
    if (!this.listeners.has(key)) return
    
    const callbacks = this.listeners.get(key)!
    this.listeners.set(key, callbacks.filter((cb) => cb !== callback))
  }

  publish(type: SystemEventTypes, data: any = {}, importance: SystemEventPayload['importance'] = 'medium') {
    const payload: SystemEventPayload = {
      id: crypto.randomUUID(),
      type,
      timestamp: Date.now(),
      data,
      importance,
    }

    // Notify specific event listeners
    if (this.listeners.has(type)) {
      this.listeners.get(type)!.forEach((cb) => cb(payload))
    }

    // Notify 'ALL' listeners (Subscribers listening to everything)
    if (this.listeners.has('ALL')) {
      this.listeners.get('ALL')!.forEach((cb) => cb(payload))
    }
  }
}

export const EventBus = new EventBusService()
