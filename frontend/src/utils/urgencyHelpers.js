// Urgency level → colors for map pins (must match tailwind.config.js tokens exactly)
export const urgencyColors = {
  critical: '#d42020',
  high:     '#d4501a',
  medium:   '#b8860b',
  low:      '#2196a8',
  resolved: '#2e7d52',
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
  in_progress: 'bg-amber-50 text-urgency-medium',
  resolved:    'bg-primary-50 text-primary-700',
  rejected:    'bg-red-50 text-danger',
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