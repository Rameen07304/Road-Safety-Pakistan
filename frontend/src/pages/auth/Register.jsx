import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Alert } from '../../components/UI'
import Toast from '../../components/Toast'
import { Shield, CheckCircle2 } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export default function Register() {
  useDocumentTitle('Create an Account')
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
      setError('Passwords do not match')
      return
    }

    // Validate CNIC parts for CNIC id type
    if (formData.id_type === 'cnic') {
      if (!(formData.cnic_part1?.length === 5 && formData.cnic_part2?.length === 7 && formData.cnic_part3?.length === 1)) {
        setError('Please enter a valid CNIC in the format XXXXX-XXXXXXX-X')
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
      
      setToast({ message: 'Registration successful! Welcome!', type: 'success' })
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
        const firstMessage = parsed.detail || Object.values(parsed)[0] || 'Registration failed. Try again.'
        setError(firstMessage)
        setToast({ message: firstMessage, type: 'error' })
      } else {
        const message = 'Registration failed. Try again.'
        setError(message)
        setToast({ message, type: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }

  const features = [
    'Report hazards like potholes and open manholes in seconds.',
    'Track the resolution status of your complaints in real-time.',
    'Help the authorities build a safer Lahore for everyone.',
  ]

  const inputBase = 'w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-300/30'
  const inputWithPrefix = 'flex overflow-hidden rounded-lg border border-neutral-200 bg-white focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-300/30'
  const prefixBase = 'border-r border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-400'
  const fieldErrorClass = 'mt-1 text-sm text-danger'

  return (
    <>
      <Header />
      <div className="min-h-screen bg-neutral-50 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-6xl items-stretch overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-elevated lg:grid lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative min-h-[240px] overflow-hidden bg-gradient-to-br from-primary-700 via-primary-700 to-primary-800 px-6 py-8 text-white sm:px-8 lg:px-10 lg:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_40%),linear-gradient(rgba(4,24,15,0.18),rgba(4,24,15,0.55))]" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-10 flex items-center gap-2 text-sm font-semibold text-white/95">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/12"><Shield size={16} /></span>
                  Road Safety Pakistan
                </div>

                <h1 className="max-w-[14ch] font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem]">
                  Lahore ki Sadkon Ko Behtar Banayein
                </h1>
                <p className="mt-6 text-3xl font-light text-primary-100 sm:text-4xl" style={{ fontFamily: 'serif' }}>
                  آج ہی رجسٹر کریں
                </p>
              </div>

              <div className="mt-12 space-y-4 text-sm text-white/90">
                {features.map((text, i) => (
                  <div key={i} className="flex gap-3">
                    <CheckCircle2 size={16} className="mt-0.5 text-primary-200 flex-shrink-0" />
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
            <div className="mx-auto max-w-xl">
              <div className="mb-8 text-center lg:text-left">
                <h2 className="font-heading text-3xl font-bold text-primary-800 sm:text-4xl">{t('register_title')}</h2>
                <p className="mt-2 text-sm text-neutral-500">{t('register_subtitle')}</p>
              </div>

              {error && <Alert message={error} type="error" className="mb-5" />}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-primary-700">
                    <label htmlFor="reg-full-name">Full Name</label>
                    <span>نام</span>
                  </div>
                  <input id="reg-full-name" type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="e.g. Ahmed Khan" className={inputBase} required />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-primary-700">
                    <label htmlFor="reg-email">Email Address</label>
                    <span>ای میل</span>
                  </div>
                  <input id="reg-email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="ahmed@example.pk" className={inputBase} required />
                  {formErrors.email && <p className={fieldErrorClass}>{formErrors.email}</p>}
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-primary-700">
                    <label htmlFor="reg-phone">Phone Number</label>
                    <span>فون نمبر</span>
                  </div>
                  <div className={inputWithPrefix}>
                    <span className={prefixBase}>+92</span>
                    <input id="reg-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="300 1234567" className="w-full border-0 px-4 py-2 text-sm outline-none" required />
                  </div>
                  {formErrors.phone && <p className={fieldErrorClass}>{formErrors.phone}</p>}
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-primary-700">
                    <label htmlFor="reg-id-type">ID Type</label>
                    <span>شناختی دستاویز</span>
                  </div>
                  <select id="reg-id-type" name="id_type" value={formData.id_type} onChange={handleChange} className={inputBase}>
                    <option value="cnic">CNIC (Computerized National ID Card)</option>
                    <option value="passport">Passport</option>
                  </select>
                  {formErrors.id_type && <p className={fieldErrorClass}>{formErrors.id_type}</p>}
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-primary-700">
                    <label htmlFor="reg-id-number">CNIC Number</label>
                    <span>شناختی نمبر</span>
                  </div>
                  {formData.id_type === 'passport' ? (
                    <input id="reg-id-number" type="text" name="passport_number" value={formData.passport_number} onChange={handleChange} placeholder="AB1234567" className={inputBase} required />
                  ) : (
                    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-2">
                      <input id="reg-id-number" ref={cnic1Ref} type="text" inputMode="numeric" name="cnic_part1" aria-label="CNIC first five digits" value={formData.cnic_part1} onChange={(e) => handleCnicChange(e, 1)} onPaste={handleCnicPaste} placeholder="35202" maxLength={5} className={inputBase} required />
                      <span className="self-center text-neutral-300">-</span>
                      <input ref={cnic2Ref} type="text" inputMode="numeric" name="cnic_part2" aria-label="CNIC middle seven digits" value={formData.cnic_part2} onChange={(e) => handleCnicChange(e, 2)} placeholder="1234567" maxLength={7} className={inputBase} required />
                      <span className="self-center text-neutral-300">-</span>
                      <input ref={cnic3Ref} type="text" inputMode="numeric" name="cnic_part3" aria-label="CNIC last digit" value={formData.cnic_part3} onChange={(e) => handleCnicChange(e, 3)} placeholder="1" maxLength={1} className={inputBase} required />
                    </div>
                  )}
                  {formErrors.cnic && <p className={fieldErrorClass}>{formErrors.cnic}</p>}
                  {formErrors.passport_number && <p className={fieldErrorClass}>{formErrors.passport_number}</p>}
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-primary-700">
                    <label htmlFor="reg-password">Password</label>
                    <span>پاس ورڈ</span>
                  </div>
                  <input id="reg-password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className={inputBase} required />
                  {formErrors.password && <p className={fieldErrorClass}>{formErrors.password}</p>}
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-primary-700">
                      <label htmlFor="reg-password-confirm">Confirm Password</label>
                      <span>پاس ورڈ دوبارہ</span>
                    </div>
                    <input id="reg-password-confirm" type="password" name="password_confirm" value={formData.password_confirm} onChange={handleChange} placeholder="••••••••" className={inputBase} required />
                    {formErrors.password_confirm && <p className={fieldErrorClass}>{formErrors.password_confirm}</p>}
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary-300 via-primary-400 to-primary-600" />
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-400">Strength: Medium. Use symbols for better security.</p>
                </div>

                <Button
                  type="submit"
                  className="mt-2 w-full !rounded-lg !bg-accent !py-3 text-base font-bold uppercase tracking-wide hover:!bg-accent-dark"
                  loading={loading}
                >
                  {loading ? t('register_submit_loading') : t('register_submit')}
                </Button>
              </form>

              <div className="mt-5 text-center text-sm text-neutral-500">
                {t('register_already_have')}{' '}
                <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                  {t('nav_login')}
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-neutral-300">
                <span className="h-px flex-1 bg-neutral-100" />
                Verified by Punjab IT Board
                <span className="h-px flex-1 bg-neutral-100" />
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  )
}
