import { create } from 'zustand'

export type UserRole = 'manager' | 'org' | 'coordinator' | 'driver'

export interface UserPreferences {
  muteAll: boolean
  receiveInApp: boolean
  receivePush: boolean
  receiveEmail: boolean
}

interface AuthState {
  role: UserRole
  preferences: UserPreferences
  setRole: (role: UserRole) => void
  updatePreferences: (updates: Partial<UserPreferences>) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  role: 'coordinator', // Default role for demo
  preferences: {
    muteAll: false,
    receiveInApp: true,
    receivePush: true,
    receiveEmail: false,
  },
  setRole: (role) => set({ role }),
  updatePreferences: (updates) =>
    set((state) => ({ preferences: { ...state.preferences, ...updates } })),
}))
