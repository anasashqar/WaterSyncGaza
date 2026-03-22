/**
 * Demo accounts configuration for quick login.
 * Centralized file — add/remove demo organizations here for extensibility.
 */

// ────────────────────────────────────────────
// Demo NGO Configurations
// ────────────────────────────────────────────

export interface DemoNGOConfig {
  id: string
  org: {
    id: string
    name: string
    nameAr: string
    color: string
    logo: string
  }
  user: {
    id: string
    username: string
    password: string
    name: string
    role: 'ngo'
    institutionId: string
  }
}

export const DEMO_NGOS: DemoNGOConfig[] = [
  {
    id: 'demo-unrwa',
    org: {
      id: 'demo-unrwa',
      name: 'UNRWA',
      nameAr: 'وكالة الأونروا',
      color: '#0369a1',
      logo: '🇺🇳',
    },
    user: {
      id: 'demo-unrwa-user',
      username: 'demo-unrwa',
      password: 'demo123',
      name: 'منسق وكالة الأونروا',
      role: 'ngo',
      institutionId: 'demo-unrwa',
    },
  },
  {
    id: 'demo-islamic-relief',
    org: {
      id: 'demo-islamic-relief',
      name: 'Islamic Relief',
      nameAr: 'الإغاثة الإسلامية',
      color: '#16a34a',
      logo: '🌙',
    },
    user: {
      id: 'demo-ir-user',
      username: 'demo-ir',
      password: 'demo123',
      name: 'منسق الإغاثة الإسلامية',
      role: 'ngo',
      institutionId: 'demo-islamic-relief',
    },
  },
  {
    id: 'demo-icrc',
    org: {
      id: 'demo-icrc',
      name: 'ICRC',
      nameAr: 'الصليب الأحمر',
      color: '#dc2626',
      logo: '✚',
    },
    user: {
      id: 'demo-icrc-user',
      username: 'demo-icrc',
      password: 'demo123',
      name: 'منسق الصليب الأحمر',
      role: 'ngo',
      institutionId: 'demo-icrc',
    },
  },
]

// ────────────────────────────────────────────
// Admin & Driver
// ────────────────────────────────────────────

export const DEMO_ADMIN_CREDENTIALS = { username: 'WaterSync', password: 'WS@2026' }

export const DEMO_DRIVER = {
  user: {
    id: 'demo-driver-user',
    username: 'demo-driver',
    password: 'demo123',
    name: 'أحمد — سائق ميداني',
    role: 'driver' as const,
    institutionId: DEMO_NGOS[0].id, // linked to UNRWA
  },
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

/** Check if an institutionId belongs to a demo NGO */
export function isDemoNGO(institutionId: string | null): boolean {
  if (!institutionId) return false
  return DEMO_NGOS.some((n) => n.id === institutionId)
}

/** Get demo NGO config by institutionId */
export function getDemoNGO(institutionId: string): DemoNGOConfig | undefined {
  return DEMO_NGOS.find((n) => n.id === institutionId)
}
