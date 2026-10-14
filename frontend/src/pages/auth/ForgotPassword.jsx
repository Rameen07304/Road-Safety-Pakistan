import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import AuthLayout from '../../components/AuthLayout'
import { Button, Alert, FormField, BilingualHeading } from '../../components/UI'
import Toast from '../../components/Toast'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { useLanguage } from '../../context/LanguageContext'

export default function ForgotPassword() {
  useDocumentTitle('title_reset')
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/api/auth/password-reset/', {
        email: email.toLowerCase(),
      })

      setSubmitted(true)
      setToast({ message: t('forgot_success'), type: 'success' })
    } catch (err) {
      const message = err.response?.data?.detail || t('forgot_failed')
      setError(message)
      setToast({ message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900">
        <ArrowLeft size={14} aria-hidden="true" className="rtl:-scale-x-100" />
        {t('forgot_back_to_login')}
      </Link>

      <BilingualHeading titleKey="forgot_title" subtitleKey="forgot_subtitle" />

      {submitted ? (
        <div className="mt-8 flex gap-3 border-t border-neutral-200 pt-6" role="status">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
          <p className="text-[15px] text-neutral-700">{t('forgot_sent')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && <Alert message={error} type="error" />}
          <FormField id="forgot-email" labelKey="login_email_label">
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.pk"
              className="field"
              dir="ltr"
              required
            />
          </FormField>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {loading ? t('forgot_sending') : t('forgot_send')}
          </Button>
        </form>
      )}

      <p className="mt-6 border-t border-neutral-200 pt-6 text-sm text-neutral-600">
        {t('forgot_trouble')}{' '}
        <a href="mailto:info@roadsafetypk.org" className="font-semibold text-primary-600 hover:underline">
          {t('forgot_contact_support')}
        </a>
      </p>
    </AuthLayout>
  )
}
