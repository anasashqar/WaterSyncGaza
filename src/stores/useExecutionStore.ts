/**
 * WaterSync — Execution Store (Zustand)
 * حالة التنفيذ: الجولات اليومية
 */
import { create } from 'zustand'
import type { DailyRound } from '@/types'

interface ExecutionState {
  isRoundActive: boolean
  dailyRounds: DailyRound[]

  setRoundActive: (active: boolean) => void
  addRound: (round: DailyRound) => void
  clearRounds: () => void
}

// Load saved rounds from localStorage (today only)
function loadTodayRounds(): DailyRound[] {
  try {
    const saved = JSON.parse(localStorage.getItem('waterSync_dailyRounds') || '[]') as DailyRound[]
    const today = new Date().toISOString().split('T')[0]
    const todayRounds = saved.filter((r) => r.date === today)
    if (todayRounds.length !== saved.length) {
      localStorage.setItem('waterSync_dailyRounds', JSON.stringify(todayRounds))
    }
    return todayRounds
  } catch {
    return []
  }
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  isRoundActive: true,
  dailyRounds: loadTodayRounds(),

  setRoundActive: (active) => set({ isRoundActive: active }),

  addRound: (round) => {
    const updated = [...get().dailyRounds, round]
    localStorage.setItem('waterSync_dailyRounds', JSON.stringify(updated))
    set({ dailyRounds: updated })
  },

  clearRounds: () => {
    localStorage.setItem('waterSync_dailyRounds', '[]')
    set({ dailyRounds: [] })
  },
}))
