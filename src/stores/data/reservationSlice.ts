import type { StateCreator } from 'zustand'
import type { DataState, ReservationState } from './types'

/** Get end-of-day timestamp for today */
function endOfToday(): string {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export const createReservationSlice: StateCreator<DataState, [], [], ReservationState> = (set, get) => ({
  reservePoint: (pointId, institutionId) => {
    const point = get().points.find((p) => p.id === pointId)
    if (!point) return { success: false, reason: 'النقطة غير موجودة' }

    // Check if point is outside the institution's allowed governorates (contracted stations)
    const institution = get().institutions.find((i) => i.id === institutionId)
    if (institution && institution.stationIds.length > 0) {
      const allowedGovs = new Set(
        institution.stationIds.map((sid) => get().stations.find((s) => s.id === sid)?.governorate)
      )
      if (!allowedGovs.has(point.governorate)) {
        return {
          success: false,
          reason: 'لا يمكن حجز نقاط في غير نطاق توزيع المحطات المتعاقد معها (محافظة أخرى)',
        }
      }
    }

    // Check if already reserved by another institution
    if (point.reservedBy && point.reservedBy !== institutionId) {
      return {
        success: false,
        reason: `هذه النقطة محجوزة بالفعل من مؤسسة أخرى`,
        heldBy: point.reservedBy,
      }
    }

    // Check if reservation expired (allow override if expired, this was in original code implicitly)

    // Reserve it
    const now = new Date().toISOString()
    set((s) => ({
      points: s.points.map((p) =>
        p.id === pointId
          ? {
              ...p,
              reservedBy: institutionId,
              reservedAt: now,
              reservedUntil: endOfToday(),
              reservationStatus: 'reserved' as const,
            }
          : p
      ),
    }))

    return { success: true }
  },

  releasePoint: (pointId) => {
    set((s) => ({
      points: s.points.map((p) =>
        p.id === pointId
          ? {
              ...p,
              reservedBy: null,
              reservedAt: null,
              reservedUntil: null,
              reservationStatus: 'available' as const,
            }
          : p
      ),
    }))
  },

  updateReservationStatus: (pointId, status) => {
    set((s) => ({
      points: s.points.map((p) =>
        p.id === pointId ? { ...p, reservationStatus: status } : p
      ),
    }))
  },

  releaseExpiredReservations: () => {
    const now = new Date()
    let released = 0

    set((s) => ({
      points: s.points.map((p) => {
        if (p.reservedUntil && new Date(p.reservedUntil) < now) {
          released++
          return {
            ...p,
            reservedBy: null,
            reservedAt: null,
            reservedUntil: null,
            reservationStatus: 'available' as const,
          }
        }
        return p
      }),
    }))

    return released
  },

  getAvailablePoints: () => {
    return get().points.filter(
      (p) => !p.reservedBy || p.reservationStatus === 'available'
    )
  },

  getReservedByInstitution: (institutionId) => {
    return get().points.filter((p) => p.reservedBy === institutionId)
  },
})
