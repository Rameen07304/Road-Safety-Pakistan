import { urgency, success } from '../theme/colors'

// Urgency level → literal colours for Leaflet map pins.
// Sourced from the shared palette so they cannot drift from the Tailwind tokens.
export const urgencyColors = {
  critical: urgency.critical,
  high:     urgency.high,
  medium:   urgency.medium,
  low:      urgency.low,
  resolved: success.DEFAULT,
}

// Legend shape per urgency level, as an SVG string for Leaflet divIcons (the
// React <UrgencyMark> draws the same shapes): critical = triangle,
// high = diamond, medium = square, low = circle.
const MARK_SHAPES = {
  critical: '<path d="M12 2.5 L22 20.5 H2 Z"/>',
  high: '<path d="M12 1.5 L22.5 12 L12 22.5 L1.5 12 Z"/>',
  medium: '<path d="M3.5 3.5 H20.5 V20.5 H3.5 Z"/>',
  low: '<circle cx="12" cy="12" r="9.5"/>',
}

export const urgencyMarkSvg = (level, size = 20) => {
  const key = MARK_SHAPES[level] ? level : 'low'
  const fill = urgencyColors[key]
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:block;filter:drop-shadow(0 1px 1.5px rgba(22,25,28,.35))"><g fill="${fill}" stroke="#fff" stroke-width="2" stroke-linejoin="miter">${MARK_SHAPES[key]}</g></svg>`
}

// A smaller copy of a Cloudinary photo (resized, compressed, modern format)
// for thumbnails and cards: a phone photo is several MB, too much on mobile
// data just to see the road. Other URLs are returned unchanged.
export const sizedPhoto = (url, width) =>
  url && url.includes('res.cloudinary.com/') && url.includes('/image/upload/')
    ? url.replace('/image/upload/', `/image/upload/w_${width},c_limit,q_auto,f_auto/`)
    : url

// Status → Tailwind color classes
export const statusClasses = {
  submitted:   'bg-neutral-100 text-neutral-700',
  verified:    'bg-info-50 text-info-700',
  in_progress: 'bg-warning-50 text-warning-700',
  resolved:    'bg-success-50 text-success-700',
  rejected:    'bg-danger-50 text-danger-700',
}

// Format date to readable string
export const formatDate = (dateString, locale = 'en-PK') => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString(
    locale, {
      day:    'numeric',
      month:  'short',
      year:   'numeric',
      hour:    '2-digit',
      minute:  '2-digit',
    }
  )
}