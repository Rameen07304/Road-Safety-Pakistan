import { useState, useEffect } from 'react'
import { Link, useSearchParams, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Badge, Alert, PageTitle, UrgencyMark } from '../../components/UI'
import UpvoteButton from '../../components/UpvoteButton'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Search, Users, TrendingUp, TrendingDown, Minus, Clock, Check, XCircle, MapPin } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'

// The four stages a complaint moves through, in order.
const STAGES = ['submitted', 'verified', 'in_progress', 'resolved']

const ProgressionIcon = ({ progression }) => {
  if (progression === 'Worsening') return <TrendingUp size={12} aria-hidden="true" />
  if (progression === 'Improving') return <TrendingDown size={12} aria-hidden="true" />
  return <Minus size={12} aria-hidden="true" />
}

// Progress as four numbered steps with ticks: readable without reading.
function StageSteps({ status }) {
  const { t } = useLanguage()
  const current = STAGES.indexOf(status)
  return (
    <ol className="grid grid-cols-4 gap-1.5 sm:gap-2" aria-label={t('track_progress')}>
      {STAGES.map((stage, i) => {
        const done = i <= current
        return (
          <li key={stage} aria-current={i === current ? 'step' : undefined}>
            <div className={`h-2 ${done ? 'bg-success' : 'bg-neutral-200'}`} aria-hidden="true" />
            <div className={`mt-2 flex flex-col items-start gap-1 text-sm sm:flex-row sm:items-center sm:text-[15px] ${i === current ? 'font-bold text-neutral-900' : done ? 'text-neutral-800' : 'text-neutral-500'}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${done ? 'bg-success text-white' : 'border-2 border-neutral-300 text-neutral-500'}`} aria-hidden="true">
                {done ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              {t(`status_${stage}`)}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function TrackComplaint() {
  useDocumentTitle('title_track')
  const { t, tv, tvList, locale } = useLanguage()
  const { isLoggedIn } = useAuth()
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
      // People type ids in lower case and with stray spaces.
      const params = searchId.trim()
        ? { complaint_id: searchId.trim().toUpperCase() }
        : { phone: searchPhone.trim() }
      const response = await api.get('/api/complaints/track/', { params })
      setComplaint(response.data)
    } catch (err) {
      // Phone lookups are limited to the signed-in owner (see ComplaintTrackView).
      setError(err.response?.status === 403 ? 'track_phone_login' : searchId.trim() ? 'track_not_found_id' : 'track_not_found')
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

  // "14 October 2026", never 10/14 vs 14/10.
  const date = (iso) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

  const rejected = complaint?.status === 'rejected'
  const level = String(complaint?.urgency_level || '').toLowerCase()

  return (
    <>
      <Header />
      <PageTitle titleKey="track_title" subtitle={t('track_subtitle')} />

      <main className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSearch} className={`grid items-end gap-4 border-b border-neutral-200 pb-8 ${isLoggedIn ? 'md:grid-cols-[1fr_1fr_auto]' : 'md:grid-cols-[minmax(0,28rem)_auto]'}`}>
          <label className="block">
            <span className="mb-1.5 block text-[15px] font-semibold text-neutral-900">{t('track_id_label')}</span>
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder={t('track_id_placeholder')}
              className="field h-12 text-base"
              dir="ltr"
              autoCapitalize="characters"
            />
          </label>
          {/* Phone search only finds the signed-in person's own complaints,
              so it is not offered to visitors who would only get an error. */}
          {isLoggedIn && (
            <label className="block">
              <span className="mb-1.5 block text-[15px] font-semibold text-neutral-900">{t('track_phone_label')}</span>
              <input
                type="tel"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder={t('track_phone_placeholder')}
                className="field h-12 text-base"
                dir="ltr"
              />
            </label>
          )}
          <Button type="submit" size="lg" loading={loading} className="md:min-w-[9rem]">
            {!loading && <Search size={18} aria-hidden="true" />}
            {loading ? t('track_searching') : t('track_search_button')}
          </Button>
        </form>

        {error && <Alert message={t(error)} type="error" className="mt-8" />}

        {complaint && (
          <article className="mt-8 border border-neutral-300 bg-white">
            {/* The answer first: where the complaint is now, in one sentence
                and as four ticked steps. */}
            <div className="border-b border-neutral-300 p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <p className="text-[15px] text-neutral-700">
                  {t('track_id_label')}: <span className="font-bold text-neutral-900 tnum" dir="ltr">{complaint.complaint_id}</span>
                </p>
                <p className="text-[15px] text-neutral-700">
                  {t('track_submitted')}: <span className="font-semibold text-neutral-900">{date(complaint.submitted_at)}</span>
                </p>
              </div>

              {complaint.under_review ? (
                <p className="mt-4 flex items-start gap-2.5 text-xl font-bold text-warning-700 sm:text-2xl">
                  <Clock size={26} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {t('track_under_review')}
                </p>
              ) : rejected ? (
                <p className="mt-4 flex items-start gap-2.5 text-xl font-bold text-danger-700 sm:text-2xl">
                  <XCircle size={28} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {t('track_msg_rejected')}
                </p>
              ) : (
                <>
                  <p className="mt-4 text-xl font-bold text-neutral-900 sm:text-2xl">
                    {t(`track_msg_${STAGES.includes(complaint.status) ? complaint.status : 'submitted'}`)}
                  </p>
                  <div className="mt-5">
                    <StageSteps status={complaint.status} />
                  </div>
                </>
              )}
            </div>

            {/* Held for review: the server sent only the number and date. */}
            {!complaint.under_review && (complaint.linked_count > 1 || complaint.flagged) && (
              <div className="divide-y divide-neutral-200 border-b border-neutral-200">
                {complaint.linked_count > 1 && (
                  <div className="flex flex-wrap items-center gap-3 bg-neutral-50 px-5 py-3 sm:px-6">
                    <Users size={18} className="shrink-0 text-neutral-600" aria-hidden="true" />
                    <p className="text-[15px] font-medium text-neutral-800">
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
                  <div className="flex items-center gap-3 bg-warning-50 px-5 py-3 sm:px-6">
                    <Clock size={18} className="shrink-0 text-warning-700" aria-hidden="true" />
                    <p className="text-[15px] font-medium text-warning-700">{t('track_under_review')}</p>
                  </div>
                )}
              </div>
            )}

            {!complaint.under_review && <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-12">
              <div className="space-y-8 p-5 sm:p-6 lg:col-span-8">
                <section>
                  <h2 className="text-lg font-bold text-neutral-900">{t('track_hazard_details')}</h2>
                  <dl className="mt-3 grid gap-x-8 gap-y-4 text-[15px] sm:grid-cols-2">
                    <div>
                      <dt className="text-neutral-600">{t('map_danger_level')}</dt>
                      <dd className="mt-0.5 flex items-center gap-2 text-base font-bold text-neutral-900">
                        <UrgencyMark level={level} size={16} />
                        {tv('urgency', level)}
                      </dd>
                    </div>
                    {complaint.detected_classes?.length > 0 && (
                      <div>
                        <dt className="text-neutral-600">{t('track_type_label')}</dt>
                        <dd className="mt-0.5 font-semibold text-neutral-900">{tvList('hazard', complaint.detected_classes)}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-neutral-600">{t('track_location_label')}</dt>
                      <dd className="mt-0.5 font-semibold text-neutral-900">
                        {[complaint.address, complaint.ward && tv('ward', complaint.ward)].filter(Boolean).join(', ') || t('common_lahore')}
                      </dd>
                      {complaint.latitude != null && (
                        <dd className="mt-1">
                          <Link to={`/map?focus=${complaint.complaint_id}`} className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:underline">
                            <MapPin size={16} aria-hidden="true" />
                            {t('map_view_on_map')}
                          </Link>
                        </dd>
                      )}
                    </div>
                    {complaint.assigned_department && (
                      <div>
                        <dt className="text-neutral-600">{t('track_department')}</dt>
                        <dd className="mt-0.5 font-semibold text-neutral-900">{tv('dept', complaint.assigned_department)}</dd>
                      </div>
                    )}
                    {complaint.predicted_resolution_days != null && complaint.status !== 'resolved' && !rejected && (
                      <div>
                        <dt className="text-neutral-600">{t('track_estimated_resolution')}</dt>
                        <dd className="mt-0.5 font-semibold text-neutral-900">{t('common_days', { n: complaint.predicted_resolution_days })}</dd>
                      </div>
                    )}
                  </dl>

                  {complaint.description && (
                    <div className="mt-5">
                      <h3 className="text-[15px] text-neutral-600">{t('track_description')}</h3>
                      <p className="mt-1 max-w-[65ch] text-base leading-relaxed text-neutral-900">{complaint.description}</p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-4">
                    <UpvoteButton
                      complaintId={complaint.complaint_id}
                      upvotes={complaint.upvotes || 0}
                      hasUpvoted={!!complaint.has_upvoted}
                      onChange={(next) => setComplaint((prev) => ({ ...prev, upvotes: next.upvotes, has_upvoted: next.hasUpvoted }))}
                    />
                    <p className="text-[15px] text-neutral-700">{t('track_support')}</p>
                  </div>
                </section>

                {complaint.status === 'resolved' && complaint.resolved_image_url && (
                  <section>
                    <h2 className="text-lg font-bold text-neutral-900">{t('track_before_after')}</h2>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <figure>
                        {complaint.image_url ? (
                          <img src={complaint.image_url} alt={t('track_before')} className="max-h-72 w-full border border-neutral-200 bg-neutral-50 object-contain" />
                        ) : (
                          <div className="flex h-40 items-center justify-center border border-neutral-200 bg-neutral-50 text-sm text-neutral-500">
                            {t('track_no_original')}
                          </div>
                        )}
                        <figcaption className="mt-1.5 text-[15px] font-semibold text-neutral-700">{t('track_before')}</figcaption>
                      </figure>
                      <figure>
                        <img src={complaint.resolved_image_url} alt={t('track_after')} className="max-h-72 w-full border border-neutral-200 bg-neutral-50 object-contain" />
                        <figcaption className="mt-1.5 text-[15px] font-semibold text-success-700">{t('track_after')}</figcaption>
                      </figure>
                    </div>
                  </section>
                )}

                {(complaint.image_url || complaint.annotated_image_url || complaint.annotated_image_base64) && (
                  <section>
                    <h2 className="text-lg font-bold text-neutral-900">{t('track_image_comparison')}</h2>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      {complaint.image_url && (
                        <figure>
                          <img src={complaint.image_url} alt={t('track_original_photo')} className="max-h-72 w-full border border-neutral-200 bg-neutral-50 object-contain" />
                          <figcaption className="mt-1.5 text-[15px] text-neutral-700">{t('track_original_photo')}</figcaption>
                        </figure>
                      )}
                      {(complaint.annotated_image_url || complaint.annotated_image_base64) && (
                        <figure>
                          <img
                            src={complaint.annotated_image_url || `data:image/jpeg;base64,${complaint.annotated_image_base64}`}
                            alt={t('track_annotated_photo')}
                            className="max-h-72 w-full border border-neutral-200 bg-neutral-50 object-contain"
                          />
                          <figcaption className="mt-1.5 text-[15px] text-neutral-700">{t('track_annotated_photo')}</figcaption>
                        </figure>
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* What happened, with dates and the department's notes. */}
              <aside className="border-t border-neutral-200 p-5 sm:p-6 lg:col-span-4 lg:border-s lg:border-t-0">
                <h2 className="text-lg font-bold text-neutral-900">{t('track_status_timeline')}</h2>
                <ol className="relative mt-4 space-y-5 border-s-2 border-neutral-300 ps-5">
                  <li className="relative">
                    <span className="absolute -start-[27px] top-1.5 h-3 w-3 rounded-full bg-neutral-900" aria-hidden="true" />
                    <p className="text-base font-semibold text-neutral-900">{t('track_submitted')}</p>
                    <p className="text-[15px] text-neutral-600">{date(complaint.submitted_at)}</p>
                  </li>
                  {complaint.status_history?.map((history, idx) => (
                    <li key={idx} className="relative">
                      <span className={`absolute -start-[27px] top-1.5 h-3 w-3 rounded-full ${history.status === 'resolved' ? 'bg-success' : history.status === 'rejected' ? 'bg-danger' : 'border-2 border-neutral-900 bg-white'}`} aria-hidden="true" />
                      <p className={`text-base font-semibold ${history.status === 'resolved' ? 'text-success-700' : history.status === 'rejected' ? 'text-danger-700' : 'text-neutral-900'}`}>{tv('status', history.status)}</p>
                      <p className="text-[15px] text-neutral-600">{date(history.timestamp)}</p>
                      {history.notes && <p className="mt-1 text-[15px] text-neutral-800">{history.notes}</p>}
                    </li>
                  ))}
                </ol>
              </aside>
            </div>}
          </article>
        )}
      </main>
      <Footer />
    </>
  )
}
