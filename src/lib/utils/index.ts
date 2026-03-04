/**
 * WaterSync — General Utility Functions
 * دوال مساعدة عامة
 */

/** Format number with Arabic locale */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-EG').format(num)
}

/** Format date with Arabic locale */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

/** Format time with Arabic locale */
export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return function executedFunction(...args: Parameters<T>) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/** Throttle function */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/** Lighten or darken a hex color by a percentage (-1 to 1) */
export function shadeColor(color: string, percent: number): string {
  const f = parseInt(color.slice(1), 16)
  const t = percent < 0 ? 0 : 255
  const p = percent < 0 ? percent * -1 : percent
  const R = f >> 16
  const G = (f >> 8) & 0x00ff
  const B = f & 0x0000ff
  return (
    '#' +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  )
}

/** Get point status from last supply time */
export function getPointStatus(lastSupply: Date | string | null): 'supplied' | 'warning' | 'critical' {
  if (!lastSupply) return 'critical'
  const now = new Date()
  const diff = (now.getTime() - new Date(lastSupply).getTime()) / (1000 * 60 * 60) // hours
  if (diff <= 24) return 'supplied'
  if (diff <= 48) return 'warning'
  return 'critical'
}

/** Get status color from COLORS map */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    supplied: '#00875A',
    warning: '#D97706',
    critical: '#C41E3A',
  }
  return statusColors[status] || statusColors.critical
}

/** Get institution color by index (cyclic) */
export function getInstitutionColor(index: number): string {
  const INST_COLORS = [
    '#2E86AB', '#00875A', '#D97706', '#C41E3A', '#8B5CF6',
    '#14B8A6', '#EC4899', '#F59E0B', '#06B6D4', '#10B981',
  ]
  return INST_COLORS[index % INST_COLORS.length]
}

/** Escape regex special characters */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Highlight matching text with <mark> tags */
export function highlightMatch(text: string, query: string): string {
  if (!query) return text
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}
