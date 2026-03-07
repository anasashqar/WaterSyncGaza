import { useAuthStore } from '@/stores/useAuthStore'
import type { UserRole } from '@/stores/useAuthStore'

const ROLES: { id: UserRole; icon: string; label: string; desc: string; color: string }[] = [
  {
    id: 'admin',
    icon: '🛡️',
    label: 'مسؤول النظام',
    desc: 'الوصول الكامل — إدارة المحطات والتوزيع والبيانات',
    color: '#3b82f6',
  },
  {
    id: 'ngo',
    icon: '🏢',
    label: 'منظمة إنسانية',
    desc: 'إدارة نقاط التوزيع الخاصة بمنظمتك',
    color: '#10b981',
  },
  {
    id: 'driver',
    icon: '🚛',
    label: 'سائق التوزيع',
    desc: 'متابعة المسارات وتسليم المياه',
    color: '#f59e0b',
  },
]

export function RoleSelectionScreen() {
  const switchRole = useAuthStore((s) => s.switchRole)

  return (
    <div style={styles.backdrop}>
      {/* Decorative blurred orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      <div style={styles.container}>
        {/* Logo / Brand */}
        <div style={styles.brand}>
          <span style={styles.logo}>💧</span>
          <h1 style={styles.title}>WaterSync</h1>
          <p style={styles.subtitle}>نظام إدارة توزيع المياه الذكي — غزة</p>
        </div>

        {/* Prompt */}
        <p style={styles.prompt}>اختر دورك للمتابعة</p>

        {/* Role Cards */}
        <div style={styles.grid}>
          {ROLES.map((r, i) => (
            <button
              key={r.id}
              onClick={() => switchRole(r.id)}
              style={{
                ...styles.card,
                animationDelay: `${i * 0.12}s`,
                borderColor: `${r.color}33`,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.borderColor = r.color
                el.style.boxShadow = `0 0 32px ${r.color}30, var(--shadow-lg)`
                el.style.transform = 'translateY(-6px) scale(1.02)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.borderColor = `${r.color}33`
                el.style.boxShadow = 'var(--shadow-md)'
                el.style.transform = 'translateY(0) scale(1)'
              }}
            >
              <span style={styles.cardIcon}>{r.icon}</span>
              <span style={{ ...styles.cardLabel, color: r.color }}>{r.label}</span>
              <span style={styles.cardDesc}>{r.desc}</span>
            </button>
          ))}
        </div>

        <p style={styles.footer}>يمكنك تغيير الدور لاحقاً من شريط الأدوات</p>
      </div>
    </div>
  )
}

/* ──────────── Inline Styles ──────────── */

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0c1528 100%)',
    overflow: 'hidden',
    fontFamily: 'var(--font-sans)',
  },
  orb1: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
    top: '-10%',
    left: '-8%',
    filter: 'blur(60px)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)',
    bottom: '-8%',
    right: '-6%',
    filter: 'blur(60px)',
    pointerEvents: 'none',
  },
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 28,
    padding: '48px 40px 36px',
    maxWidth: 640,
    width: '92%',
    animation: 'fadeIn 0.6s ease-out',
  },
  brand: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    fontSize: '3.2rem',
    filter: 'drop-shadow(0 0 18px rgba(59,130,246,0.4))',
    marginBottom: 4,
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #60a5fa, #22d3ee)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    margin: 0,
  },
  prompt: {
    fontSize: '1.1rem',
    color: 'var(--text-main)',
    fontWeight: 500,
    margin: 0,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    width: '100%',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '18px 22px',
    border: '1px solid',
    borderRadius: 14,
    background: 'rgba(30, 41, 59, 0.65)',
    backdropFilter: 'blur(12px)',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-md)',
    transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
    transform: 'translateY(0) scale(1)',
    animation: 'slideInRight 0.5s ease-out both',
    textAlign: 'right' as const,
    direction: 'rtl' as const,
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
  },
  cardIcon: {
    fontSize: '2rem',
    flexShrink: 0,
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
  },
  cardLabel: {
    fontSize: '1.05rem',
    fontWeight: 600,
    flexShrink: 0,
    minWidth: 120,
  },
  cardDesc: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    flex: 1,
  },
  footer: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    opacity: 0.6,
    margin: 0,
  },
}
