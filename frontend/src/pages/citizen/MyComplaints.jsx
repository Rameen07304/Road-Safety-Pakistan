import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, PageTitle, UrgencyMark } from '../../components/UI'
import UpvoteButton from '../../components/UpvoteButton'
import { statusClasses } from '../../utils/urgencyHelpers'
import { Loader2, Building2 } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { useLanguage } from '../../context/LanguageContext'

export default function MyComplaints() {
  useDocumentTitle('nav_my_complaints')
  const { t, tv, tvList, locale } = useLanguage()
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
    if (filter === 'pending') return !['resolved', 'rejected'].includes(c.status)
    return c.status === filter
  })

  const filters = [
    { id: 'all', label: t('common_all'), count: complaints.length },
    { id: 'pending', label: t('status_pending'), count: complaints.filter(c => !['resolved', 'rejected'].includes(c.status)).length },
    { id: 'resolved', label: t('status_resolved'), count: complaints.filter(c => c.status === 'resolved').length },
  ]

  return (
    <>
      <Header />
      <PageTitle titleKey="nav_my_complaints" subtitle={t('mc_subtitle')} />

      <main className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex border-b border-neutral-300" role="tablist">
          {filters.map(f => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`-mb-px inline-flex h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors ${
                filter === f.id ? 'border-primary-500 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {f.label}
              <span className="text-neutral-500 tnum">{f.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-60 items-center justify-center" role="status">
            <Loader2 size={28} className="animate-spin text-neutral-500" aria-hidden="true" />
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="py-16 text-center">
            <h2 className="text-xl font-semibold">{t('mc_empty_title')}</h2>
            <p className="mt-2 text-neutral-600">{t('dash_no_complaints')}</p>
            <Button className="mt-6" onClick={() => navigate('/report')}>{t('dash_report_first')}</Button>
          </div>
        ) : (
          <ul className="border-b border-neutral-200 bg-white">
            {filteredComplaints.map(complaint => (
              <li key={complaint.complaint_id} className="flex gap-4 border-t border-neutral-200 px-4 py-4 first:border-t-0 sm:px-5">
                {complaint.image_url ? (
                  <Link to={`/complaint/${complaint.complaint_id}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
                    <img src={complaint.image_url} alt="" className="h-20 w-20 border border-neutral-200 bg-neutral-100 object-cover sm:h-24 sm:w-24" />
                  </Link>
                ) : (
                  <UrgencyMark level={complaint.urgency_level} size={12} className="mt-1.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <Link
                      to={`/complaint/${complaint.complaint_id}`}
                      aria-label={t('common_open_complaint', { id: complaint.complaint_id })}
                      className="-my-1 inline-block py-1 font-semibold text-neutral-900 tnum hover:text-primary-600 hover:underline"
                      dir="ltr"
                    >
                      {complaint.complaint_id}
                    </Link>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
                      <UrgencyMark level={complaint.urgency_level} size={12} />
                      {tv('urgency', complaint.urgency_level)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[15px] text-neutral-800">{complaint.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-neutral-500">
                    <span>{t('mc_location', { value: tv('ward', complaint.ward) || t('common_na') })}</span>
                    <span className="tnum">{t('mc_date', { value: new Date(complaint.submitted_at).toLocaleDateString(locale) })}</span>
                    <span>{t('mc_ai', { value: tvList('hazard', complaint.detected_classes) || t('mc_analyzing') })}</span>
                    {complaint.assigned_department && (
                      <span className="inline-flex items-center gap-1">
                        <Building2 size={12} aria-hidden="true" /> {tv('dept', complaint.assigned_department)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${statusClasses[complaint.status] || 'bg-neutral-100 text-neutral-700'}`}>
                    {tv('status', complaint.status)}
                  </span>
                  <UpvoteButton
                    complaintId={complaint.complaint_id}
                    upvotes={complaint.upvotes || 0}
                    hasUpvoted={!!complaint.has_upvoted}
                    size="sm"
                    onChange={(next) => setComplaints((prev) => prev.map((c) => c.complaint_id === complaint.complaint_id ? { ...c, upvotes: next.upvotes, has_upvoted: next.hasUpvoted } : c))}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  )
}
