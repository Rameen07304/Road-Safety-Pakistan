import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Card, Badge, Button, Alert } from '../../components/UI'
import Toast from '../../components/Toast'

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

export default function ComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')

  const fetchComplaint = async () => {
    try {
      const response = await api.get(`/api/complaints/${id}/`)
      setComplaint(response.data)
      setStatus(response.data.status)
      setNotes(response.data.admin_notes || '')
    } catch {
      setError('Failed to load complaint details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaint()
  }, [id])

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      const response = await api.patch(`/api/admin/complaints/${id}/status/`, {
        status,
        admin_notes: notes,
      })
      setComplaint(response.data)
      setToast({ message: 'Complaint updated successfully!', type: 'success' })
    } catch {
      setError('Failed to update complaint')
      setToast({ message: 'Failed to update complaint', type: 'error' })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
        <Footer />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Alert message={error} type="error" />
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-900">{complaint.complaint_id}</h1>
          <Button variant="secondary" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Photo */}
            {complaint.image_url && (
              <Card>
                <h3 className="font-bold text-gray-900 mb-4">Submitted Photo</h3>
                <img src={complaint.image_url} alt="Complaint" className="max-w-full max-h-96 rounded-lg" />
              </Card>
            )}

            {/* Hazard Details */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Hazard Analysis</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Detected Classes</p>
                  <p className="text-gray-900 font-semibold">{complaint.detected_classes?.join(', ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Confidence Scores</p>
                  <p className="text-gray-900 font-semibold">
                    {Object.entries(complaint.confidence_scores || {}).map(([k, v]) => `${k}: ${(v*100).toFixed(1)}%`).join(', ')}
                  </p>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Description & Sentiment</h3>
              <p className="text-gray-700 mb-4">{complaint.description}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Sentiment Analysis</p>
                  <Badge variant="default">{complaint.sentiment}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Keywords Found</p>
                  <div className="flex flex-wrap gap-2">
                    {complaint.sentiment_keywords?.map(kw => (
                      <Badge key={kw} variant="default" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Location */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Location Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Address</p>
                  <p className="text-gray-900">{complaint.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ward</p>
                  <p className="text-gray-900">{complaint.ward}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Coordinates</p>
                  <p className="text-gray-900">{complaint.latitude?.toFixed(4)}, {complaint.longitude?.toFixed(4)}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Urgency */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Urgency Score</h3>
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">{complaint.urgency_score}</div>
                <Badge variant={complaint.urgency_level?.toLowerCase()} className="w-full text-center justify-center">
                  {complaint.urgency_level}
                </Badge>
              </div>
            </Card>

            {/* Status Update */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Update Status</h3>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              >
                <option value="submitted">Submitted</option>
                <option value="verified">Verified</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Admin notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none mb-4"
                rows="4"
              ></textarea>
              
              <Button className="w-full" loading={updating} onClick={handleUpdate}>
                Save Changes
              </Button>
            </Card>

            {/* Metadata */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Metadata</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Reported:</strong> {new Date(complaint.submitted_at).toLocaleDateString()}</p>
                <p><strong>Reporter:</strong> {complaint.citizen_name || 'Citizen'}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
