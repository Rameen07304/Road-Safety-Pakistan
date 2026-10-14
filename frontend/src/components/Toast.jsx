import { useState, useEffect } from 'react'
import { Check, X, AlertTriangle, Info } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const iconColor = {
    success: 'text-[#7fd3a4]',
    error:   'text-[#ff9b9b]',
    warning: 'text-[#f2c66d]',
    info:    'text-[#9cc1ec]',
  }[type] || 'text-white'

  const Icon = {
    success: Check,
    error:   X,
    warning: AlertTriangle,
    info:    Info,
  }[type] || Check

  return (
    // Live region so screen readers announce the result of the action.
    <div role={type === 'error' ? 'alert' : 'status'} className="fixed top-20 end-4 z-50 flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-sm bg-neutral-900 px-4 py-3 text-sm text-white shadow-elevated sm:max-w-md">
      <Icon size={18} strokeWidth={2.5} className={`mt-0.5 shrink-0 ${iconColor}`} aria-hidden="true" />
      <span className="font-medium">{message}</span>
      <button
        type="button"
        aria-label={t('common_close')}
        onClick={() => setIsVisible(false)}
        className="-m-1 ms-2 p-1 text-white/70 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}
