import { useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { Droplet, Lock, User, LogIn, ShieldCheck, Truck, Building2, UserPlus, Phone, ArrowRight } from 'lucide-react'

type AuthMode = 'login' | 'register_choice' | 'register_ngo' | 'register_driver'

export function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>('login')

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
        position: 'relative', zIndex: 10,
        overflow: 'hidden'
      }}>
        
        {/* Header / Logo */}
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
            {mode === 'login' ? 'نظام إدارة توزيع المياه الذكي' : 'تسجيل حساب جديد'}
          </p>
        </div>

        {/* Dynamic Forms based on Mode */}
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {mode === 'login' && <LoginForm onGoRegister={() => setMode('register_choice')} />}
          {mode === 'register_choice' && <RegisterChoice onSelect={(m) => setMode(m)} onBack={() => setMode('login')} />}
          {mode === 'register_ngo' && <RegisterNGOForm onBack={() => setMode('register_choice')} onDone={() => setMode('login')} />}
          {mode === 'register_driver' && <RegisterDriverForm onBack={() => setMode('register_choice')} onDone={() => setMode('login')} />}
        </div>

      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// LOGIN FORM
// ----------------------------------------------------------------------
function LoginForm({ onGoRegister }: { onGoRegister: () => void }) {
  const login = useAuthStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    if (!username.trim()) return setError('يرجى إدخال اسم المستخدم')
    
    const success = login(username, password)
    if (!success) setError('اسم المستخدم أو كلمة المرور غير صحيحة')
  }

  return (
    <>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <InputBox icon={<User size={20} />} value={username} onChange={setUsername} placeholder="اسم المستخدم أو رقم الهاتف" />
        <InputBox icon={<Lock size={20} />} value={password} onChange={setPassword} placeholder="كلمة المرور" type="password" />

        {error && <ErrorBox msg={error} />}

        <button type="submit" style={primaryButtonStyle}>
          <LogIn size={20} /> تسجيل الدخول
        </button>
      </form>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>ليس لديك حساب؟ </span>
        <button onClick={onGoRegister} style={{ background:'none', border:'none', color:'#0284c7', fontWeight:700, cursor:'pointer', fontSize:'0.9rem', fontFamily:'inherit' }}>
          انشئ حساباً الآن
        </button>
      </div>
    </>
  )
}

// ----------------------------------------------------------------------
// REGISTER CHOICE
// ----------------------------------------------------------------------
function RegisterChoice({ onSelect, onBack }: { onSelect: (m: AuthMode) => void, onBack: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={() => onSelect('register_ngo')} style={choiceBtnStyle}>
        <div style={iconBoxStyle('#eff6ff', '#3b82f6')}><Building2 size={24} /></div>
        <div style={{ textAlign: 'right', flex: 1 }}>
          <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem' }}>تسجيل مؤسسة منسقة</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>لإدارة المحطات وتوجيه الشاحنات</div>
        </div>
        <ArrowRight size={20} color="#cbd5e1" />
      </button>

      <button onClick={() => onSelect('register_driver')} style={choiceBtnStyle}>
        <div style={iconBoxStyle('#f0fdf4', '#22c55e')}><Truck size={24} /></div>
        <div style={{ textAlign: 'right', flex: 1 }}>
          <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem' }}>تسجيل سائق ميداني</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>للعمل ضمن أسطول مؤسسة معتمدة</div>
        </div>
        <ArrowRight size={20} color="#cbd5e1" />
      </button>

      <button onClick={onBack} style={{ background:'transparent', border:'none', color:'#64748b', fontWeight:700, padding:10, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:8 }}>
        <ArrowRight size={16} /> العودة لتسجيل الدخول
      </button>
    </div>
  )
}

// ----------------------------------------------------------------------
// NGO REGISTER
// ----------------------------------------------------------------------
function RegisterNGOForm({ onBack, onDone }: { onBack: () => void, onDone: () => void }) {
  const registerNGOUser = useAuthStore(s => s.registerNGOUser)
  const [orgName, setOrgName] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!orgName || !fullName || !phone || !password) return setError('جميع الحقول مطلوبة')
    if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')

    const user = registerNGOUser(orgName, fullName, phone, password)
    if (!user) return setError('رقم الهاتف مستخدم مسبقاً!')
    
    // Simulate successful registration
    alert(`تم تسجيل مؤسسة ${orgName} بنجاح! يمكنك تسجيل الدخول الآن.`)
    onDone()
  }

  return (
    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <InputBox icon={<Building2 size={20} />} value={orgName} onChange={setOrgName} placeholder="الاسم الرسمي للمؤسسة" />
      <InputBox icon={<User size={20} />} value={fullName} onChange={setFullName} placeholder="اسم المنسق (الكامل)" />
      <InputBox icon={<Phone size={20} />} value={phone} onChange={setPhone} placeholder="رقم هاتف المنسق (سيكون اسم المستخدم)" />
      <InputBox icon={<Lock size={20} />} value={password} onChange={setPassword} placeholder="تعيين كلمة المرور" type="password" />

      {error && <ErrorBox msg={error} />}

      <button type="submit" style={primaryButtonStyle}>
        <UserPlus size={20} /> إنشاء حساب مؤسسي
      </button>

      <button type="button" onClick={onBack} style={backButtonStyle}>
        إلغاء والعودة
      </button>
    </form>
  )
}

