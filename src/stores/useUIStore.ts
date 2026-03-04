/**
 * WaterSync — UI Store (Zustand)
 * حالة واجهة المستخدم: المظهر، الشريط الجانبي، البحث
 */
import { create } from 'zustand'
import type { SidebarPanel, Theme, SearchState } from '@/types'

interface UIState {
  // Theme
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void

  // Sidebar
  activePanel: SidebarPanel
  sidebarOpen: boolean
  setActivePanel: (panel: SidebarPanel) => void
  toggleSidebar: () => void

  // Search
  search: SearchState
  setSearchQuery: (query: string) => void
  setSearchOpen: (open: boolean) => void
  clearSearch: () => void

  // Onboarding
  onboardingActive: boolean
  onboardingStep: number
  onboardingCompleted: boolean
  startOnboarding: () => void
  nextOnboardingStep: () => void
  skipOnboarding: () => void

  // Notifications queue (toasts handled by component)
  notifications: Notification[]
  addNotification: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void
  removeNotification: (id: string) => void
}

interface Notification {
  id: string
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
  timestamp: number
}

// Read saved theme
function getSavedTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const saved = localStorage.getItem('watersync-theme-v2')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useUIStore = create<UIState>((set, get) => ({
  // Theme
  theme: getSavedTheme(),
  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('watersync-theme-v2', theme)
    set({ theme })
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.add('theme-transitioning')
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('watersync-theme-v2', next)
    set({ theme: next })
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 300)
  },

  // Sidebar
  activePanel: 'supply',
  sidebarOpen: true,
  setActivePanel: (panel) => set({ activePanel: panel, sidebarOpen: true }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // Search
  search: { query: '', isOpen: false, results: { stations: [], points: [], trips: [], zones: [] }, selectedIndex: -1 },
  setSearchQuery: (query) => set((s) => ({ search: { ...s.search, query } })),
  setSearchOpen: (open) => set((s) => ({ search: { ...s.search, isOpen: open } })),
  clearSearch: () => set((s) => ({ search: { ...s.search, query: '', isOpen: false, results: { stations: [], points: [], trips: [], zones: [] }, selectedIndex: -1 } })),

  // Onboarding
  onboardingActive: false,
  onboardingStep: 0,
  onboardingCompleted: localStorage.getItem('watersync-onboarding-done') === 'true',
  startOnboarding: () => set({ onboardingActive: true, onboardingStep: 0 }),
  nextOnboardingStep: () => set((s) => ({ onboardingStep: s.onboardingStep + 1 })),
  skipOnboarding: () => {
    localStorage.setItem('watersync-onboarding-done', 'true')
    set({ onboardingActive: false, onboardingCompleted: true })
  },

  // Notifications
  notifications: [],
  addNotification: (message, type = 'info') => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    set((s) => ({
      notifications: [...s.notifications, { id, message, type, timestamp: Date.now() }],
    }))
    // Auto-remove after 4s
    setTimeout(() => get().removeNotification(id), 4000)
  },
  removeNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
}))
