import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import {
  Camera, Map, BarChart3, Brain, Zap, Shield,
  CircleDot, Unlock, AlertTriangle, Flag, Trash2,
  ArrowRight, Upload, ScanSearch, Gauge, MapPin, ChevronUp,
} from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { urgency } from '../../theme/colors'


// The detection model is the product's actual differentiator, so it leads the
// section at full width with its own evidence; the rest support it.
const leadFeature = {
  icon: Camera,
  title: 'AI Hazard Detection',
  desc: 'Our YOLOv8 model automatically detects potholes, open manholes, broken speed bumps, and garbage with 80.8% accuracy.',
}

const features = [
  {
    icon: Map,
    title: 'Live Interactive Map',
    desc: 'View all reported hazards on a real-time map of Lahore. Color-coded pins show urgency levels at a glance.',
    color: 'bg-urgency-low/10 text-urgency-low',
  },
  {
    icon: BarChart3,
    title: 'Ward Analytics',
    desc: 'Track complaint volumes and resolution times by ward. Hold authorities accountable with transparent performance data.',
    color: 'bg-urgency-medium/10 text-urgency-medium',
  },
  {
    icon: Brain,
    title: 'Sentiment Analysis',
    desc: 'Our system analyzes your complaint description in Urdu or English to boost urgency scores automatically.',
    color: 'bg-accent-light text-accent-dark',
  },
  {
    icon: Zap,
    title: 'Auto Urgency Scoring',
    desc: 'Hazard type, sentiment, and keywords combine to generate urgent prioritization for admins.',
    color: 'bg-urgency-high/10 text-urgency-high',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    desc: 'JWT-based authentication and encrypted data storage protect your personal information.',
    color: 'bg-success/10 text-success',
  },
]

const hazardTypes = [
  { icon: CircleDot,      name: 'Pothole',        mAP: '0.837' },
  { icon: Unlock,         name: 'Open Manhole',    mAP: '0.895' },
  { icon: AlertTriangle,  name: 'Broken Manhole',  mAP: '0.921' },
  { icon: Flag,           name: 'Speed Bump',      mAP: '0.978' },
  { icon: Trash2,         name: 'Garbage',         mAP: '0.409' },
]

const steps = [
  { icon: Upload,     title: 'Upload Photo',   desc: 'Take a photo of the road hazard and provide a description in Urdu or English.' },
  { icon: ScanSearch, title: 'AI Analysis',    desc: 'Our YOLOv8 model analyzes the image and identifies the hazard type with confidence scores.' },
  { icon: Gauge,      title: 'Get Priority',   desc: 'Your complaint gets an urgency score and appears on the live map for admin review.' },
]

