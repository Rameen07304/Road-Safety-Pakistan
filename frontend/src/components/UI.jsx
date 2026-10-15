import { Loader2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { translate } from '../translations/translations'
import { urgency as urgencyColors } from '../theme/colors'

export function Button({ children, className = '', variant = 'primary', size = 'md', loading = false, ...props }) {
  const baseClass = 'inline-flex items-center justify-center gap-2 rounded-sm font-semibold whitespace-nowrap transition-colors duration-150'

  // Survey blue is reserved for actions; secondary actions are outlined ink.
  const variants = {
    primary:   'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
    secondary: 'border border-neutral-300 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50',
    danger:    'bg-danger text-white hover:bg-danger-700',
    ghost:     'text-primary-600 hover:bg-primary-50',
    accent:    'bg-neutral-900 text-white hover:bg-neutral-800',
  }

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-[15px]',
    lg: 'h-12 px-5 text-base',
  }

  return (
    <button
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      disabled={loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

// A bordered panel. Used for genuinely separate work areas only; page sections
// sit directly on the ground and are divided by rules instead.
const cardVariants = {
  default:  'bg-white border border-neutral-200 rounded-sm p-6',
  flat:     'bg-white border border-neutral-200 rounded-sm p-6',
  elevated: 'bg-white border border-neutral-200 rounded-sm p-6 sm:p-8',
}

export function Card({ children, className = '', variant = 'default', ...props }) {
  return (
    <div className={`${cardVariants[variant] || cardVariants.default} ${className}`} {...props}>
      {children}
    </div>
  )
}

export function Alert({ message, type = 'info', className = '', ...props }) {
  const colors = {
    success: 'bg-success-50 border-success-200 text-success-700',
    error:   'bg-danger-50 border-danger-200 text-danger-700',
    warning: 'bg-warning-50 border-warning-200 text-warning-700',
    info:    'bg-info-50 border-info-200 text-info-700',
  }

  return (
    <div
      role={type === 'error' ? 'alert' : undefined}
      className={`rounded-sm border px-4 py-3 text-sm ${colors[type]} ${className}`}
      {...props}
    >
      {message}
    </div>
  )
}

/**
 * The map legend: every urgency level has a shape as well as a colour, so it
 * reads the same on a map pin, in a table and for colour-blind users.
 * critical = triangle, high = diamond, medium = square, low = circle.
 */
const MARK_PATHS = {
  critical: 'M6 1 L11.2 10.5 H0.8 Z',
  high: 'M6 0.5 L11.5 6 L6 11.5 L0.5 6 Z',
  medium: 'M1.5 1.5 H10.5 V10.5 H1.5 Z',
  low: null,
}

export function UrgencyMark({ level, size = 10, className = '' }) {
  const key = String(level || '').toLowerCase()
  const color = urgencyColors[key] || urgencyColors.low
  const path = MARK_PATHS[key]
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" className={`shrink-0 ${className}`} aria-hidden="true">
      {path ? <path d={path} fill={color} /> : <circle cx="6" cy="6" r="5" fill={color} />}
    </svg>
  )
}

const URGENCY_LEVELS = ['critical', 'high', 'medium', 'low']

export function Badge({ children, variant = 'default', className = '' }) {
  const key = String(variant || '').toLowerCase()
  const base = 'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-semibold whitespace-nowrap'

  // Urgency is shown with its legend mark on a neutral chip rather than as a
  // block of colour, so a table of mixed urgencies stays calm and scannable.
  if (URGENCY_LEVELS.includes(key)) {
    return (
      <span className={`${base} border border-neutral-200 bg-white text-neutral-800 ${className}`}>
        <UrgencyMark level={key} />
        {children}
      </span>
    )
  }

  const variants = {
    default:  'bg-neutral-100 text-neutral-700',
    primary:  'bg-primary-50 text-primary-700',
    danger:   'bg-danger-50 text-danger-700',
    warning:  'bg-warning-50 text-warning-700',
    resolved: 'bg-success-50 text-success-700',
    success:  'bg-success-50 text-success-700',
    info:     'bg-info-50 text-info-700',
    accent:   'bg-accent-light text-accent-dark',
  }

  return (
    <span className={`${base} ${variants[key] || variants.default} ${className}`}>
      {children}
    </span>
  )
}

/**
 * Bilingual page-title band, set like a Pakistani road sign: the title in the
 * reader's language, the other language beneath it, on sign green.
 */
export function PageTitle({ titleKey, subtitle, actions, compact = false }) {
  const { t, language } = useLanguage()
  const other = language === 'ur' ? 'en' : 'ur'
  return (
    <div className="bg-sign text-white">
      <div className={`mx-auto flex max-w-page flex-wrap items-end justify-between gap-x-8 gap-y-4 px-4 sm:px-6 lg:px-8 ${compact ? 'py-4' : 'py-7 sm:py-8'}`}>
        <div className="min-w-0">
          <h1 className={`font-heading font-bold text-white ${compact ? 'text-xl' : 'text-2xl sm:text-[28px]'}`}>
            {t(titleKey)}
          </h1>
          {/* Aligned to the page's reading start, not the other script's own start. */}
          <p lang={other} dir={other === 'ur' ? 'rtl' : 'ltr'} style={{ textAlign: language === 'ur' ? 'right' : 'left' }} className={`mt-0.5 text-white/85 ${compact ? 'text-sm' : 'text-base'}`}>
            {translate(other, titleKey)}
          </p>
          {subtitle && <p className="mt-3 max-w-2xl text-sm text-white/85">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/**
 * Brand mark: a survey triangulation point, the symbol a city survey uses for
 * a fixed, measured location. Every report is one.
 */
export function LogoMark({ size = 32, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={`shrink-0 ${className}`} aria-hidden="true">
      <rect width="32" height="32" rx="2" fill="#0b6b3a" />
      <path d="M16 6.5 L26 24.5 H6 Z" fill="none" stroke="#ffffff" strokeWidth="2.25" strokeLinejoin="miter" />
      <circle cx="16" cy="18.5" r="2.4" fill="#ffffff" />
    </svg>
  )
}

/**
 * Form field with its label in the reader's language and, quietly beside it,
 * the other language, the way bilingual road signs carry both.
 */
export function FormField({ id, labelKey, error, children, className = '' }) {
  const { t, language } = useLanguage()
  const other = language === 'ur' ? 'en' : 'ur'
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-neutral-800">{t(labelKey)}</label>
        <span lang={other} dir={other === 'ur' ? 'rtl' : 'ltr'} className="text-[13px] text-neutral-500" aria-hidden="true">
          {translate(other, labelKey)}
        </span>
      </div>
      {children}
      {error && <p className="mt-1.5 text-sm text-danger-700">{error}</p>}
    </div>
  )
}

/** Page heading with the other language beneath, like PageTitle on white. */
export function BilingualHeading({ titleKey, subtitleKey }) {
  const { t, language } = useLanguage()
  const other = language === 'ur' ? 'en' : 'ur'
  return (
    <div>
      <h1 className="font-heading text-[28px] font-bold leading-tight">{t(titleKey)}</h1>
      <p lang={other} dir={other === 'ur' ? 'rtl' : 'ltr'} style={{ textAlign: language === 'ur' ? 'right' : 'left' }} className="mt-0.5 text-[15px] text-neutral-500" aria-hidden="true">
        {translate(other, titleKey)}
      </p>
      {subtitleKey && <p className="mt-4 text-[15px] text-neutral-600">{t(subtitleKey)}</p>}
    </div>
  )
}

/**
 * A row of figures divided by hairlines (1px gaps over the rule colour), the
 * sheet's margin table. Replaces stat cards.
 */
export function StatStrip({ items, className = '' }) {
  const cols = { 2: 'grid-cols-2', 3: 'grid-cols-2 sm:grid-cols-3', 4: 'grid-cols-2 lg:grid-cols-4', 5: 'grid-cols-2 lg:grid-cols-5', 6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' }[items.length] || 'grid-cols-2 lg:grid-cols-4'
  // An odd count in two columns would leave an empty hairline cell; the last
  // figure spans the row until the strip fits on one line.
  const lastSpan = { 3: 'col-span-2 sm:col-span-1', 5: 'col-span-2 lg:col-span-1' }[items.length] || ''
  return (
    <dl className={`grid gap-px border border-neutral-200 bg-neutral-200 ${cols} ${className}`}>
      {items.map((item, i) => {
        const span = i === items.length - 1 ? lastSpan : ''
        const body = (
          <>
            <dt className="label">{item.label}</dt>
            <dd className="mt-2 font-heading text-[28px] font-bold leading-none text-neutral-900 tnum">{item.value}</dd>
          </>
        )
        return item.onClick ? (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            aria-label={item.ariaLabel}
            className={`bg-white px-5 py-4 text-start transition-colors hover:bg-neutral-50 ${span}`}
          >
            {body}
          </button>
        ) : (
          <div key={item.label} className={`bg-white px-5 py-4 ${span}`}>{body}</div>
        )
      })}
    </dl>
  )
}
