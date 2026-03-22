/**
 * WaterSync — General Utility Functions
 * دوال مساعدة عامة
 */

/** Get status color from COLORS map */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    supplied: '#00875A',
    warning: '#D97706',
    critical: '#C41E3A',
  }
  return statusColors[status] || statusColors.critical
}
