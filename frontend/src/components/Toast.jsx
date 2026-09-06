import { useState, useEffect } from 'react'
import { Check, X, AlertTriangle, Info } from 'lucide-react'

export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const bgColor = {
    success: 'bg-success',
    error:   'bg-danger',
    warning: 'bg-warning',
    info:    'bg-info',
  }[type] || 'bg-neutral-600'

  const Icon = {
    success: Check,
    error:   X,
    warning: AlertTriangle,
    info:    Info,
  }[type] || Check

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-elevated flex items-center gap-3 z-50`}>
      <Icon size={18} strokeWidth={2.5} />
      <span className="font-medium">{message}</span>
      <button
        onClick={() => setIsVisible(false)}
        className="ml-3 text-white/80 hover:text-white transition"
      >
        <X size={16} />
      </button>
    </div>
  )
}
