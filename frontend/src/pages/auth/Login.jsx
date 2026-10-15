import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { api } from '../../services/api'
import AuthLayout from '../../components/AuthLayout'
import { Button, Alert, FormField, BilingualHeading } from '../../components/UI'
import Toast from '../../components/Toast'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export default function Login() {
  useDocumentTitle('title_login')
  const [loginMethod, setLoginMethod] = useState('email')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
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

      const { user, tokens } = response.data
      // GuestRoute (App.jsx) redirects as soon as the user is set: to the page
      // that asked for login, or to the dashboard.
      login(user, tokens)
    } catch (err) {
      // A blocked account is told so (in the UI language); other failures keep
      // the server's message.
      const message = err.response?.data?.code === 'account_blocked'
        ? t('login_blocked')
        : err.response?.data?.detail || t('login_failed')
      setError(message)
      setToast({ message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const tab = (method, key) => (
    <button
      type="button"
      role="tab"
      aria-selected={loginMethod === method}
      onClick={() => setLoginMethod(method)}
      className={`h-10 flex-1 border-b-2 text-sm font-semibold transition-colors ${
        loginMethod === method ? 'border-primary-500 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-800'
      }`}
    >
      {t(key)}
    </button>
  )

  return (
    <AuthLayout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <BilingualHeading titleKey="login_welcome_back" subtitleKey="login_subtitle" />

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="flex border-b border-neutral-200" role="tablist">
          {tab('email', 'login_email_tab')}
          {tab('phone', 'login_phone_tab')}
        </div>

        {error && <Alert message={error} type="error" />}

        <FormField id="login-identifier" labelKey={loginMethod === 'phone' ? 'login_phone_label' : 'login_email_label'}>
          <div className="flex" dir="ltr">
            {loginMethod === 'phone' && (
              <span className="flex items-center rounded-s-sm border border-e-0 border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-600">+92</span>
            )}
            <input
              id="login-identifier"
              type={loginMethod === 'phone' ? 'tel' : 'email'}
              autoComplete={loginMethod === 'phone' ? 'tel' : 'email'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={loginMethod === 'phone' ? '300 1234567' : 'name@example.com'}
              className={`field ${loginMethod === 'phone' ? 'rounded-s-none' : ''}`}
              required
            />
          </div>
        </FormField>

        <FormField id="login-password" labelKey="login_password_label">
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field pe-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-neutral-500 hover:text-neutral-800"
              aria-label={showPassword ? t('login_hide_password') : t('login_show_password')}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="mt-2 text-end">
            <Link to="/forgot-password" className="-my-1.5 inline-block py-1.5 text-sm font-semibold text-primary-600 hover:underline">
              {t('login_forgot_password')}
            </Link>
          </div>
        </FormField>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? t('login_button_loading') : t('login_button')}
          {!loading && <ArrowRight size={16} aria-hidden="true" className="rtl:-scale-x-100" />}
        </Button>
      </form>

      <p className="mt-6 border-t border-neutral-200 pt-6 text-sm text-neutral-600">
        {t('login_new_here')}{' '}
        <Link to="/register" className="font-semibold text-primary-600 hover:underline">
          {t('login_create_account')}
        </Link>
      </p>
      <p className="mt-2 text-[13px] text-neutral-500">{t('login_admin_note')}</p>
    </AuthLayout>
  )
}
