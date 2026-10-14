import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { api } from '../../services/api'
import AuthLayout from '../../components/AuthLayout'
import { Button, Alert, FormField, BilingualHeading } from '../../components/UI'
import Toast from '../../components/Toast'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export default function Register() {
  useDocumentTitle('title_register')
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    id_type: 'cnic',
    password: '',
    password_confirm: '',
    cnic: '',
    cnic_part1: '',
    cnic_part2: '',
    cnic_part3: '',
    passport_number: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useLanguage()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // CNIC helpers: enforce numeric, maxlength per segment and auto-advance
  const cnic1Ref = useRef(null)
  const cnic2Ref = useRef(null)
  const cnic3Ref = useRef(null)

  const handleCnicChange = (e, part) => {
    let val = e.target.value.replace(/\D/g, '')
    const max = part === 1 ? 5 : part === 2 ? 7 : 1
    if (val.length > max) val = val.slice(0, max)
    if (part === 1) setFormData(prev => ({ ...prev, cnic_part1: val }))
    if (part === 2) setFormData(prev => ({ ...prev, cnic_part2: val }))
    if (part === 3) setFormData(prev => ({ ...prev, cnic_part3: val }))
    // auto-advance
    if (val.length === max) {
      if (part === 1) cnic2Ref.current?.focus()
      if (part === 2) cnic3Ref.current?.focus()
    }
  }

  const handleCnicPaste = (e) => {
    const text = (e.clipboardData || window.clipboardData).getData('text')
    const digits = text.replace(/\D/g, '')
    if (!digits) return
    // fill parts: 5,7,1
    const p1 = digits.slice(0, 5)
    const p2 = digits.slice(5, 12)
    const p3 = digits.slice(12, 13)
    setFormData(prev => ({ ...prev, cnic_part1: p1, cnic_part2: p2, cnic_part3: p3 }))
    // focus last part if present
    if (p2.length < 7) cnic2Ref.current?.focus()
    else if (p3.length < 1) cnic3Ref.current?.focus()
    else cnic3Ref.current?.focus()
    e.preventDefault()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFormErrors({})

    if (formData.password !== formData.password_confirm) {
      setError(t('register_password_mismatch'))
      return
    }

    // Validate CNIC parts for CNIC id type
    if (formData.id_type === 'cnic') {
      if (!(formData.cnic_part1?.length === 5 && formData.cnic_part2?.length === 7 && formData.cnic_part3?.length === 1)) {
        setError(t('register_cnic_invalid'))
        return
      }
    }

    setLoading(true)

    try {
      // assemble CNIC from parts when id_type is cnic
      const assembledCnic = formData.id_type === 'cnic'
        ? `${formData.cnic_part1}-${formData.cnic_part2}-${formData.cnic_part3}`
        : ''

      const response = await api.post('/api/auth/register/', {
        full_name: formData.full_name,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        id_type: formData.id_type,
        password: formData.password,
        confirm_password: formData.password_confirm,
        cnic: assembledCnic || formData.cnic,
        passport_number: formData.passport_number,
      })

      const { user, tokens } = response.data
      login(user, tokens)
      
      setToast({ message: t('register_success'), type: 'success' })
      setFormErrors({})
      setTimeout(() => {
        navigate('/report')
      }, 1500)
    } catch (err) {
      const data = err.response?.data
      
      // parse error payload into readable messages per-field
      if (data && typeof data === 'object') {
        const parsed = {}
        for (const [k, v] of Object.entries(data)) {
          if (Array.isArray(v)) parsed[k] = v.join(' ')
          else if (v === null || v === undefined) parsed[k] = ''
          else if (typeof v === 'object') parsed[k] = JSON.stringify(v)
          else parsed[k] = String(v)
        }
        setFormErrors(parsed)
        const firstMessage = parsed.detail || Object.values(parsed)[0] || t('register_failed')
        setError(firstMessage)
        setToast({ message: firstMessage, type: 'error' })
      } else {
        const message = t('register_failed')
        setError(message)
        setToast({ message, type: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }

  // Rough guide only; the backend's password validators have the final say.
  const pw = formData.password
  const strengthScore = [pw.length >= 8, /[A-Z]/.test(pw) && /[a-z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length
  const strength = strengthScore <= 1 ? 'weak' : strengthScore <= 3 ? 'medium' : 'strong'
  const strengthBar = { weak: 'w-1/3 bg-danger', medium: 'w-2/3 bg-warning', strong: 'w-full bg-success' }[strength]

  return (
    <AuthLayout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <BilingualHeading titleKey="register_title" subtitleKey="register_subtitle" />

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && <Alert message={error} type="error" />}

        <FormField id="reg-full-name" labelKey="register_full_name">
          <input id="reg-full-name" type="text" name="full_name" autoComplete="name" value={formData.full_name} onChange={handleChange} placeholder={t('register_name_placeholder')} className="field" required />
        </FormField>

        <FormField id="reg-email" labelKey="register_email" error={formErrors.email}>
          <input id="reg-email" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} placeholder="ahmed@example.pk" className="field" dir="ltr" required />
        </FormField>

        <FormField id="reg-phone" labelKey="register_phone" error={formErrors.phone}>
          <div className="flex" dir="ltr">
            <span className="flex items-center rounded-s-sm border border-e-0 border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-600">+92</span>
            <input id="reg-phone" type="tel" name="phone" autoComplete="tel-national" value={formData.phone} onChange={handleChange} placeholder="300 1234567" className="field rounded-s-none" required />
          </div>
        </FormField>

        <FormField id="reg-id-type" labelKey="register_id_type" error={formErrors.id_type}>
          <select id="reg-id-type" name="id_type" value={formData.id_type} onChange={handleChange} className="field">
            <option value="cnic">{t('register_id_cnic')}</option>
            <option value="passport">{t('register_id_passport')}</option>
          </select>
        </FormField>

        <FormField
          id="reg-id-number"
          labelKey={formData.id_type === 'passport' ? 'register_passport_number' : 'register_cnic_number'}
          error={formErrors.cnic || formErrors.passport_number}
        >
          {formData.id_type === 'passport' ? (
            <input id="reg-id-number" type="text" name="passport_number" value={formData.passport_number} onChange={handleChange} placeholder="AB1234567" className="field" dir="ltr" required />
          ) : (
            <div className="grid grid-cols-[5fr_auto_7fr_auto_2fr] items-center gap-1.5" dir="ltr">
              <input id="reg-id-number" ref={cnic1Ref} type="text" inputMode="numeric" name="cnic_part1" aria-label={t('register_cnic_part1')} value={formData.cnic_part1} onChange={(e) => handleCnicChange(e, 1)} onPaste={handleCnicPaste} placeholder="35202" maxLength={5} className="field tnum" required />
              <span className="text-neutral-500" aria-hidden="true">-</span>
              <input ref={cnic2Ref} type="text" inputMode="numeric" name="cnic_part2" aria-label={t('register_cnic_part2')} value={formData.cnic_part2} onChange={(e) => handleCnicChange(e, 2)} placeholder="1234567" maxLength={7} className="field tnum" required />
              <span className="text-neutral-500" aria-hidden="true">-</span>
              <input ref={cnic3Ref} type="text" inputMode="numeric" name="cnic_part3" aria-label={t('register_cnic_part3')} value={formData.cnic_part3} onChange={(e) => handleCnicChange(e, 3)} placeholder="1" maxLength={1} className="field text-center tnum" required />
            </div>
          )}
        </FormField>

        <div className="space-y-5">
          <FormField id="reg-password" labelKey="register_password" error={formErrors.password}>
            <input id="reg-password" type="password" name="password" autoComplete="new-password" value={formData.password} onChange={handleChange} className="field" required />
          </FormField>
          <FormField id="reg-password-confirm" labelKey="register_confirm_password" error={formErrors.password_confirm}>
            <input id="reg-password-confirm" type="password" name="password_confirm" autoComplete="new-password" value={formData.password_confirm} onChange={handleChange} className="field" required />
          </FormField>
        </div>
        {pw && (
          <div className="-mt-2">
            <div className="h-1 bg-neutral-200">
              <div className={`h-full transition-all ${strengthBar}`} />
            </div>
            <p className="mt-1.5 text-[13px] text-neutral-600" aria-live="polite">{t(`register_strength_${strength}`)}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? t('register_submit_loading') : t('register_submit')}
        </Button>
      </form>

      <p className="mt-6 border-t border-neutral-200 pt-6 text-sm text-neutral-600">
        {t('register_already_have')}{' '}
        <Link to="/login" className="font-semibold text-primary-600 hover:underline">
          {t('nav_login')}
        </Link>
      </p>
    </AuthLayout>
  )
}
