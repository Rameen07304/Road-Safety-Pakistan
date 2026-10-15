import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Badge, Button, PageTitle, StatStrip, Alert } from '../../components/UI'
import { urgencyMarkSvg, statusClasses, formatDate } from '../../utils/urgencyHelpers'
import { Loader2, ArrowRight } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const markerIcon = (urgencyLevel) =>
  L.divIcon({
    className: '',
    html: urgencyMarkSvg(urgencyLevel?.toLowerCase(), 20),
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  })

export default function Dashboard() {
  useDocumentTitle('dash_title')
  const { user } = useAuth()
  const { t, tv, tvList, locale, isUrdu } = useLanguage()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/api/complaints/my-dashboard/')
        setData(response.data)
      } catch (err) {
        console.error('Failed to fetch dashboard:', err)
        setError('dash_load_failed')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const stats = data?.stats
  const recent = data?.most_recent_complaint
  const locations = (data?.locations || []).filter((loc) => loc.latitude != null && loc.longitude != null)
  const mapCenter = locations.length
    ? [Number(locations[0].latitude), Number(locations[0].longitude)]
    : [31.5204, 74.3587]

  const welcome = `${t('dash_welcome')}${user?.full_name ? `${isUrdu ? '،' : ','} ${user.full_name}` : ''}. ${t('dash_overview')}`

  return (
    <>
      <Header />
      <PageTitle
        titleKey="dash_title"
        subtitle={welcome}
        actions={
          <Link to="/report" className="inline-flex h-10 items-center gap-2 rounded-sm bg-white px-4 text-sm font-semibold text-sign-700 hover:bg-sign-50">
            {t('nav_report_hazard')}
            <ArrowRight size={15} aria-hidden="true" className="rtl:-scale-x-100" />
          </Link>
        }
      />

      <main className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex h-72 items-center justify-center" role="status">
            <Loader2 size={28} className="animate-spin text-neutral-500" aria-hidden="true" />
          </div>
        ) : error ? (
          <Alert message={t(error)} type="error" />
        ) : (
          <div className="space-y-8">
            <StatStrip
              items={[
                { label: t('dash_total_submitted'), value: stats.total },
                { label: t('dash_pending'), value: stats.pending },
                { label: t('dash_in_progress'), value: stats.in_progress },
                { label: t('dash_resolved'), value: stats.resolved },
                { label: t('dash_rejected'), value: stats.rejected ?? 0 },
              ]}
            />

            <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-12">
              <section className="lg:col-span-5">
                <h2 className="mb-3 text-[17px] font-semibold">{t('dash_most_recent')}</h2>
                {recent ? (
                  <Link
                    to={`/complaint/${recent.complaint_id}`}
                    aria-label={t('common_open_complaint', { id: recent.complaint_id })}
                    className="block border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-400"
                  >
                    {recent.image_url && (
                      <img src={recent.image_url} alt={tvList('hazard', recent.detected_classes) || t('dash_hazard_report')} className="mb-4 h-44 w-full border border-neutral-200 bg-neutral-100 object-cover" />
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-semibold tnum" dir="ltr">{recent.complaint_id}</span>
                      <Badge variant={recent.urgency_level?.toLowerCase()}>
                        {tv('urgency', recent.urgency_level)}
                      </Badge>
                    </div>
                    <p className="mt-3 text-[15px] text-neutral-800">
                      {tvList('hazard', recent.detected_classes) || t('dash_hazard_report')}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-3 text-sm text-neutral-600">
                      <span>{t('dash_filed', { date: formatDate(recent.submitted_at, locale) })}</span>
                      <span className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${statusClasses[recent.status] || 'bg-neutral-100 text-neutral-700'}`}>
                        {tv('status', recent.status)}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="border border-dashed border-neutral-300 bg-white px-5 py-10 text-center">
                    <p className="text-neutral-600">{t('dash_no_complaints')}</p>
                    <Button className="mt-5" onClick={() => navigate('/report')}>{t('dash_report_first')}</Button>
                  </div>
                )}
              </section>

              <section className="lg:col-span-7">
                <h2 className="mb-3 text-[17px] font-semibold">{t('dash_my_locations')}</h2>
                {locations.length ? (
                  <div className="h-80 border border-neutral-200">
                    <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                      />
                      {locations.map((loc) => (
                        <Marker
                          key={loc.complaint_id}
                          position={[Number(loc.latitude), Number(loc.longitude)]}
                          icon={markerIcon(loc.urgency_level)}
                        >
                          <Popup>
                            <div className="text-sm">
                              <Link to={`/complaint/${loc.complaint_id}`} className="font-semibold text-primary-600 tnum">{loc.complaint_id}</Link>
                              <p className="text-neutral-600">{tv('status', loc.status)}</p>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                ) : (
                  <div className="flex h-80 items-center justify-center border border-dashed border-neutral-300 bg-white px-6 text-center">
                    <p className="text-neutral-600">{t('dash_no_locations')}</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
