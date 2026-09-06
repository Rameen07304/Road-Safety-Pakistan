import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Alert } from '../../components/UI'
import Toast from '../../components/Toast'
import { ArrowLeft, ArrowRight, Mail, RotateCcw, CheckCircle2 } from 'lucide-react'

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
      <div className="min-h-[calc(100vh-64px)] bg-neutral-50 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-3xl items-center justify-center">
          <div className="w-full overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-elevated">
            <div className="p-4 sm:p-6">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-primary-700 transition">
                <ArrowLeft size={14} />
                Back to Login
              </Link>

              <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                <RotateCcw size={32} />
              </div>

              <div className="mt-6 text-center">
                <p className="text-[26px] font-serif text-primary-700">Password Reset Karein</p>
                <p className="mt-2 text-sm text-neutral-500">Enter your registered email address to receive a secure recovery link.</p>
              </div>

              {error && <Alert message={error} type="error" className="mt-5" />}

              {submitted ? (
                <div className="mt-6 space-y-4 text-center">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={36} className="text-success" />
                    </div>
                  </div>
                  <p className="text-neutral-500">
                    Password reset instructions have been sent to your email. Check your inbox and follow the link to reset your password.
                  </p>
                  <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                    Back to Login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-primary-700">
                      <label>Email Address</label>
                      <span>ای میل کا پتہ</span>
                    </div>
                    <div className="flex overflow-hidden rounded-lg border border-neutral-200 bg-white focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-300/30">
                      <span className="border-r border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-400">
                        <Mail size={14} />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.pk"
                        className="w-full border-0 px-4 py-2 text-sm text-neutral-900 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full !rounded-lg !bg-accent !py-3 text-base font-bold uppercase tracking-wide hover:!bg-accent-dark"
                    loading={loading}
                  >
                    {loading ? 'Sending...' : 'Reset Link Bhejain'}
                    <ArrowRight size={16} />
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center text-sm text-neutral-500">
                Still having trouble?{' '}
                <a href="#" className="font-semibold text-primary-600 hover:text-primary-700">
                  Contact Support
                </a>
              </div>

              <div className="mt-6 border-t border-neutral-100 pt-4 text-center text-[10px] uppercase tracking-[0.24em] text-neutral-400">
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
