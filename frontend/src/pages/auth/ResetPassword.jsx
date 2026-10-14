import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { authService } from '../../services/api'
import AuthLayout from '../../components/AuthLayout'
import { Button, Alert, FormField, BilingualHeading } from '../../components/UI'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { useLanguage } from '../../context/LanguageContext'

// Landing page for the link in the password-reset email.
export default function ResetPassword() {
  useDocumentTitle('title_reset')
  const { t } = useLanguage()
  const { uid, token } = useParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError(t('register_password_mismatch'))
      return
    }
    setLoading(true)
    try {
      await authService.confirmPasswordReset({ uid, token, new_password: password, confirm_password: confirm })
      setDone(true)
    } catch (err) {
      const data = err.response?.data || {}
      // Password-rule messages come from Django in English; an expired link
      // has its own translated message.
      setError(data.new_password?.join(' ') || data.confirm_password?.join(' ') || t('reset_invalid_link'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900">
        <ArrowLeft size={14} aria-hidden="true" className="rtl:-scale-x-100" />
        {t('forgot_back_to_login')}
      </Link>

      <BilingualHeading titleKey="reset_title" />

      {done ? (
        <div className="mt-8 border-t border-neutral-200 pt-6" role="status">
          <div className="flex gap-3">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
            <p className="text-[15px] text-neutral-700">{t('reset_done')}</p>
          </div>
          <Link to="/login" className="mt-6 inline-flex h-11 items-center rounded-sm bg-primary-500 px-5 text-[15px] font-semibold text-white hover:bg-primary-600">
            {t('nav_login')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && <Alert message={error} type="error" />}
          <FormField id="reset-password" labelKey="reset_new_password">
            <input id="reset-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" required minLength={8} />
          </FormField>
          <FormField id="reset-confirm" labelKey="register_confirm_password">
            <input id="reset-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="field" required minLength={8} />
          </FormField>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {t('reset_submit')}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
