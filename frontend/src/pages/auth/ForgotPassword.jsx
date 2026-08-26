import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Alert } from '../../components/UI'
import Toast from '../../components/Toast'

export default function ForgotPassword() {
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
      setToast({ message: 'Check your email for reset instructions!', type: 'success' })
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to send reset email. Try again.'
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

        <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-3xl items-center justify-center">
          <div className="w-full overflow-hidden rounded-[14px] border border-green-100 bg-white shadow-[0_18px_56px_rgba(27,67,50,0.10)]">
            <div className="p-4 sm:p-6">
              <Link to="/login" className="text-sm font-semibold text-[#5d7067] hover:text-[#173b2b]">
                ← Back to Login
              </Link>

              <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#baf0c9] text-4xl text-[#173b2b]">
                ↺
              </div>

              <div className="mt-6 text-center">
                <p className="text-[26px] font-serif text-[#1c4b37]">Password Reset Karein</p>
                <p className="mt-2 text-sm text-[#6b7c73]">Enter your registered email address to receive a secure recovery link.</p>
              </div>

              {error && <Alert message={error} type="error" className="mt-5" />}

              {submitted ? (
                <div className="mt-6 space-y-4 text-center">
                  <div className="text-6xl">✓</div>
                  <p className="text-gray-600">
                    Password reset instructions have been sent to your email. Check your inbox and follow the link to reset your password.
                  </p>
                  <Link to="/login" className="font-semibold text-[#2f6a4d] hover:text-[#173b2b]">
                    Back to Login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-[#274638]">
                      <label>Email Address</label>
                      <span>ای میل کا پتہ</span>
                    </div>
                    <div className="flex overflow-hidden rounded border border-[#d6e3d9] bg-white focus-within:border-[#2f6a4d] focus-within:ring-2 focus-within:ring-[#2f6a4d]/20">
                      <span className="border-r border-[#d6e3d9] bg-[#f4f9f5] px-3 py-2 text-sm text-[#54685d]">✉</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.pk"
                        className="w-full border-0 px-4 py-2 text-sm text-gray-900 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full !rounded-none !bg-[#e07c12] !py-3 text-base font-bold uppercase tracking-wide hover:!bg-[#c46a10]"
                    loading={loading}
                  >
                    {loading ? 'Sending...' : 'Reset Link Bhejain'}
                    <span>➜</span>
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center text-sm text-[#596a61]">
                Still having trouble?{' '}
                <a href="#" className="font-semibold text-[#1f5b43] hover:text-[#154430]">
                  Contact Support
                </a>
              </div>

              <div className="mt-6 border-t border-[#e4ebe6] pt-4 text-center text-[10px] uppercase tracking-[0.24em] text-[#8ea095]">
                Road Safety Pakistan Official Portal
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}