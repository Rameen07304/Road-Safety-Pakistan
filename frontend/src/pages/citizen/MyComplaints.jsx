import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Card, Badge, Button } from '../../components/UI'
import UpvoteButton from '../../components/UpvoteButton'
import { Loader2, Inbox, Building2 } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export default function MyComplaints() {
  useDocumentTitle('My Complaints')
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await api.get('/api/complaints/my/')
        setComplaints(response.data.results || response.data || [])
      } catch (err) {
        console.error('Failed to fetch complaints:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchComplaints()
  }, [])

  const filteredComplaints = complaints.filter(c => {
    if (filter === 'all') return true
    if (filter === 'pending') return c.status !== 'resolved'
    return c.status === filter
  })

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-2">My Complaints</h1>
          <p className="text-neutral-500">Track all your reported road hazards and their status</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'all', label: 'All', count: complaints.length },
            { id: 'pending', label: 'Pending', count: complaints.filter(c => c.status !== 'resolved').length },
            { id: 'resolved', label: 'Resolved', count: complaints.filter(c => c.status === 'resolved').length },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                filter === f.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {f.label} <span className={`ml-2 px-2 py-0.5 rounded ${filter === f.id ? 'bg-white/20' : 'bg-neutral-200'}`}>{f.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 size={36} className="text-primary-500 animate-spin" />
          </div>
        ) : filteredComplaints.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Inbox size={28} className="text-neutral-300" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-2">No Complaints Yet</h2>
            <p className="text-neutral-500 mb-6">You haven't reported any road hazards yet.</p>
            <Button onClick={() => navigate('/report')}>Report Your First Hazard</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map(complaint => (
              <Card
                key={complaint.complaint_id}
                role="link"
                tabIndex={0}
                aria-label={`Open complaint ${complaint.complaint_id}`}
                className="cursor-pointer transition hover:shadow-base focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                onClick={() => navigate(`/complaint/${complaint.complaint_id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/complaint/${complaint.complaint_id}`)
                  }
                }}
              >
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-heading font-bold text-neutral-900">{complaint.complaint_id}</h3>
                      <Badge variant={`${complaint.urgency_level.toLowerCase()}`}>
                        {complaint.urgency_level} (Score: {complaint.urgency_score}/100)
                      </Badge>
                    </div>
                    <p className="text-neutral-600 mb-2 line-clamp-2">{complaint.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-neutral-500">
                      <span>Location: {complaint.ward || 'N/A'}</span>
                      <span>Date: {new Date(complaint.submitted_at).toLocaleDateString()}</span>
                      <span>AI: {complaint.detected_classes?.join(', ') || 'Analyzing...'}</span>
                      {complaint.assigned_department && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-info-light px-2 py-0.5 text-xs font-semibold text-info">
                          <Building2 size={11} /> {complaint.assigned_department}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={complaint.status === 'resolved' ? 'success' : 'warning'}>
                      {complaint.status.toUpperCase()}
                    </Badge>
                    <UpvoteButton
                      complaintId={complaint.complaint_id}
                      upvotes={complaint.upvotes || 0}
                      hasUpvoted={!!complaint.has_upvoted}
                      size="sm"
                      onChange={(next) => setComplaints((prev) => prev.map((c) => c.complaint_id === complaint.complaint_id ? { ...c, upvotes: next.upvotes, has_upvoted: next.hasUpvoted } : c))}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
