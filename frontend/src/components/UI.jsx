import { X, Loader2 } from 'lucide-react'

export function Button({ children, className = '', variant = 'primary', size = 'md', loading = false, ...props }) {
  const baseClass = 'font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2'

  const variants = {
    primary:   'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
    secondary: 'border border-primary-500 text-primary-600 hover:bg-primary-50',
    danger:    'bg-danger text-white hover:bg-red-700',
    ghost:     'text-primary-600 hover:bg-primary-50',
    accent:    'bg-accent text-white hover:bg-accent-dark',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      disabled={loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

const cardVariants = {
  default:  'bg-white rounded-lg shadow-base p-6',
  flat:     'bg-white rounded-lg border border-neutral-100 p-6',
  elevated: 'bg-white rounded-xl shadow-elevated p-8',
}

export function Card({ children, className = '', variant = 'default', ...props }) {
  return (
    <div className={`${cardVariants[variant]} ${className}`} {...props}>
      {children}
    </div>
  )
}

export function Alert({ message, type = 'info', className = '', ...props }) {
  const colors = {
    success: 'bg-primary-50 border border-primary-200 text-primary-700',
    error:   'bg-red-50 border border-red-200 text-red-800',
    warning: 'bg-amber-50 border border-amber-200 text-amber-800',
    info:    'bg-info-light border border-blue-200 text-info',
  }

  return (
    <div className={`p-4 rounded-lg ${colors[type]} ${className}`} {...props}>
      {message}
    </div>
  )
}

export function Modal({ isOpen, onClose, title, children, className = '' }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-elevated max-w-md w-full max-h-96 overflow-y-auto ${className}`}>
        <div className="flex justify-between items-center p-6 border-b border-neutral-100">
          <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default:  'bg-neutral-100 text-neutral-700',
    primary:  'bg-primary-100 text-primary-700',
    danger:   'bg-red-100 text-red-800',
    warning:  'bg-amber-100 text-amber-800',
    critical: 'bg-urgency-critical text-white',
    high:     'bg-urgency-high text-white',
    medium:   'bg-urgency-medium text-white',
    low:      'bg-urgency-low text-white',
    resolved: 'bg-success text-white',
    info:     'bg-info-light text-info',
    accent:   'bg-accent-light text-accent-dark',
  }

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
