import { useState, useEffect } from 'react'
import { Link, useSearchParams, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Badge, Alert, PageTitle, UrgencyMark } from '../../components/UI'
import UpvoteButton from '../../components/UpvoteButton'
import { useLanguage } from '../../context/LanguageContext'
import { statusClasses } from '../../utils/urgencyHelpers'
import { Search, Users, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const ProgressionIcon = ({ progression }) => {
  if (progression === 'Worsening') return <TrendingUp size={12} aria-hidden="true" />
  if (progression === 'Improving') return <TrendingDown size={12} aria-hidden="true" />
  return <Minus size={12} aria-hidden="true" />
}

// One labelled segment of the complaint pass.
function Segment({ label, children, className = '' }) {
  return (
    <div className={`min-w-0 bg-white px-5 py-3 sm:px-6 ${className}`}>
      <div className="label">{label}</div>
      <div className="mt-1 truncate text-[15px] font-semibold text-neutral-900">{children}</div>
    </div>
  )
}

export default function TrackComplaint() {
  useDocumentTitle('title_track')
  const { t, tv, tvList, locale } = useLanguage()
  const [searchParams] = useSearchParams()
  const [searchId, setSearchId] = useState(searchParams.get('id') || '')
  const [searchPhone, setSearchPhone] = useState('')
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { id: pathId } = useParams()
  // /complaint/:id and /track?id=... (where the report flow lands) both load
  // the complaint straight away instead of leaving the user to press Search.
  const routeId = pathId || searchParams.get('id')

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
    } catch (err) {
      // Phone lookups are limited to the signed-in owner (see ComplaintTrackView).
      setError(err.response?.status === 403 ? 'track_phone_login' : 'track_not_found')
    } finally {
      setLoading(false)
    }
  }

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
        setError('track_not_found_id')
      } finally {
        setLoading(false)
      }
    }
    fetchByRouteId()
  }, [routeId])

  const date = (iso) => new Date(iso).toLocaleDateString(locale)

  return (
    <>
      <Header />
      <PageTitle titleKey="track_title" subtitle={t('track_subtitle')} />

      <main className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSearch} className="grid gap-3 border-b border-neutral-200 pb-8 md:grid-cols-[1fr_1fr_auto]">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder={t('track_id_placeholder')}
            aria-label={t('track_id_placeholder')}
            className="field h-11"
            dir="ltr"
          />
          <input
            type="tel"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            placeholder={t('track_phone_placeholder')}
            aria-label={t('track_phone_placeholder')}
            className="field h-11"
          />
          <Button type="submit" loading={loading} className="h-11 md:min-w-[8rem]">
            {!loading && <Search size={16} aria-hidden="true" />}
            {loading ? t('track_searching') : t('track_search_button')}
          </Button>
        </form>

        {error && <Alert message={t(error)} type="error" className="mt-8" />}

        {complaint && (
          <article className="mt-8 border border-neutral-300 bg-white">
            {/* The pass: identity and state in labelled segments. */}
            {/* 1px gaps over a hairline ground draw every divider at every width. */}
            <div className="grid grid-cols-2 gap-px border-b border-neutral-300 bg-neutral-200 sm:grid-cols-3 lg:grid-cols-5">
              <Segment label={t('th_id')}>
                <span className="tnum" dir="ltr">{complaint.complaint_id}</span>
              </Segment>
              <Segment label={t('track_submitted')}>
                <span className="tnum">{date(complaint.submitted_at)}</span>
              </Segment>
              <Segment label={t('track_ward_label')}>
                {tv('ward', complaint.ward) || t('common_na')}
              </Segment>
              <Segment label={t('th_urgency')}>
                <span className="inline-flex items-center gap-2">
                  <UrgencyMark level={complaint.urgency_level} size={12} />
                  {tv('urgency', complaint.urgency_level)}
                  <span className="text-sm font-normal text-neutral-500 tnum">{complaint.urgency_score}/100</span>
                </span>
              </Segment>
              <Segment label={t('track_current_status')} className="col-span-2 lg:col-span-1">
                <span className={`inline-block rounded-sm px-2 py-0.5 text-sm ${statusClasses[complaint.status] || 'bg-neutral-100 text-neutral-700'}`}>
                  {tv('status', complaint.status)}
                </span>
              </Segment>
            </div>

            {(complaint.linked_count > 1 || complaint.flagged) && (
              <div className="divide-y divide-neutral-200 border-b border-neutral-200">
                {complaint.linked_count > 1 && (
                  <div className="flex flex-wrap items-center gap-3 bg-neutral-50 px-4 py-3">
                    <Users size={16} className="shrink-0 text-neutral-500" aria-hidden="true" />
                    <p className="text-sm font-medium text-neutral-800">
                      {t(complaint.linked_count - 1 === 1 ? 'track_linked_one' : 'track_linked_many', { n: complaint.linked_count - 1 })}
                    </p>
                    {complaint.cluster_progression && (
                      <Badge variant={complaint.cluster_progression === 'Worsening' ? 'danger' : complaint.cluster_progression === 'Improving' ? 'success' : 'default'} className="ms-auto">
                        <ProgressionIcon progression={complaint.cluster_progression} />
                        {tv('progression', complaint.cluster_progression)}
                      </Badge>
                    )}
                  </div>
                )}
                {complaint.flagged && (
                  <div className="flex items-center gap-3 bg-warning-50 px-4 py-3">
                    <Clock size={16} className="shrink-0 text-warning-700" aria-hidden="true" />
                    <p className="text-sm font-medium text-warning-700">{t('track_under_review')}</p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-12">
              <div className="space-y-8 p-5 sm:p-6 lg:col-span-8">
                <section>
                  <h2 className="label">{t('track_description')}</h2>
                  <p className="mt-2 max-w-[65ch] text-[15px] leading-relaxed text-neutral-800">{complaint.description}</p>
                </section>

                <section>
                  <h2 className="label">{t('track_hazard_details')}</h2>
                  <dl className="mt-3 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-neutral-500">{t('track_type_label')}</dt>
                      <dd className="mt-0.5 font-medium text-neutral-900">{tvList('hazard', complaint.detected_classes) || t('common_na')}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">{t('track_location_label')}</dt>
                      <dd className="mt-0.5 font-medium text-neutral-900">{complaint.address || t('common_na')}</dd>
                      {complaint.latitude != null && (
                        <dd className="mt-0.5 text-[13px]">
                          <span className="text-neutral-600 tnum" dir="ltr">{Number(complaint.latitude).toFixed(4)}, {Number(complaint.longitude).toFixed(4)}</span>{' '}
                          <Link to={`/map?focus=${complaint.complaint_id}`} className="font-semibold text-primary-600 hover:underline">{t('map_view_on_map')}</Link>
                        </dd>
                      )}
                    </div>
                    {complaint.assigned_department && (
                      <div>
                        <dt className="text-neutral-500">{t('track_department')}</dt>
                        <dd className="mt-0.5 font-medium text-neutral-900">{tv('dept', complaint.assigned_department)}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-neutral-500">{t('track_estimated_resolution')}</dt>
                      <dd className="mt-0.5 font-medium text-neutral-900">
                        {complaint.predicted_resolution_days != null
                          ? t('common_days', { n: complaint.predicted_resolution_days })
                          : complaint.status !== 'resolved'
                            ? <span className="font-normal text-neutral-500">{t('track_no_estimate')}</span>
                            : t('common_na')}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4">
                    <UpvoteButton
                      complaintId={complaint.complaint_id}
                      upvotes={complaint.upvotes || 0}
                      hasUpvoted={!!complaint.has_upvoted}
                      onChange={(next) => setComplaint((prev) => ({ ...prev, upvotes: next.upvotes, has_upvoted: next.hasUpvoted }))}
                    />
                  </div>
                </section>

                {(complaint.image_url || complaint.annotated_image_url || complaint.annotated_image_base64) && (
                  <section>
                    <h2 className="label">{t('track_image_comparison')}</h2>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      {complaint.image_url && (
                        <figure>
                          <img src={complaint.image_url} alt={t('track_original_photo')} className="max-h-72 w-full border border-neutral-200 bg-neutral-50 object-contain" />
                          <figcaption className="mt-1.5 text-[13px] text-neutral-500">{t('track_original_photo')}</figcaption>
                        </figure>
                      )}
                      {(complaint.annotated_image_url || complaint.annotated_image_base64) && (
                        <figure>
                          <img
                            src={complaint.annotated_image_url || `data:image/jpeg;base64,${complaint.annotated_image_base64}`}
                            alt={t('track_annotated_photo')}
                            className="max-h-72 w-full border border-neutral-200 bg-neutral-50 object-contain"
                          />
                          <figcaption className="mt-1.5 text-[13px] text-neutral-500">{t('track_annotated_photo')}</figcaption>
                        </figure>
                      )}
                    </div>
                  </section>
                )}

                {complaint.status === 'resolved' && complaint.resolved_image_url && (
                  <section>
                    <h2 className="label">{t('track_before_after')}</h2>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <figure>
                        {complaint.image_url ? (
                          <img src={complaint.image_url} alt={t('track_before')} className="max-h-72 w-full border border-neutral-200 bg-neutral-50 object-contain" />
                        ) : (
                          <div className="flex h-40 items-center justify-center border border-neutral-200 bg-neutral-50 text-sm text-neutral-500">
                            {t('track_no_original')}
                          </div>
                        )}
                        <figcaption className="mt-1.5 text-[13px] font-semibold text-neutral-600">{t('track_before')}</figcaption>
                      </figure>
                      <figure>
                        <img src={complaint.resolved_image_url} alt={t('track_after')} className="max-h-72 w-full border border-neutral-200 bg-neutral-50 object-contain" />
                        <figcaption className="mt-1.5 text-[13px] font-semibold text-success-700">{t('track_after')}</figcaption>
                      </figure>
                    </div>
                  </section>
                )}
              </div>

              {/* Status timeline */}
              <aside className="border-t border-neutral-200 p-5 sm:p-6 lg:col-span-4 lg:border-s lg:border-t-0">
                <h2 className="label">{t('track_status_timeline')}</h2>
                <ol className="relative mt-4 space-y-5 border-s border-neutral-300 ps-5">
                  <li className="relative">
                    <span className="absolute -start-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-neutral-900" aria-hidden="true" />
                    <p className="font-semibold text-neutral-900">{t('track_submitted')}</p>
                    <p className="text-sm text-neutral-500 tnum">{date(complaint.submitted_at)}</p>
                  </li>
                  {complaint.status_history?.map((history, idx) => (
                    <li key={idx} className="relative">
                      <span className="absolute -start-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-neutral-900 bg-white" aria-hidden="true" />
                      <p className="font-semibold text-neutral-900">{tv('status', history.status)}</p>
                      <p className="text-sm text-neutral-500 tnum">{date(history.timestamp)}</p>
                      {history.notes && <p className="mt-1 text-sm text-neutral-700">{history.notes}</p>}
                    </li>
                  ))}
                  {complaint.status === 'resolved' && (
                    <li className="relative">
                      <span className="absolute -start-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-success" aria-hidden="true" />
                      <p className="font-semibold text-success-700">{t('status_resolved')}</p>
                    </li>
                  )}
                </ol>
              </aside>
            </div>
          </article>
        )}
      </main>
      <Footer />
    </>
  )
}
