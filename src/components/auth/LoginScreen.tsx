import { useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { Droplet, Lock, User, LogIn, ShieldCheck, Truck, Users } from 'lucide-react'

export function LoginScreen() {
  const login = useAuthStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    
    if (!username.trim()) {
      setError('يرجى إدخال اسم المستخدم')
      return
    }

    const success = login(username, password)
    if (!success) {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة')
    }
  }

  const quickLogin = (usr: string) => {
    login(usr, 'password')
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', width: '100vw',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', direction: 'rtl'
    }}>
      
      {/* Decorative background shapes */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'rgba(56,189,248,0.1)', borderRadius: '50%', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, background: 'rgba(16,185,129,0.1)', borderRadius: '50%', filter: 'blur(60px)' }} />

      <div style={{
        background: '#fff', borderRadius: 24, padding: '40px 48px',
        width: '100%', maxWidth: 440,
        boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
        position: 'relative', zIndex: 10
      }}>
        
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', marginBottom: 16,
            boxShadow: '0 10px 20px rgba(2,132,199,0.2)'
          }}>
            <Droplet size={36} strokeWidth={2.5} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            WaterSync
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>
            نظام إدارة توزيع المياه الذكي
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div>
            <div style={{ 
               display: 'flex', alignItems: 'center', gap: 12,
               border: '2px solid #e2e8f0', borderRadius: 12,
               padding: '12px 16px', background: '#f8fafc',
               transition: 'all 0.2s',
               ...(username.trim() ? { borderColor: '#38bdf8', background: '#fff' } : {})
            }}>
              <User size={20} color={username.trim() ? '#0284c7' : '#94a3b8'} />
              <input 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="اسم المستخدم"
                style={{
                  border: 'none', background: 'transparent', width: '100%',
                  fontSize: '1rem', fontWeight: 600, color: '#1e293b', outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ 
               display: 'flex', alignItems: 'center', gap: 12,
               border: '2px solid #e2e8f0', borderRadius: 12,
               padding: '12px 16px', background: '#f8fafc',
               transition: 'all 0.2s',
               ...(password.trim() ? { borderColor: '#38bdf8', background: '#fff' } : {})
            }}>
              <Lock size={20} color={password.trim() ? '#0284c7' : '#94a3b8'} />
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                style={{
                  border: 'none', background: 'transparent', width: '100%',
                  fontSize: '1rem', fontWeight: 600, color: '#1e293b', outline: 'none'
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              color: '#ef4444', fontSize: '0.85rem', fontWeight: 600,
              padding: '8px 12px', background: '#fef2f2', borderRadius: 8,
              border: '1px solid #fca5a5', textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button type="submit" style={{
            marginTop: 8, padding: '14px', borderRadius: 12,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            color: '#fff', border: 'none', outline: 'none', cursor: 'pointer',
            fontSize: '1.05rem', fontWeight: 700, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 6px 15px rgba(2,132,199,0.25)',
            transition: 'transform 0.1s, boxShadow 0.1s'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'none'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <LogIn size={20} /> تسجيل الدخول
          </button>
        </form>

        {/* Quick Login - Demo Accounts */}
        <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
          <p style={{ margin: '0 0 16px', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textAlign: 'center' }}>
            لأغراض العرض والتجربة (Quick Login)
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={() => quickLogin('admin')} style={quickBtnStyle('#f1f5f9', '#334155', '#e2e8f0')}>
              <ShieldCheck size={14} color="#0284c7" /> مدير النظام
            </button>
            <div />{/* Spacer */}

            <button onClick={() => quickLogin('unrwa')} style={quickBtnStyle('#f0f9ff', '#0284c7', '#bae6fd')}>
              <Users size={14} /> منسق الأونروا
            </button>
            <button onClick={() => quickLogin('islamic')} style={quickBtnStyle('#f0fdf4', '#16a34a', '#bbf7d0')}>
              <Users size={14} /> منسق الإغاثة
            </button>
            
            <button onClick={() => quickLogin('driver1')} style={quickBtnStyle('#f1f5f9', '#475569', '#cbd5e1')}>
              <Truck size={14} /> سائق الأونروا
            </button>
            <button onClick={() => quickLogin('driver2')} style={quickBtnStyle('#f1f5f9', '#475569', '#cbd5e1')}>
              <Truck size={14} /> سائق الإغاثة
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

const quickBtnStyle = (bg: string, color: string, border: string): React.CSSProperties => ({
  background: bg, color: color, border: `1px solid ${border}`,
  padding: '8px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  fontFamily: 'inherit'
})
