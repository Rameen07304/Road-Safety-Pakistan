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

// Status → display label
export const statusLabels = {
  submitted:   'Submitted',
  verified:    'Verified',
  in_progress: 'In Progress',
  resolved:    'Resolved',
  rejected:    'Rejected',
}

// Status → Tailwind color classes
export const statusClasses = {
  submitted:   'bg-info-light text-info',
  verified:    'bg-accent-light text-accent-dark',
  in_progress: 'bg-warning-50 text-urgency-medium',
  resolved:    'bg-primary-50 text-primary-700',
  rejected:    'bg-danger-50 text-danger',
}

// Format date to readable string
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString(
    'en-PK', {
      day:    'numeric',
      month:  'short',
      year:   'numeric',
      hour:    '2-digit',
      minute:  '2-digit',
    }
  )
}