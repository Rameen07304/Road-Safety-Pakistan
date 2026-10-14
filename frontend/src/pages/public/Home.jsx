import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { UrgencyMark } from '../../components/UI'
import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { ArrowRight, MapPin, ChevronUp } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'

// Real per-class detection accuracy (mAP50) of the deployed YOLOv8s model.
const hazardTypes = [
  { name: 'hazard_speed_bump',     mAP: 0.978 },
  { name: 'hazard_broken_manhole', mAP: 0.921 },
  { name: 'hazard_open_manhole',   mAP: 0.895 },
  { name: 'hazard_pothole',        mAP: 0.837 },
  { name: 'hazard_garbage',        mAP: 0.409 },
]

const features = [
  { title: 'feat_map_title',       desc: 'feat_map_desc' },
  { title: 'feat_ward_title',      desc: 'feat_ward_desc' },
  { title: 'feat_sentiment_title', desc: 'feat_sentiment_desc' },
  { title: 'feat_urgency_title',   desc: 'feat_urgency_desc' },
  { title: 'feat_secure_title',    desc: 'feat_secure_desc' },
]

const steps = [
  { title: 'step_upload_title',   desc: 'step_upload_desc' },
  { title: 'step_ai_title',       desc: 'step_ai_desc' },
  { title: 'step_priority_title', desc: 'step_priority_desc' },
]

function timeAgo(iso, t) {
  if (!iso) return ''
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return t('time_minutes_ago', { n: mins })
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return t('time_hours_ago', { n: hrs })
  return t('time_days_ago', { n: Math.round(hrs / 24) })
}