function timeAgo(iso) {
  if (!iso) return ''
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export default function Home() {
  useDocumentTitle('Home')
  const { user } = useAuth()
  const { t } = useLanguage()
  const [stats, setStats] = useState({
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    avgResolutionTime: 0,
  })
  const [recent, setRecent] = useState([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/complaints/map/')
        const complaints = response.data.complaints || response.data.results || response.data || []
        const resolved = complaints.filter(c => c.status === 'resolved').length
        const pending = complaints.filter(c => c.status !== 'resolved').length

        setStats({
          totalComplaints: complaints.length,
          resolvedComplaints: resolved,
          pendingComplaints: pending,
          avgResolutionTime: '2.4 days',
        })

        // The hero shows real reports rather than a decorative placeholder.
        setRecent(
          [...complaints]
            .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
            .slice(0, 3)
        )
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    { value: stats.totalComplaints,    label: t('home_total_complaints') },
    { value: stats.resolvedComplaints, label: t('home_resolved') },
    { value: stats.pendingComplaints,  label: t('home_pending') },
    { value: stats.avgResolutionTime,  label: t('home_avg_resolution') },
  ]

  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-900 to-primary-900 py-20 text-white lg:py-24">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="min-w-0">
              <h1 className="font-heading text-4xl font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
                {t('home_hero_title')}
              </h1>
              <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-primary-200">
                {t('home_hero_subtitle')}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/map" className="rounded-lg bg-white px-8 py-3 font-bold text-primary-700 shadow-base transition hover:bg-primary-50">
                  {t('home_view_live_map')}
                </Link>
                {(!user || user.role === 'citizen') && (
                  <Link
                    to={user ? '/report' : '/register'}
                    className="rounded-lg border-2 border-white/60 px-8 py-3 font-bold text-white transition hover:bg-white hover:text-primary-700"
                  >
                    {t('home_report_now')}
                  </Link>
                )}
              </div>

              {/* Impact figures live with the claim they support rather than
                  occupying a separate band further down the page. */}
              <dl className="mt-12 grid max-w-lg grid-cols-2 gap-x-8 gap-y-6 border-t border-white/15 pt-8 sm:grid-cols-4 sm:gap-x-6">
                {statCards.map((stat) => (
                  <div key={stat.label} className="min-w-0">
                    <dd className="font-heading text-2xl font-bold leading-none text-white">{stat.value}</dd>
                    <dt className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-300">{stat.label}</dt>
                  </div>
                ))}
              </dl>
            </div>

            {/* Live evidence: the newest real reports, not an illustration. */}
            <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-heading text-sm font-bold text-white">Reported in Lahore</h2>
                <Link to="/map" className="text-xs font-semibold text-primary-200 underline-offset-4 transition hover:text-white hover:underline">
                  View all
                </Link>
              </div>

              {recent.length === 0 ? (
                <p className="py-10 text-center text-sm text-primary-300">
                  No hazards reported yet. Be the first.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {recent.map((c) => (
                    <li key={c.complaint_id} className="rounded-lg bg-white/[0.07] p-3.5">
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/25"
                          style={{ backgroundColor: urgency[c.urgency_level] || urgency.low }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white" title={c.description}>
                            {c.description}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-primary-300">
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={12} aria-hidden="true" />
                              {c.ward || 'Lahore'}
                            </span>
                            <span>{timeAgo(c.submitted_at)}</span>
                            <span className="uppercase tracking-wider">{c.urgency_level}</span>
                            {c.upvotes > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <ChevronUp size={12} aria-hidden="true" />
                                {c.upvotes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="max-w-2xl font-heading text-3xl font-bold tracking-[-0.01em] text-neutral-900">
            {t('home_key_features')}
          </h2>
          <p className="mt-3 max-w-xl text-neutral-500">
            Everything you need to report, track, and resolve road hazards in your community.
          </p>

          {/* The detection model leads at full width and carries its own
              evidence; the hazard classes are proof of this claim, so they
              live here instead of in a separate nested card. */}
          <div className="mt-10 rounded-xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <leadFeature.icon size={20} aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-heading text-2xl font-bold text-neutral-900">{leadFeature.title}</h3>
                <p className="mt-2 leading-relaxed text-neutral-600">{leadFeature.desc}</p>
                <p className="mt-4 text-sm text-neutral-500">
                  YOLOv8s, trained on 5,364 images of Lahore roads.
                </p>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {hazardTypes.map((h) => (
                    <div key={h.name} className="flex flex-col rounded-lg bg-white p-3.5 text-center ring-1 ring-neutral-200/70">
                      <h.icon size={18} className="mx-auto text-neutral-400" aria-hidden="true" />
                      <p className="mt-2 flex-1 text-sm font-semibold leading-tight text-neutral-900">{h.name}</p>
                      <p className="mt-1.5 font-mono text-xs tabular-nums text-neutral-400">{h.mAP}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-neutral-400">Detection accuracy per class (mAP50).</p>
              </div>
            </div>
          </div>

          {/* Supporting capabilities: tighter, lighter, clearly secondary. */}
          <div className="mt-6 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${f.color}`}>
                  <f.icon size={17} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-neutral-900">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold tracking-[-0.01em] text-neutral-900">
            {t('home_how_it_works')}
          </h2>
          <p className="mt-3 text-neutral-500">Three simple steps from photo to resolution.</p>

          <ol className="relative mt-10 grid gap-8 md:grid-cols-3">
            {/* Connecting line (desktop only) */}
            <div className="absolute left-[16.667%] right-[16.667%] top-7 hidden h-px bg-primary-200 md:block" aria-hidden="true" />
            {steps.map((step, i) => (
              <li key={step.title} className="relative">
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-base">
                  <step.icon size={22} aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-neutral-900">
                  <span className="text-primary-500">{i + 1}.</span> {step.title}
                </h3>
                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-neutral-500">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-primary-700 py-16 text-white">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl font-heading font-bold mb-4">{t('home_ready_title')}</h2>
          <p className="text-lg text-primary-200 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('home_ready_subtitle')}
          </p>
          {!user ? (
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-lg font-bold hover:bg-primary-50 transition shadow-base">
                {t('home_register_now')}
                <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="border-2 border-white/60 text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-primary-700 transition">
                {t('nav_login')}
              </Link>
            </div>
          ) : user.role === 'citizen' ? (
            <Link to="/report" className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-lg font-bold hover:bg-primary-50 transition shadow-base">
              {t('home_report_a_hazard')}
              <ArrowRight size={16} />
            </Link>
          ) : null}
        </div>
      </section>

      <Footer />
    </>
  )
}
