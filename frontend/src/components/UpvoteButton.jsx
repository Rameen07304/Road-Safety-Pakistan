import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { complaintService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Heart } from 'lucide-react'

export default function UpvoteButton({ complaintId, upvotes, hasUpvoted, onChange, className = '', size = 'md' }) {
  const { isLoggedIn } = useAuth()
  const [pending, setPending] = useState(false)
  const navigate = useNavigate()

  const sizes = {
    sm: 'text-sm gap-1',
    md: 'text-base gap-1.5',
  }

  const iconSizes = {
    sm: 14,
    md: 16,
  }

  const handleClick = async (e) => {
    e.stopPropagation()
    if (pending) return

    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    const nextHasUpvoted = !hasUpvoted
    const nextCount = upvotes + (nextHasUpvoted ? 1 : -1)
    onChange({ hasUpvoted: nextHasUpvoted, upvotes: nextCount })
    setPending(true)

    try {
      const response = hasUpvoted
        ? await complaintService.removeUpvote(complaintId)
        : await complaintService.upvote(complaintId)
      onChange({ hasUpvoted: response.data.has_upvoted, upvotes: response.data.upvotes })
    } catch (err) {
      onChange({ hasUpvoted, upvotes })
      if (err.response?.status === 409) {
        onChange({ hasUpvoted: true, upvotes })
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={hasUpvoted ? 'Remove upvote' : 'Upvote this complaint'}
      className={`inline-flex items-center font-semibold transition disabled:opacity-60 ${sizes[size]} ${hasUpvoted ? 'text-danger' : 'text-neutral-400 hover:text-danger'} ${className}`}
    >
      <Heart
        size={iconSizes[size]}
        fill={hasUpvoted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
      />
      <span>{upvotes}</span>
    </button>
  )
}
