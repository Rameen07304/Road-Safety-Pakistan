import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Alert } from '../../components/UI'
import Toast from '../../components/Toast'
import { Shield, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export default function Login() {
  useDocumentTitle('Login')
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
      <div className="min-h-[calc(100vh-64px)] bg-neutral-50 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-6xl flex-col overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-elevated lg:grid lg:grid-cols-[1.05fr_0.95fr]">
          <aside className="relative min-h-[380px] overflow-hidden bg-[linear-gradient(rgba(15,40,29,0.35),rgba(15,40,29,0.75)),url('https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center px-6 py-7 text-white sm:px-8 lg:px-10 lg:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,213,185,0.18),transparent_35%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-10 flex items-center gap-2 text-sm font-semibold text-white/95">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/12"><Shield size={16} /></span>
                  OFFICIAL CITIZEN PORTAL
                </div>

                <h1 className="max-w-[12ch] font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
                  Make Our Roads Safer, Together.
                </h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/80">
                  Join thousands of citizens in Lahore reporting hazards, tracking resolutions, and ensuring safer commutes for everyone.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <div className="text-2xl font-heading font-bold">12k+</div>
                  <div className="mt-1 text-sm text-white/75">Hazards Resolved</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <div className="text-2xl font-heading font-bold">24/7</div>
                  <div className="mt-1 text-sm text-white/75">Active Monitoring</div>
                </div>
              </div>
            </div>
          </aside>

          <main className="bg-neutral-50 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
            <div className="mx-auto max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <p className="text-[28px] font-serif text-primary-700">واپس آئیں</p>
                <h2 className="mt-1 font-heading text-4xl font-bold text-primary-800">{t('login_welcome_back')}</h2>
                <p className="mt-2 text-sm text-neutral-500">{t('login_subtitle')}</p>
              </div>

              {error && <Alert message={error} type="error" className="mb-5" />}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 rounded-lg bg-neutral-100 p-1 text-sm font-semibold text-neutral-500">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('email')}
                    className={`rounded-md py-2 transition ${loginMethod === 'email' ? 'bg-white text-primary-800 shadow-subtle' : ''}`}
                  >
                    {t('login_email_tab')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('phone')}
                    className={`rounded-md py-2 transition ${loginMethod === 'phone' ? 'bg-white text-primary-800 shadow-subtle' : ''}`}
                  >
                    {t('login_phone_tab')}
                  </button>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-primary-700">
                    <label htmlFor="login-identifier">{loginMethod === 'phone' ? 'Phone Number' : 'Email Address'}</label>
                    <span>{loginMethod === 'phone' ? 'فون نمبر' : 'ای میل کا پتہ'}</span>
                  </div>
                  <div className="flex overflow-hidden rounded-lg border border-neutral-200 bg-white focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-300/30">
                    <span className="border-r border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-400">
                      {loginMethod === 'phone' ? '+92' : '@'}
                    </span>
                    <input
                      id="login-identifier"
                      type={loginMethod === 'phone' ? 'tel' : 'email'}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={loginMethod === 'phone' ? '300 1234567' : 'name@example.com'}
                      className="w-full border-0 px-4 py-2 text-sm text-neutral-900 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-primary-700">
                    <label htmlFor="login-password">Password</label>
                    <span>پاس ورڈ</span>
                  </div>
                  <div className="flex overflow-hidden rounded-lg border border-neutral-200 bg-white focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-300/30">
                    <span className="border-r border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-400">
                      <Lock size={14} />
                    </span>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border-0 px-4 py-2 text-sm text-neutral-900 outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="border-l border-neutral-200 bg-neutral-50 px-3 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-neutral-500">
                    <input type="checkbox" className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-300" />
                    {t('login_remember_me')}
                  </label>
                  <Link to="/forgot-password" className="font-semibold text-primary-600 hover:text-primary-700">
                    {t('login_forgot_password')}
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full !rounded-lg !bg-primary-800 !py-3 text-base font-bold hover:!bg-primary-900"
                  loading={loading}
                >
                  {loading ? t('login_button_loading') : t('login_button')}
                  <ArrowRight size={16} />
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-neutral-500">
                {t('login_new_here')}{' '}
                <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                  {t('login_create_account')}
                </Link>
              </div>

              <div className="mt-6 border-t border-neutral-100 pt-5 text-center text-[10px] uppercase tracking-[0.24em] text-neutral-400">
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
