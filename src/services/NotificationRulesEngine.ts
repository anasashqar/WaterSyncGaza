import { EventBus } from './EventBus'
import type { SystemEventPayload, SystemEventTypes } from './EventBus'
import { useAuthStore } from '@/stores/useAuthStore'
import type { UserRole } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'

export interface NotificationRule {
  targetRoles: UserRole[] | 'ALL'
  condition?: (event: SystemEventPayload, role: UserRole) => boolean
  formatMessage: (event: SystemEventPayload, role: UserRole) => string
  severity: 'info' | 'success' | 'warning' | 'error'
}

type RulesRegistry = Partial<Record<SystemEventTypes, NotificationRule[]>>

class NotificationRulesEngineClass {
  private unsubscribe: (() => void) | null = null

  // Rules define how each event is handled by different roles
  private rules: RulesRegistry = {
    WATER_DELIVERED: [
      {
        targetRoles: ['org', 'manager'],
        formatMessage: (e) => `تم توصيل المياه: شحنة ${e.data.amount}L من السائق ${e.data.driverName}`,
        severity: 'success',
      },
      {
        targetRoles: ['coordinator'],
        formatMessage: (e) => `تأكيد ميداني: تم تسليم المياه في النقطة #${e.data.pointId}`,
        severity: 'info',
      }
    ],
    STATION_DEPLETED: [
      {
        // Only high or critical will alert everyone (except drivers)
        targetRoles: ['org', 'manager', 'coordinator'],
        condition: (e) => e.importance === 'critical' || e.importance === 'high',
        formatMessage: (e) => `عاجل: المحطة ${e.data.stationName} نفدت من المياه!`,
        severity: 'error',
      }
    ],
    EMERGENCY_REROUTE: [
      {
        // Only drivers receive an emergency reroute in their zone
        targetRoles: ['driver'],
        condition: (e, _role) => {
          // Mock condition: check if the driver handles this zone
          return e.data.zoneId === 'Z1' // Assume driver is in Z1
        },
        formatMessage: (e) => `انتباه: تعديل مسار طارئ للتوجه للنقطة #${e.data.newPointId}`,
        severity: 'warning',
      },
      {
        targetRoles: ['coordinator'],
        formatMessage: (e) => `تم إعادة توجيه مسار السائق لنقطة #${e.data.newPointId}`,
        severity: 'info',
      }
    ],
    BATCH_APPROVED: [
      {
         targetRoles: ['manager', 'org'],
         formatMessage: (e) => `ملخص: تمت الموافقة على تعبئة ${e.data.count} دفعة بنجاح`,
         severity: 'success'
      }
    ]
  }

  start() {
    if (this.unsubscribe) return // Already started
    
    // Subscribe to ALL events in the EventBus
    this.unsubscribe = EventBus.subscribe((event) => {
      this.evaluateEvent(event)
    }, undefined)
  }

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
  }

  private evaluateEvent(event: SystemEventPayload) {
    const state = useAuthStore.getState()
    const currentRole = state.role
    const prefs = state.preferences

    if (prefs.muteAll) return // User muted notifications

    const eventRules = this.rules[event.type]
    if (!eventRules) return // No rules configured for this event

    for (const rule of eventRules) {
      // 1. Role Match Check
      const roleMatches = rule.targetRoles === 'ALL' || rule.targetRoles.includes(currentRole)
      if (!roleMatches) continue

      // 2. Condition Check
      if (rule.condition && !rule.condition(event, currentRole)) continue

      // 3. Dispatch UI Event if pref allows In-App
      if (prefs.receiveInApp) {
        const message = rule.formatMessage(event, currentRole)
        useUIStore.getState().addNotification(message, rule.severity)
      }
    }
  }
}

export const NotificationRulesEngine = new NotificationRulesEngineClass()
