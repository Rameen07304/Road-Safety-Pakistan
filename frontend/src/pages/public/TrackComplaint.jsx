import { useState, useEffect } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Card, Badge, Alert } from '../../components/UI'

export default function TrackComplaint() {
  const [searchParams] = useSearchParams()
  const [searchId, setSearchId] = useState(searchParams.get('id') || '')
  const [searchPhone, setSearchPhone] = useState('')
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { id: routeId } = useParams()

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setComplaint(null)
    setLoading(true)

    try {
      const params = searchId
        ? { complaint_id: searchId.trim() }
        : { phone: searchPhone.trim() }
      const response = await api.get('/api/complaints/track/', { params })
      setComplaint(response.data)
    } catch {
      setError('Complaint not found. Please check your Complaint ID or phone number.')
    } finally {
      setLoading(false)
    }
  }

  // If route contains :id (e.g. /complaint/:id), auto-load that complaint
  useEffect(() => {
    if (!routeId) return
    const fetchByRouteId = async () => {
      setError('')
      setComplaint(null)
      setLoading(true)
      try {
        const response = await api.get('/api/complaints/track/', { params: { complaint_id: routeId } })
        setComplaint(response.data)
        setSearchId(routeId)
      } catch {
        setError('Complaint not found. Please check the Complaint ID.')
      } finally {
        setLoading(false)
      }
    }
    fetchByRouteId()
  }, [routeId])

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Track Your Complaint</h1>
          <p className="text-gray-600">Search by Complaint ID or registered phone number</p>
        </div>

        <Card className="mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Complaint ID (e.g., RSP-2026-0001)"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
              <input
                type="tel"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="Or enter phone number"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'Searching...' : '🔍 Search'}
            </Button>
          </form>
        </Card>

        {error && <Alert message={error} type="error" className="mb-8" />}

        {complaint && (
          <Card>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{complaint.complaint_id}</h2>
                    <p className="text-sm text-gray-600">Filed on {new Date(complaint.submitted_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={complaint.urgency_level?.toLowerCase()}>
                    {complaint.urgency_level} ({complaint.urgency_score}/100)
                  </Badge>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Status Timeline</h3>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="w-3 h-3 rounded-full bg-green-600 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-gray-900">Submitted</p>
                      <p className="text-sm text-gray-600">{new Date(complaint.submitted_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {complaint.status_history?.map((history, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-3 h-3 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-semibold text-gray-900">{history.status}</p>
                        <p className="text-sm text-gray-600">{new Date(history.timestamp).toLocaleDateString()}</p>
                        {history.notes && <p className="text-sm text-gray-700 mt-1">{history.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Hazard Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Type:</strong> {complaint.detected_classes?.join(', ') || 'N/A'}</p>
                    <p><strong>Location:</strong> {complaint.address}</p>
                    <p><strong>Ward:</strong> {complaint.ward}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Current Status</h3>
                  <Badge variant={complaint.status === 'resolved' ? 'success' : 'warning'} className="text-base py-2 px-3">
                    {complaint.status?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{complaint.description}</p>
              </div>

              {/* Image */}
              {complaint.image_url && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Submitted Photo</h3>
                  <img src={complaint.image_url} alt="Complaint" className="max-w-md max-h-64 rounded-lg" />
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
      <Footer />
    </>
  )
}
