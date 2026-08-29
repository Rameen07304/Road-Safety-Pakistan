import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Alert } from '../../components/UI'
import Toast from '../../components/Toast'

export default function Login() {
  const [loginMethod, setLoginMethod] = useState('email')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useLanguage()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/api/auth/login/', {
        email: identifier.toLowerCase(),
        password,
      })

      const { user, tokens, role } = response.data
      login(user, tokens)
      
      setToast({ message: 'Login successful!', type: 'success' })
      setTimeout(() => {
        navigate(role === 'admin' ? '/admin/dashboard' : '/')
      }, 1500)
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed. Check your credentials.'
      setError(message)
      setToast({ message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-64px)] bg-[#eef6f0] px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-6xl flex-col overflow-hidden rounded-[18px] border border-green-100 bg-white shadow-[0_24px_80px_rgba(27,67,50,0.12)] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
          <aside className="relative min-h-[380px] overflow-hidden bg-[linear-gradient(rgba(5,34,21,0.35),rgba(5,34,21,0.75)),url('https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center px-6 py-7 text-white sm:px-8 lg:px-10 lg:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(122,255,173,0.18),transparent_35%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-10 flex items-center gap-2 text-sm font-semibold text-white/95">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/12 text-base">🛡️</span>
                  OFFICIAL CITIZEN PORTAL
                </div>

                <h1 className="max-w-[12ch] text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
                  Make Our Roads Safer, Together.
                </h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/80">
                  Join thousands of citizens in Lahore reporting hazards, tracking resolutions, and ensuring safer commutes for everyone.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <div className="text-2xl font-black">12k+</div>
                  <div className="mt-1 text-sm text-white/75">Hazards Resolved</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <div className="text-2xl font-black">24/7</div>
                  <div className="mt-1 text-sm text-white/75">Active Monitoring</div>
                </div>
              </div>
            </div>
          </aside>

          <main className="bg-[#fbfcfa] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
            <div className="mx-auto max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <p className="text-[28px] font-serif text-[#1c4b37]">واپس آئیں</p>
                <h2 className="mt-1 text-4xl font-black text-[#173b2b]">{t('login_welcome_back')}</h2>
                <p className="mt-2 text-sm text-[#6b7c73]">{t('login_subtitle')}</p>
              </div>

              {error && <Alert message={error} type="error" className="mb-5" />}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 rounded-lg bg-[#e8ece8] p-1 text-sm font-semibold text-[#5f7268]">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('email')}
                    className={`rounded-md py-2 transition ${loginMethod === 'email' ? 'bg-white text-[#173b2b] shadow-sm' : ''}`}
                  >
                    {t('login_email_tab')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('phone')}
                    className={`rounded-md py-2 transition ${loginMethod === 'phone' ? 'bg-white text-[#173b2b] shadow-sm' : ''}`}
                  >
                    {t('login_phone_tab')}
                  </button>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-[#274638]">
                    <label>{loginMethod === 'phone' ? 'Phone Number' : 'Email Address'}</label>
                    <span>{loginMethod === 'phone' ? 'فون نمبر' : 'ای میل کا پتہ'}</span>
                  </div>
                  <div className="flex overflow-hidden rounded border border-[#d6e3d9] bg-white focus-within:border-[#2f6a4d] focus-within:ring-2 focus-within:ring-[#2f6a4d]/20">
                    <span className="border-r border-[#d6e3d9] bg-[#f4f9f5] px-3 py-2 text-sm text-[#54685d]">
                      {loginMethod === 'phone' ? '+92' : '@'}
                    </span>
                    <input
                      type={loginMethod === 'phone' ? 'tel' : 'email'}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={loginMethod === 'phone' ? '300 1234567' : 'name@example.com'}
                      className="w-full border-0 px-4 py-2 text-sm text-gray-900 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-[#274638]">
                    <label>Password</label>
                    <span>پاس ورڈ</span>
                  </div>
                  <div className="flex overflow-hidden rounded border border-[#d6e3d9] bg-white focus-within:border-[#2f6a4d] focus-within:ring-2 focus-within:ring-[#2f6a4d]/20">
                    <span className="border-r border-[#d6e3d9] bg-[#f4f9f5] px-3 py-2 text-sm text-[#54685d]">🔒</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border-0 px-4 py-2 text-sm text-gray-900 outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="border-l border-[#d6e3d9] bg-[#f4f9f5] px-3 text-[#54685d] transition hover:bg-[#ebf4ed]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 3l18 18" />
                          <path d="M10.58 10.58A3 3 0 0 0 13.42 13.42" />
                          <path d="M9.88 5.1A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a18.15 18.15 0 0 1-4.18 5.31" />
                          <path d="M6.61 6.61A17.8 17.8 0 0 0 2 12s3 7 10 7a11.4 11.4 0 0 0 5.39-1.39" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-[#5d7067]">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#b9c9be] text-[#2f6a4d] focus:ring-[#2f6a4d]" />
                    {t('login_remember_me')}
                  </label>
                  <Link to="/forgot-password" className="font-semibold text-[#2f6a4d] hover:text-[#1c4b37]">
                    {t('login_forgot_password')}
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full !rounded-md !bg-[#173b2b] !py-3 text-base font-bold hover:!bg-[#0f281d]"
                  loading={loading}
                >
                  {loading ? t('login_button_loading') : t('login_button')}
                  <span>→</span>
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-[#596a61]">
                {t('login_new_here')}{' '}
                <Link to="/register" className="font-semibold text-[#1f5b43] hover:text-[#154430]">
                  {t('login_create_account')}
                </Link>
              </div>

              <div className="mt-6 border-t border-[#e4ebe6] pt-5 text-center text-[10px] uppercase tracking-[0.24em] text-[#8ea095]">
                Government Official? Admin Portal +
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  )
}
