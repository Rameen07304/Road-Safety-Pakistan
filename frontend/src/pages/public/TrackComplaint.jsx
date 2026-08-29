import { useState, useEffect } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Card, Badge, Alert } from '../../components/UI'
import UpvoteButton from '../../components/UpvoteButton'
import { useLanguage } from '../../context/LanguageContext'

export default function TrackComplaint() {
  const { t } = useLanguage()
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('track_title')}</h1>
          <p className="text-gray-600">{t('track_subtitle')}</p>
        </div>

        <Card className="mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder={t('track_id_placeholder')}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
              <input
                type="tel"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder={t('track_phone_placeholder')}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <Button type="submit" loading={loading} className="w-full">
              {loading ? t('track_searching') : `🔍 ${t('track_search_button')}`}
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
                  <div className="flex items-center gap-3">
                    <Badge variant={complaint.urgency_level?.toLowerCase()}>
                      {complaint.urgency_level} ({complaint.urgency_score}/100)
                    </Badge>
                    <UpvoteButton
                      complaintId={complaint.complaint_id}
                      upvotes={complaint.upvotes || 0}
                      hasUpvoted={!!complaint.has_upvoted}
                      onChange={(next) => setComplaint((prev) => ({ ...prev, upvotes: next.upvotes, has_upvoted: next.hasUpvoted }))}
                    />
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">{t('track_status_timeline')}</h3>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="w-3 h-3 rounded-full bg-green-600 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-gray-900">{t('track_submitted')}</p>
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
                  <h3 className="font-bold text-gray-900 mb-2">{t('track_hazard_details')}</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>{t('track_type_label')}:</strong> {complaint.detected_classes?.join(', ') || 'N/A'}</p>
                    <p><strong>{t('track_location_label')}:</strong> {complaint.address}</p>
                    <p><strong>{t('track_ward_label')}:</strong> {complaint.ward}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">{t('track_current_status')}</h3>
                  <Badge variant={complaint.status === 'resolved' ? 'success' : 'warning'} className="text-base py-2 px-3">
                    {complaint.status?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2">{t('track_description')}</h3>
                <p className="text-gray-700">{complaint.description}</p>
              </div>

              {/* Image comparison */}
              {(complaint.image_url || complaint.annotated_image_url || complaint.annotated_image_base64) && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Image Comparison</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {complaint.image_url && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Original photo</p>
                        <img src={complaint.image_url} alt="Original complaint" className="w-full max-h-64 object-contain rounded-lg" />
                      </div>
                    )}
                    {(complaint.annotated_image_url || complaint.annotated_image_base64) && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">AI annotated photo</p>
                        <img
                          src={complaint.annotated_image_url || `data:image/jpeg;base64,${complaint.annotated_image_base64}`}
                          alt="AI detection annotations"
                          className="w-full max-h-64 object-contain rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Before / After resolution */}
              {complaint.status === 'resolved' && complaint.resolved_image_url && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Before &amp; After</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">BEFORE</p>
                      {complaint.image_url ? (
                        <img src={complaint.image_url} alt="Before resolution" className="w-full max-h-64 object-contain rounded-lg" />
                      ) : (
                        <div className="flex h-40 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500">
                          No original photo available
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-700 mb-2">AFTER</p>
                      <img src={complaint.resolved_image_url} alt="After resolution" className="w-full max-h-64 object-contain rounded-lg" />
                    </div>
                  </div>
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
