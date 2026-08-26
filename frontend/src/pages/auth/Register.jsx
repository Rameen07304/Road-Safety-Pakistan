import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Alert, Card } from '../../components/UI'
import Toast from '../../components/Toast'

export default function Register() {
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
      console.error('Registration error response:', data)
      console.error('Full error:', err)
      
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#eef6f0] px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-6xl items-stretch overflow-hidden rounded-[18px] border border-green-100 bg-white shadow-[0_24px_80px_rgba(27,67,50,0.12)] lg:grid lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative min-h-[240px] overflow-hidden bg-gradient-to-br from-[#1f4c39] via-[#244f3c] to-[#143627] px-6 py-8 text-white sm:px-8 lg:px-10 lg:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_40%),linear-gradient(rgba(4,24,15,0.18),rgba(4,24,15,0.55))]" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-10 flex items-center gap-2 text-sm font-semibold text-white/95">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/12 text-base">🛡️</span>
                  Road Safety Pakistan
                </div>

                <h1 className="max-w-[14ch] text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem]">
                  Lahore ki Sadkon Ko Behtar Banayein
                </h1>
                <p className="mt-6 text-3xl font-light text-[#d5f2df] sm:text-4xl" style={{ fontFamily: 'serif' }}>
                  آج ہی رجسٹر کریں
                </p>
              </div>

              <div className="mt-12 space-y-4 text-sm text-white/90">
                <div className="flex gap-3">
                  <span className="mt-0.5 text-[#8ef0b4]">✓</span>
                  <p>Report hazards like potholes and open manholes in seconds.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-0.5 text-[#8ef0b4]">✓</span>
                  <p>Track the resolution status of your complaints in real-time.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-0.5 text-[#8ef0b4]">✓</span>
                  <p>Help the authorities build a safer Lahore for everyone.</p>
                </div>
              </div>
            </div>
          </aside>

          <main className="px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
            <div className="mx-auto max-w-xl">
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-3xl font-black text-[#173b2b] sm:text-4xl">Naya Account Banayein</h2>
                <p className="mt-2 text-sm text-[#6b7c73]">Join the community-led initiative for safer roads.</p>
              </div>

              {error && <Alert message={error} type="error" className="mb-5" />}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-[#274638]">
                    <label>Full Name</label>
                    <span>نام</span>
                  </div>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="e.g. Ahmed Khan"
                    className="w-full rounded border border-[#d6e3d9] bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-[#2f6a4d] focus:ring-2 focus:ring-[#2f6a4d]/20"
                    required
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-[#274638]">
                    <label>Email Address</label>
                    <span>ای میل</span>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ahmed@example.pk"
                    className="w-full rounded border border-[#d6e3d9] bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-[#2f6a4d] focus:ring-2 focus:ring-[#2f6a4d]/20"
                    required
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-[#274638]">
                    <label>Phone Number</label>
                    <span>فون نمبر</span>
                  </div>
                  <div className="flex overflow-hidden rounded border border-[#d6e3d9] bg-white focus-within:border-[#2f6a4d] focus-within:ring-2 focus-within:ring-[#2f6a4d]/20">
                    <span className="border-r border-[#d6e3d9] bg-[#f4f9f5] px-3 py-2 text-sm text-[#54685d]">+92</span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="300 1234567"
                      className="w-full border-0 px-4 py-2 text-sm outline-none"
                      required
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-[#274638]">
                    <label>ID Type</label>
                    <span>شناختی دستاویز</span>
                  </div>
                  <select
                    name="id_type"
                    value={formData.id_type}
                    onChange={handleChange}
                    className="w-full rounded border border-[#d6e3d9] bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-[#2f6a4d] focus:ring-2 focus:ring-[#2f6a4d]/20"
                  >
                    <option value="cnic">CNIC (Computerized National ID Card)</option>
                    <option value="passport">Passport</option>
                  </select>
                    {formErrors.id_type && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.id_type}</p>
                    )}
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-[#274638]">
                    <label>CNIC Number</label>
                    <span>شناختی نمبر</span>
                  </div>
                  {formData.id_type === 'passport' ? (
                    <input
                      type="text"
                      name="passport_number"
                      value={formData.passport_number}
                      onChange={handleChange}
                      placeholder="AB1234567"
                      className="w-full rounded border border-[#d6e3d9] bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#2f6a4d] focus:ring-2 focus:ring-[#2f6a4d]/20"
                      required
                    />
                  ) : (
                    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-2">
                      <input
                        ref={cnic1Ref}
                        type="text"
                        inputMode="numeric"
                        name="cnic_part1"
                        value={formData.cnic_part1}
                        onChange={(e) => handleCnicChange(e, 1)}
                        onPaste={handleCnicPaste}
                        placeholder="35202"
                        maxLength={5}
                        className="w-full rounded border border-[#d6e3d9] bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#2f6a4d] focus:ring-2 focus:ring-[#2f6a4d]/20"
                        required
                      />
                      <span className="self-center text-[#8aa092]">-</span>
                      <input
                        ref={cnic2Ref}
                        type="text"
                        inputMode="numeric"
                        name="cnic_part2"
                        value={formData.cnic_part2}
                        onChange={(e) => handleCnicChange(e, 2)}
                        placeholder="1234567"
                        maxLength={7}
                        className="w-full rounded border border-[#d6e3d9] bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#2f6a4d] focus:ring-2 focus:ring-[#2f6a4d]/20"
                        required
                      />
                      <span className="self-center text-[#8aa092]">-</span>
                      <input
                        ref={cnic3Ref}
                        type="text"
                        inputMode="numeric"
                        name="cnic_part3"
                        value={formData.cnic_part3}
                        onChange={(e) => handleCnicChange(e, 3)}
                        placeholder="1"
                        maxLength={1}
                        className="w-full rounded border border-[#d6e3d9] bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#2f6a4d] focus:ring-2 focus:ring-[#2f6a4d]/20"
                        required
                      />
                    </div>
                  )}
                  {formErrors.cnic && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.cnic}</p>
                  )}
                  {formErrors.passport_number && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.passport_number}</p>
                  )}
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-[#274638]">
                    <label>Password</label>
                    <span>پاس ورڈ</span>
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded border border-[#d6e3d9] bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-[#2f6a4d] focus:ring-2 focus:ring-[#2f6a4d]/20"
                    required
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                  )}
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-[#274638]">
                      <label>Confirm Password</label>
                      <span>پاس ورڈ دوبارہ</span>
                    </div>
                    <input
                      type="password"
                      name="password_confirm"
                      value={formData.password_confirm}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full rounded border border-[#d6e3d9] bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-[#2f6a4d] focus:ring-2 focus:ring-[#2f6a4d]/20"
                      required
                    />
                    {formErrors.password_confirm && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.password_confirm}</p>
                    )}
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7efe9]">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#7ccf99] via-[#4fa66a] to-[#2f6a4d]" />
                  </div>
                  <p className="mt-1 text-[11px] text-[#6f7f75]">Strength: Medium. Use symbols for better security.</p>
                </div>

                <Button
                  type="submit"
                  className="mt-2 w-full !rounded-none !bg-[#e07c12] !py-3 text-base font-bold uppercase tracking-wide hover:!bg-[#c46a10]"
                  loading={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-5 text-center text-sm text-[#596a61]">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-[#1f5b43] hover:text-[#154430]">
                  Login
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-[#a2afaa]">
                <span className="h-px flex-1 bg-[#e2e9e4]" />
                Verified by Punjab IT Board
                <span className="h-px flex-1 bg-[#e2e9e4]" />
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  )
}
