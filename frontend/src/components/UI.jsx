export function Button({ children, className = '', variant = 'primary', size = 'md', loading = false, ...props }) {
  const baseClass = 'font-semibold rounded transition duration-200 flex items-center justify-center gap-2'
  
  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700',
    secondary: 'border border-green-600 text-green-600 hover:bg-green-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-green-600 hover:bg-green-50',
  }

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      disabled={loading}
      {...props}
    >
      {loading && <span className="animate-spin">⏳</span>}
      {children}
    </button>
  )
}

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function Alert({ message, type = 'info', className = '', ...props }) {
  const colors = {
    success: 'bg-green-50 border border-green-200 text-green-800',
    error: 'bg-red-50 border border-red-200 text-red-800',
    warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border border-blue-200 text-blue-800',
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto ${className}`}>
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ✕
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
    default: 'bg-gray-200 text-gray-800',
    primary: 'bg-green-200 text-green-800',
    danger: 'bg-red-200 text-red-800',
    warning: 'bg-yellow-200 text-yellow-800',
    critical: 'bg-red-600 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-green-500 text-white',
  }

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
