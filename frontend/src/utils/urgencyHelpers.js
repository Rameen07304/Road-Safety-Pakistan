// Urgency level → Tailwind CSS classes
export const urgencyClasses = {
  critical: 'badge-critical',
  high:     'badge-high',
  medium:   'badge-medium',
  low:      'badge-low',
  resolved: 'badge-resolved',
}

// Urgency level → colors for map pins
export const urgencyColors = {
  critical: '#DC2626',
  high:     '#EA580C',
  medium:   '#D97706',
  low:      '#3B82F6',
  resolved: '#16A34A',
}

// Urgency level → human readable label
export const urgencyLabels = {
  critical: 'Critical',
  high:     'High',
  medium:   'Medium',
  low:      'Low',
  resolved: 'Resolved',
}

// Hazard class → emoji icon
export const hazardIcons = {
  pothole:         '🕳️',
  speed_bump:      '🚧',
  open_manhole:    '⚠️',
  broken_manhole:  '🔧',
  garbage:         '🗑️',
}

// Hazard class → display name
export const hazardLabels = {
  pothole:         'Pothole',
  speed_bump:      'Speed Bump',
  open_manhole:    'Open Manhole',
  broken_manhole:  'Broken Manhole',
  garbage:         'Garbage',
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
  submitted:   'bg-blue-100 text-blue-800',
  verified:    'bg-purple-100 text-purple-800',
  in_progress: 'bg-amber-100 text-amber-800',
  resolved:    'bg-green-100 text-green-800',
  rejected:    'bg-red-100 text-red-800',
}

// Format date to readable string
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString(
    'en-PK', {
      day:    'numeric',
      month:  'short',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    }
  )
}

// Format relative time (e.g. "2 hours ago")
export const timeAgo = (dateString) => {
  if (!dateString) return ''
  const seconds = Math.floor(
    (new Date() - new Date(dateString)) / 1000
  )
  const intervals = [
    { label: 'year',   seconds: 31536000 },
    { label: 'month',  seconds: 2592000  },
    { label: 'week',   seconds: 604800   },
    { label: 'day',    seconds: 86400    },
    { label: 'hour',   seconds: 3600     },
    { label: 'minute', seconds: 60       },
  ]
  for (const interval of intervals) {
    const count = Math.floor(
      seconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${
        count !== 1 ? 's' : ''} ago`
    }
  }
  return 'Just now'
}