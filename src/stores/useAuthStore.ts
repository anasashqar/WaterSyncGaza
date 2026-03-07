import { create } from 'zustand'

// ============================================
// Role & Organization Types
// ============================================

/** System roles — matches Plan 3 personas */
export type UserRole = 'admin' | 'ngo' | 'driver'

/** Simulated NGO organization */
export interface NGOOrganization {
  id: string
  name: string
  nameAr: string
  color: string
  logo: string   // emoji placeholder
}

/** User notification preferences */
export interface UserPreferences {
  muteAll: boolean
  receiveInApp: boolean
  receivePush: boolean
  receiveEmail: boolean
}

// ============================================
// Demo Data
// ============================================

export interface User {
  id: string
  username: string
  password: string // Only for demo purposes
  name: string
  role: UserRole
  institutionId: string | null
}

export const DEMO_USERS: User[] = [
  {
    id: 'admin-1',
    username: 'admin',
    password: 'password',
    name: 'مدير النظام الأساسي',
    role: 'admin',
    institutionId: null,
  },
  {
    id: 'unrwa-coord',
    username: 'unrwa',
    password: 'password',
    name: 'منسق الأونروا',
    role: 'ngo',
    institutionId: 'ngo-unrwa',
  },
  {
    id: 'islamic-coord',
    username: 'islamic',
    password: 'password',
    name: 'منسق الإغاثة',
    role: 'ngo',
    institutionId: 'ngo-islamic-relief',
  },
  {
    id: 'driver-1',
    username: 'driver1',
    password: 'password',
    name: 'سائق (الأونروا)',
    role: 'driver',
    institutionId: 'ngo-unrwa',
  },
  {
    id: 'driver-2',
    username: 'driver2',
    password: 'password',
    name: 'سائق (الإغاثة)',
    role: 'driver',
    institutionId: 'ngo-islamic-relief',
  },
]

export const DEMO_NGOS: NGOOrganization[] = [
  {
    id: 'ngo-unrwa',
    name: 'UNRWA',
    nameAr: 'الأونروا',
    color: '#0072BC',
    logo: '🇺🇳',
  },
  {
    id: 'ngo-islamic-relief',
    name: 'Islamic Relief',
    nameAr: 'الإغاثة الإسلامية',
    color: '#2E7D32',
    logo: '🌙',
  },
]

// ============================================
// Auth Store
// ============================================

interface AuthState {
  /** Current active user */
  user: User | null
  /** Is user authenticated? */
  isAuthenticated: boolean
  
  /** Current active role */
  role: UserRole
  /** Whether the user has selected a role on first launch (legacy - deprecated) */
  roleSelected: boolean
  /** Active institution ID (null for admin who sees everything) */
  institutionId: string | null
  /** Whether the NGO has completed the setup wizard */
  ngoSetupComplete: boolean
  /** Notification preferences */
  preferences: UserPreferences

  // Actions
  /** Login with username and password */
  login: (username: string, password?: string) => boolean
  /** Logout current user */
  logout: () => void

  /** Switch role + auto-bind institution context (legacy - deprecated) */
  switchRole: (role: UserRole, institutionId?: string | null) => void
  /** Legacy: simple role setter (backwards compat) */
  setRole: (role: UserRole) => void
  /** Mark NGO setup as complete */
  completeNGOSetup: () => void
  /** Update notification preferences */
  updatePreferences: (updates: Partial<UserPreferences>) => void

  // Getters
  /** Get the current NGO organization object (null if admin) */
  getCurrentNGO: () => NGOOrganization | null
  /** Check if current user can see all data (admin only) */
  isGodView: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  role: 'admin',               // Default: overridden by login
  roleSelected: false,         // Legacy
  institutionId: null,         // Admin sees everything
  ngoSetupComplete: false,     // NGO wizard not done yet
  preferences: {
    muteAll: false,
    receiveInApp: true,
    receivePush: true,
    receiveEmail: false,
  },

  login: (username, password) => {
    // Basic hardcoded logic for demo purposes
    const userToLogin = DEMO_USERS.find(
      (u) => u.username === username && u.password === (password || 'password')
    )

    if (userToLogin) {
      set({
        user: userToLogin,
        isAuthenticated: true,
        role: userToLogin.role,
        institutionId: userToLogin.institutionId,
        roleSelected: true, // Compatibility with legacy code
        ngoSetupComplete: false,
      })
      return true
    }
    return false
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      roleSelected: false,
      institutionId: null,
      role: 'admin', // reset
    })
  },

  switchRole: (role, institutionId) => {
    if (role === 'admin') {
      set({ role, roleSelected: true, institutionId: null, ngoSetupComplete: false })
    } else if (role === 'ngo') {
      // Default to first NGO if none specified
      set({ role, roleSelected: true, institutionId: institutionId ?? DEMO_NGOS[0].id, ngoSetupComplete: false })
    } else if (role === 'driver') {
      // Driver always belongs to an NGO
      set({ role, roleSelected: true, institutionId: institutionId ?? get().institutionId ?? DEMO_NGOS[0].id, ngoSetupComplete: false })
    }
  },

  // Backwards compatibility — old code calls setRole('coordinator') etc.
  setRole: (role) => {
    const mapped: UserRole =
      role === ('coordinator' as string) ? 'admin' :
      role === ('org' as string) ? 'ngo' :
      role === ('manager' as string) ? 'admin' :
      role
    get().switchRole(mapped)
  },

  updatePreferences: (updates) =>
    set((state) => ({ preferences: { ...state.preferences, ...updates } })),

  completeNGOSetup: () => set({ ngoSetupComplete: true }),

  getCurrentNGO: () => {
    const { institutionId } = get()
    if (!institutionId) return null
    return DEMO_NGOS.find((n) => n.id === institutionId) ?? null
  },

  isGodView: () => get().role === 'admin',
}))
