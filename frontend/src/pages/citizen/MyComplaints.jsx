import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Card, Badge, Button } from '../../components/UI'
import UpvoteButton from '../../components/UpvoteButton'

export default function MyComplaints() {
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Complaints</h1>
          <p className="text-gray-600">Track all your reported road hazards and their status</p>
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
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === f.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {f.label} <span className="ml-2 bg-gray-800 bg-opacity-20 px-2 py-1 rounded">{f.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Complaints Yet</h2>
            <p className="text-gray-600 mb-6">You haven't reported any road hazards yet.</p>
            <Button onClick={() => navigate('/report')}>Report Your First Hazard</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map(complaint => (
              <Card key={complaint.complaint_id} className="cursor-pointer hover:shadow-lg transition" onClick={() => navigate(`/complaint/${complaint.complaint_id}`)}>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900">{complaint.complaint_id}</h3>
                      <Badge variant={`${complaint.urgency_level.toLowerCase()}`}>
                        {complaint.urgency_level} (Score: {complaint.urgency_score}/100)
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-2 line-clamp-2">{complaint.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span>Location: {complaint.ward || 'N/A'}</span>
                      <span>Date: {new Date(complaint.submitted_at).toLocaleDateString()}</span>
                      <span>AI: {complaint.detected_classes?.join(', ') || 'Analyzing...'}</span>
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
