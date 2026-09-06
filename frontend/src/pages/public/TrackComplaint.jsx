import { useState, useEffect } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Card, Badge, Alert } from '../../components/UI'
import UpvoteButton from '../../components/UpvoteButton'
import { useLanguage } from '../../context/LanguageContext'
import { Search, Users, TrendingUp, TrendingDown, Minus, Clock, Image as ImageIcon } from 'lucide-react'

const ProgressionIcon = ({ progression }) => {
  if (progression === 'Worsening') return <TrendingUp size={12} />
  if (progression === 'Improving') return <TrendingDown size={12} />
  return <Minus size={12} />
}

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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-2">{t('track_title')}</h1>
          <p className="text-neutral-500">{t('track_subtitle')}</p>
        </div>

        <Card className="mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder={t('track_id_placeholder')}
                className="px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none transition"
              />
              <input
                type="tel"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder={t('track_phone_placeholder')}
                className="px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none transition"
              />
            </div>
            <Button type="submit" loading={loading} className="w-full">
              <Search size={16} />
              {loading ? t('track_searching') : t('track_search_button')}
            </Button>
          </form>
        </Card>

        {error && <Alert message={error} type="error" className="mb-8" />}

        {complaint && (
          <Card>
            <div className="space-y-6">
              {/* Header row */}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-neutral-900">{complaint.complaint_id}</h2>
                    <p className="text-sm text-neutral-400">Filed on {new Date(complaint.submitted_at).toLocaleDateString()}</p>
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

              {/* Linked reports banner */}
              {complaint.linked_count > 1 && (
                <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent-light px-4 py-3">
                  <Users size={18} className="text-accent-dark flex-shrink-0" />
                  <p className="text-sm font-semibold text-neutral-700">
                    {complaint.linked_count - 1} other citizen{complaint.linked_count - 1 !== 1 ? 's' : ''} reported this same issue nearby
                  </p>
                  {complaint.cluster_progression && (
                    <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                      complaint.cluster_progression === 'Worsening'
                        ? 'bg-red-100 text-danger'
                        : complaint.cluster_progression === 'Improving'
                          ? 'bg-primary-50 text-primary-600'
                          : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      <ProgressionIcon progression={complaint.cluster_progression} />
                      {complaint.cluster_progression}
                    </span>
                  )}
                </div>
              )}

              {/* Under review notice */}
              {complaint.flagged && (
                <div className="flex items-center gap-3 rounded-lg border border-warning/20 bg-amber-50 px-4 py-3">
                  <Clock size={18} className="text-warning flex-shrink-0" />
                  <p className="text-sm font-semibold text-urgency-medium">
                    This complaint is currently under review by our moderation team.
                  </p>
                </div>
              )}

              {/* Status Timeline */}
              <div>
                <h3 className="font-heading font-bold text-neutral-800 mb-4">{t('track_status_timeline')}</h3>
                <div className="space-y-0 relative">
                  {/* Connecting line */}
                  <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-neutral-100" />

                  {/* Submitted (always first) */}
                  <div className="flex gap-4 relative py-2">
                    <div className="w-3 h-3 rounded-full bg-primary-500 mt-1.5 flex-shrink-0 relative z-10 shadow-subtle" />
                    <div>
                      <p className="font-semibold text-neutral-800">{t('track_submitted')}</p>
                      <p className="text-sm text-neutral-400">{new Date(complaint.submitted_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Status history entries */}
                  {complaint.status_history?.map((history, idx) => (
                    <div key={idx} className="flex gap-4 relative py-2">
                      <div className="w-3 h-3 rounded-full bg-neutral-300 mt-1.5 flex-shrink-0 relative z-10" />
                      <div>
                        <p className="font-semibold text-neutral-800">{history.status}</p>
                        <p className="text-sm text-neutral-400">{new Date(history.timestamp).toLocaleDateString()}</p>
                        {history.notes && <p className="text-sm text-neutral-500 mt-1">{history.notes}</p>}
                      </div>
                    </div>
                  ))}

                  {/* Current status indicator */}
                  {complaint.status === 'resolved' && (
                    <div className="flex gap-4 relative py-2">
                      <div className="w-3 h-3 rounded-full bg-success mt-1.5 flex-shrink-0 relative z-10 shadow-subtle" />
                      <div>
                        <p className="font-semibold text-success">Resolved</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-heading font-bold text-neutral-800 mb-2">{t('track_hazard_details')}</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong className="text-neutral-600">{t('track_type_label')}:</strong> <span className="text-neutral-700">{complaint.detected_classes?.join(', ') || 'N/A'}</span></p>
                    <p><strong className="text-neutral-600">{t('track_location_label')}:</strong> <span className="text-neutral-700">{complaint.address}</span></p>
                    <p><strong className="text-neutral-600">{t('track_ward_label')}:</strong> <span className="text-neutral-700">{complaint.ward}</span></p>
                    {complaint.assigned_department && (
                      <p><strong className="text-neutral-600">Department:</strong> <span className="text-neutral-700">{complaint.assigned_department}</span></p>
                    )}
                    {complaint.predicted_resolution_days != null ? (
                      <p><strong className="text-neutral-600">Estimated resolution:</strong> <span className="text-neutral-700">{complaint.predicted_resolution_days} days</span></p>
                    ) : complaint.status !== 'resolved' ? (
                      <p className="text-neutral-300 italic">Not enough data to estimate resolution time</p>
                    ) : null}
                  </div>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-neutral-800 mb-2">{t('track_current_status')}</h3>
                  <Badge variant={complaint.status === 'resolved' ? 'success' : 'warning'} className="text-base py-2 px-3">
                    {complaint.status?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-heading font-bold text-neutral-800 mb-2">{t('track_description')}</h3>
                <p className="text-neutral-600">{complaint.description}</p>
              </div>

              {/* Image comparison */}
              {(complaint.image_url || complaint.annotated_image_url || complaint.annotated_image_base64) && (
                <div>
                  <h3 className="font-heading font-bold text-neutral-800 mb-2 flex items-center gap-2">
                    <ImageIcon size={16} className="text-neutral-400" />
                    Image Comparison
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {complaint.image_url && (
                      <div>
                        <p className="text-sm text-neutral-400 mb-2 font-medium">Original photo</p>
                        <img src={complaint.image_url} alt="Original complaint" className="w-full max-h-64 object-contain rounded-lg shadow-subtle" />
                      </div>
                    )}
                    {(complaint.annotated_image_url || complaint.annotated_image_base64) && (
                      <div>
                        <p className="text-sm text-neutral-400 mb-2 font-medium">AI annotated photo</p>
                        <img
                          src={complaint.annotated_image_url || `data:image/jpeg;base64,${complaint.annotated_image_base64}`}
                          alt="AI detection annotations"
                          className="w-full max-h-64 object-contain rounded-lg shadow-subtle"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Before / After resolution */}
              {complaint.status === 'resolved' && complaint.resolved_image_url && (
                <div>
                  <h3 className="font-heading font-bold text-neutral-800 mb-2">Before &amp; After</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-neutral-500 mb-2 uppercase tracking-wide">Before</p>
                      {complaint.image_url ? (
                        <img src={complaint.image_url} alt="Before resolution" className="w-full max-h-64 object-contain rounded-lg shadow-subtle" />
                      ) : (
                        <div className="flex h-40 items-center justify-center rounded-lg bg-neutral-50 border border-neutral-100 text-sm text-neutral-400">
                          No original photo available
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-success mb-2 uppercase tracking-wide">After</p>
                      <img src={complaint.resolved_image_url} alt="After resolution" className="w-full max-h-64 object-contain rounded-lg shadow-subtle" />
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