// ----------------------------------------------------------------------
// DRIVER REGISTER
// ----------------------------------------------------------------------
function RegisterDriverForm({ onBack, onDone }: { onBack: () => void, onDone: () => void }) {
  const registerDriver = useAuthStore(s => s.registerDriver)
  const registeredNGOs = useAuthStore(s => s.registeredNGOs)
  
  const [selectedNGO, setSelectedNGO] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedNGO) return setError('يجب اختيار المؤسسة التي تعمل بها')
    if (!fullName || !phone || !password) return setError('جميع الحقول مطلوبة')

    const user = registerDriver(selectedNGO, fullName, phone, password)
    if (!user) return setError('رقم الهاتف مستخدم مسبقاً!')
    
    alert(`تم تسجيلك بنجاح كسائق! يمكنك تسجيل الدخول الآن.`)
    onDone()
  }

  return (
    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* NGO Selection Dropdown */}
      <div style={{ position: 'relative' }}>
         <div style={{position:'absolute', right:16, top:12}}><ShieldCheck size={20} color={selectedNGO ? '#0284c7' : '#94a3b8'} /></div>
         <select 
            value={selectedNGO} onChange={e => setSelectedNGO(e.target.value)}
            style={{...inputBaseStyle, paddingRight: 44, color: selectedNGO ? '#1e293b' : '#94a3b8', border: selectedNGO ? '2px solid #38bdf8' : '2px solid #e2e8f0', appearance: 'none', background: selectedNGO ? '#fff' : '#f8fafc', cursor: 'pointer' }}
         >
            <option value="" disabled>-- اختر المؤسسة التابع لها --</option>
            {registeredNGOs.map(ngo => (
               <option key={ngo.id} value={ngo.id}>{ngo.nameAr} {ngo.logo}</option>
            ))}
         </select>
         <div style={{position:'absolute', left:16, top:14, pointerEvents:'none'}}><ArrowRight size={14} color="#94a3b8" style={{transform: 'rotate(-90deg)'}}/></div>
      </div>

      <InputBox icon={<User size={20} />} value={fullName} onChange={setFullName} placeholder="اسم السائق الثلاثي" />
      <InputBox icon={<Phone size={20} />} value={phone} onChange={setPhone} placeholder="رقم الهاتف الأساسي" />
      <InputBox icon={<Lock size={20} />} value={password} onChange={setPassword} placeholder="كلمة المرور" type="password" />

      {error && <ErrorBox msg={error} />}

      <button type="submit" style={primaryButtonStyle}>
        <Truck size={20} /> تسجيل كسائق
      </button>

      <button type="button" onClick={onBack} style={backButtonStyle}>
        إلغاء والعودة
      </button>
    </form>
  )
}

// ----------------------------------------------------------------------
// Reusable UI Bits
// ----------------------------------------------------------------------
function InputBox({ icon, value, onChange, placeholder, type = 'text' }: any) {
  const active = !!value.trim()
  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', gap: 12,
      border: active ? '2px solid #38bdf8' : '2px solid #e2e8f0', 
      borderRadius: 12, padding: '12px 16px', 
      background: active ? '#fff' : '#f8fafc',
      transition: 'all 0.2s'
    }}>
      <div style={{ color: active ? '#0284c7' : '#94a3b8', display: 'flex' }}>{icon}</div>
      <input 
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border: 'none', background: 'transparent', width: '100%',
          fontSize: '1rem', fontWeight: 600, color: '#1e293b', outline: 'none',
          fontFamily: 'inherit'
        }}
      />
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{
      color: '#ef4444', fontSize: '0.85rem', fontWeight: 600,
      padding: '10px 12px', background: '#fef2f2', borderRadius: 10,
      border: '1px solid #fca5a5', textAlign: 'center'
    }}>{msg}</div>
  )
}

const inputBaseStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 12,
  fontSize: '1rem', fontWeight: 600, outline: 'none', fontFamily: 'inherit',
  transition: 'all 0.2s'
}

const primaryButtonStyle: React.CSSProperties = {
  marginTop: 8, padding: '14px', borderRadius: 12,
  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
  color: '#fff', border: 'none', outline: 'none', cursor: 'pointer',
  fontSize: '1.05rem', fontWeight: 800, fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: '0 6px 15px rgba(2,132,199,0.25)',
  transition: 'all 0.2s'
}

const choiceBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
  background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 16,
  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
}

const iconBoxStyle = (bg: string, color: string): React.CSSProperties => ({
  width: 48, height: 48, borderRadius: 12, background: bg, color: color,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
})

const backButtonStyle: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#64748b', fontWeight: 700,
  padding: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem'
}