export default function Home() {
  useDocumentTitle('title_home')
  const { user } = useAuth()
  const { t, tv } = useLanguage()
  const [stats, setStats] = useState({
    totalComplaints: null,
    resolvedComplaints: null,
    pendingComplaints: null,
    avgResolutionTime: null,
  })
  const [recent, setRecent] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [response, summary] = await Promise.all([
          api.get('/api/complaints/map/'),
          api.get('/api/analytics/summary/'),
        ])
        const complaints = response.data.complaints || response.data.results || response.data || []
        const resolved = complaints.filter(c => c.status === 'resolved').length

        setStats({
          totalComplaints: complaints.length,
          resolvedComplaints: resolved,
          pendingComplaints: complaints.length - resolved,
          avgResolutionTime: summary.data.avg_resolution_days,
        })

        // The hero shows real reports rather than a decorative placeholder.
        setRecent(
          [...complaints]
            .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
            .slice(0, 5)
        )
      } catch (err) {
        console.error('Failed to fetch stats:', err)
        setRecent([])
      }
    }

    fetchStats()
  }, [])

  const dash = (v) => (v == null ? '—' : v)
  const statCells = [
    { value: dash(stats.totalComplaints),    label: t('home_total_complaints') },
    { value: dash(stats.pendingComplaints),  label: t('home_pending') },
    { value: dash(stats.resolvedComplaints), label: t('home_resolved') },
    { value: stats.avgResolutionTime == null ? t('common_na') : t('common_days', { n: stats.avgResolutionTime }), label: t('home_avg_resolution') },
  ]

  const canReport = !user || user.role === 'citizen'
  const reportCta = canReport && (
    <Link
      to="/report"
      className="inline-flex h-11 items-center gap-2 rounded-sm bg-primary-500 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-primary-600"
    >
      {t('home_report_hazard')}
      <ArrowRight size={16} aria-hidden="true" className="rtl:-scale-x-100" />
    </Link>
  )

  return (
    <>
      <Header />

      <main>
        {/* First viewport: the claim and the action on the left, the city's
            latest real reports on the right. */}
        <section className="border-b border-neutral-200 bg-white">
          <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-page gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-16">
            <div className="lg:col-span-5 lg:pt-2">
              <h1 className="max-w-[16ch] font-heading text-[32px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">
                {t('home_hero_title')}
              </h1>
              <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-neutral-600 sm:text-[17px]">
                {t('home_hero_subtitle')}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {reportCta}
                <Link
                  to="/map"
                  className="inline-flex h-11 items-center rounded-sm border border-neutral-300 bg-white px-5 text-[15px] font-semibold text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50"
                >
                  {t('home_view_live_map')}
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="border border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                  <h2 className="text-[15px] font-semibold">{t('home_reported_in_lahore')}</h2>
                  <Link to="/map" className="-my-2 inline-block py-2 text-sm font-semibold text-primary-600 hover:underline">
                    {t('home_view_all')}
                  </Link>
                </div>

                {recent === null ? (
                  <ul aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <li key={i} className="border-b border-neutral-200 px-4 py-4 last:border-b-0">
                        <div className="h-4 w-2/3 bg-neutral-100" />
                        <div className="mt-2 h-3 w-1/3 bg-neutral-100" />
                      </li>
                    ))}
                  </ul>
                ) : recent.length === 0 ? (
                  <p className="px-4 py-12 text-center text-sm text-neutral-500">{t('home_no_hazards')}</p>
                ) : (
                  <ul>
                    {recent.map((c) => (
                      <li key={c.complaint_id} className="border-b border-neutral-200 last:border-b-0">
                        <Link to={`/complaint/${c.complaint_id}`} className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-50">
                          <UrgencyMark level={c.urgency_level} size={12} className="mt-1.5" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-medium text-neutral-900" title={c.description}>
                              {c.description}
                            </p>
                            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-neutral-500">
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={12} aria-hidden="true" />
                                {tv('ward', c.ward) || t('common_lahore')}
                              </span>
                              <span>{timeAgo(c.submitted_at, t)}</span>
                              <span>{tv('urgency', c.urgency_level)}</span>
                              {c.upvotes > 0 && (
                                <span className="inline-flex items-center gap-0.5 tnum">
                                  <ChevronUp size={12} aria-hidden="true" />
                                  {c.upvotes}
                                </span>
                              )}
                            </p>
                          </div>
                          <span className="hidden shrink-0 pt-0.5 text-[13px] text-neutral-500 tnum sm:block" dir="ltr">{c.complaint_id}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Real counts, set as the sheet's margin table. */}
          <div className="border-t border-neutral-200">
            <dl className="mx-auto grid max-w-page grid-cols-2 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
              {statCells.map((s, i) => (
                <div
                  key={s.label}
                  className={`py-6 ${i % 2 === 1 ? 'border-s border-neutral-200 ps-6' : 'pe-6'} ${i >= 2 ? 'border-t border-neutral-200 lg:border-t-0' : ''} ${i === 2 ? 'lg:border-s lg:ps-6' : ''}`}
                >
                  <dt className="label">{s.label}</dt>
                  <dd className="mt-2 font-heading text-[28px] font-bold leading-none text-neutral-900 tnum">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* The detection model is the product's differentiator: show its real
            accuracy per class rather than describing it. */}
        <section className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-page gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <h2 className="font-heading text-2xl font-bold">{t('feat_ai_title')}</h2>
            <p className="mt-3 max-w-[52ch] leading-relaxed text-neutral-600">{t('feat_ai_desc')}</p>
            <p className="mt-4 text-sm text-neutral-500">{t('feat_ai_trained')}</p>
          </div>
          <div className="lg:col-span-7">
            <table className="data-table bg-white">
              <caption className="pb-3 text-start text-sm text-neutral-500">{t('feat_ai_accuracy')}</caption>
              <tbody>
                {hazardTypes.map((h) => (
                  <tr key={h.name}>
                    <th scope="row" className="!text-[15px] !font-medium !normal-case !tracking-normal !text-neutral-900" style={{ fontStretch: '100%' }}>
                      {t(h.name)}
                    </th>
                    <td className="w-1/2">
                      <div className="flex items-center gap-3">
                        <div className="h-2 bg-neutral-800" style={{ width: `${h.mAP * 100}%` }} aria-hidden="true" />
                      </div>
                    </td>
                    <td className="w-16 text-end font-semibold tnum">{h.mAP.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-t border-neutral-200 bg-white">
          <div className="mx-auto max-w-page px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold">{t('home_key_features')}</h2>
            <p className="mt-2 max-w-[60ch] text-neutral-600">{t('home_features_subtitle')}</p>
            <dl className="mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="border-t border-neutral-300 py-5">
                  <dt className="text-[15px] font-semibold text-neutral-900">{t(f.title)}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-neutral-600">{t(f.desc)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-neutral-200">
          <div className="mx-auto max-w-page px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold">{t('home_how_it_works')}</h2>
            <p className="mt-2 text-neutral-600">{t('home_how_subtitle')}</p>
            <ol className="mt-10 grid gap-x-10 md:grid-cols-3">
              {steps.map((step, i) => (
                <li key={step.title} className="border-t-2 border-neutral-900 py-5">
                  <span className="font-heading text-sm font-bold text-neutral-500 tnum">{i + 1}</span>
                  <h3 className="mt-2 text-[17px] font-semibold">{t(step.title)}</h3>
                  <p className="mt-1.5 max-w-[40ch] text-sm leading-relaxed text-neutral-600">{t(step.desc)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {(!user || user.role === 'citizen') && (
          <section className="border-t border-neutral-200 bg-white">
            <div className="mx-auto flex max-w-page flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
              <div>
                <h2 className="font-heading text-2xl font-bold">{t('home_ready_title')}</h2>
                <p className="mt-2 max-w-[60ch] text-neutral-600">{t('home_ready_subtitle')}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                {reportCta}
                {!user && (
                  <Link to="/login" className="inline-flex h-11 items-center rounded-sm border border-neutral-300 px-5 text-[15px] font-semibold text-neutral-800 hover:bg-neutral-50">
                    {t('nav_login')}
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  )
}
