import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Card } from '../../components/UI'
import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import {
  Camera, Map, BarChart3, Brain, Zap, Shield,
  CircleDot, Unlock, AlertTriangle, Flag, Trash2,
  ArrowRight, FileText, CheckCircle2, Clock, Timer,
  Upload, ScanSearch, Gauge,
} from 'lucide-react'

const heroIllustration = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" role="img" aria-label="Road safety illustration">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0f281d"/>
      <stop offset="55%" stop-color="#1b4a33"/>
      <stop offset="100%" stop-color="#2f7a55"/>
    </linearGradient>
    <linearGradient id="road" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#2a2924"/>
      <stop offset="100%" stop-color="#1c1b18"/>
    </linearGradient>
  </defs>
  <rect width="800" height="520" fill="url(#bg)"/>
  <circle cx="650" cy="105" r="56" fill="#f3f1ed" opacity="0.15"/>
  <rect x="120" y="70" width="120" height="210" rx="14" fill="#143627" opacity="0.72"/>
  <rect x="260" y="40" width="100" height="255" rx="14" fill="#143627" opacity="0.8"/>
  <rect x="380" y="88" width="170" height="220" rx="14" fill="#1b4a33" opacity="0.84"/>
  <rect x="150" y="300" width="500" height="118" rx="20" fill="url(#road)"/>
  <path d="M400 300v118" stroke="#c9a227" stroke-width="10" stroke-dasharray="38 24" stroke-linecap="round"/>
  <path d="M200 414c80-34 320-34 400 0" fill="none" stroke="#2f7a55" stroke-width="10" opacity="0.35"/>
  <rect x="610" y="330" width="90" height="38" rx="10" fill="#245f42"/>
  <rect x="190" y="340" width="85" height="38" rx="10" fill="#2f7a55"/>
  <circle cx="645" cy="360" r="10" fill="#6fb98e"/>
  <circle cx="230" cy="360" r="10" fill="#6fb98e"/>
</svg>
`)

const features = [
  {
    icon: Camera,
    title: 'AI Hazard Detection',
    desc: 'Our YOLOv8 model automatically detects potholes, open manholes, broken speed bumps, and garbage with 80.8% accuracy.',
    color: 'bg-primary-100 text-primary-600',
  },
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

export default function Home() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [stats, setStats] = useState({
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    avgResolutionTime: 0,
  })

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
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    { value: stats.totalComplaints,    label: t('home_total_complaints'), icon: FileText,   color: 'text-primary-500',    bg: 'bg-primary-50' },
    { value: stats.resolvedComplaints, label: t('home_resolved'),         icon: CheckCircle2, color: 'text-success', bg: 'bg-primary-50' },
    { value: stats.pendingComplaints,  label: t('home_pending'),          icon: Clock,      color: 'text-urgency-medium', bg: 'bg-amber-50' },
    { value: stats.avgResolutionTime,  label: t('home_avg_resolution'),   icon: Timer,      color: 'text-urgency-low',    bg: 'bg-cyan-50' },
  ]

  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-800 via-primary-900 to-primary-900 text-white py-20 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6 text-sm font-medium text-primary-100">
                <Map size={14} />
                AI-powered civic platform for Lahore
              </div>
              <h1 className="text-5xl font-heading font-extrabold mb-6 leading-tight">
                {t('home_hero_title')}
              </h1>
              <p className="text-xl text-primary-200 mb-8 leading-relaxed font-light">
                {t('home_hero_subtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/map" className="bg-white text-primary-700 px-8 py-3 rounded-lg font-bold hover:bg-primary-50 transition shadow-base">
                  {t('home_view_live_map')}
                </Link>
                {!user && (
                  <Link to="/register" className="border-2 border-white/60 text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-primary-700 transition">
                    {t('home_report_now')}
                  </Link>
                )}
                {user && user.role === 'citizen' && (
                  <Link to="/report" className="border-2 border-white/60 text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-primary-700 transition">
                    {t('home_report_now')}
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white rounded-xl p-3 shadow-elevated">
                <img
                  src={`data:image/svg+xml;charset=UTF-8,${heroIllustration}`}
                  alt="Road safety illustration"
                  className="w-full rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-neutral-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-heading font-bold text-center mb-12 text-neutral-900">{t('home_our_impact')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {statCards.map((s, i) => (
              <Card key={i} variant="flat" className="text-center">
                <div className={`w-12 h-12 ${s.bg} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <s.icon size={22} className={s.color} />
                </div>
                <div className={`text-3xl font-heading font-bold ${s.color} mb-1`}>{s.value}</div>
                <div className="text-sm text-neutral-500">{s.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-neutral-900 mb-3">{t('home_key_features')}</h2>
            <p className="text-neutral-500 max-w-xl mx-auto">Everything you need to report, track, and resolve road hazards in your community.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="group p-6 rounded-xl border border-neutral-100 hover:border-primary-200 hover:shadow-base transition-all duration-200">
                <div className={`w-11 h-11 ${f.color} rounded-lg flex items-center justify-center mb-4`}>
                  <f.icon size={20} />
                </div>
                <h3 className="text-lg font-heading font-bold mb-2 text-neutral-900">{f.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-neutral-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-neutral-900 mb-3">{t('home_how_it_works')}</h2>
            <p className="text-neutral-500">Three simple steps from photo to resolution.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-16 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-0.5 bg-primary-100" />
            {steps.map((s, i) => (
              <div key={i} className="text-center relative">
                <div className="bg-primary-500 text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-base relative z-10">
                  <s.icon size={24} />
                </div>
                <div className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-2">Step {i + 1}</div>
                <h3 className="text-lg font-heading font-bold mb-2 text-neutral-900">{s.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Hazard Types */}
          <Card variant="elevated">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={18} className="text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-neutral-900">5 Hazard Types Detected</h3>
                <p className="text-sm text-neutral-500">YOLOv8s model trained on 5,364 images</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {hazardTypes.map((h, i) => (
                <div key={i} className="text-center p-4 rounded-lg border border-neutral-100 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200 group">
                  <div className="w-10 h-10 bg-neutral-100 group-hover:bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3 transition-colors">
                    <h.icon size={18} className="text-neutral-500 group-hover:text-primary-600 transition-colors" />
                  </div>
                  <p className="font-semibold text-neutral-900 text-sm">{h.name}</p>
                  <p className="text-xs text-neutral-400 mt-1">mAP50: {h.mAP}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-700 text-white py-16 relative overflow-hidden">
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
