import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { complaintService } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function UpvoteButton({ complaintId, upvotes, hasUpvoted, onChange, className = '', size = 'md' }) {
  const { isLoggedIn } = useAuth()
  const [pending, setPending] = useState(false)
  const navigate = useNavigate()

  const sizes = {
    sm: 'text-sm gap-1',
    md: 'text-base gap-1.5',
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
      className={`inline-flex items-center font-semibold transition disabled:opacity-60 ${sizes[size]} ${hasUpvoted ? 'text-red-600' : 'text-gray-500 hover:text-red-500'} ${className}`}
    >
      <span>{hasUpvoted ? '❤️' : '🤍'}</span>
      <span>{upvotes}</span>
    </button>
  )
}
