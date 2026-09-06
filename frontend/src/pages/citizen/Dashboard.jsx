import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Card, Badge, Button } from '../../components/UI'
import { urgencyColors, statusLabels, statusClasses, formatDate } from '../../utils/urgencyHelpers'
import { Loader2, Inbox, Map as MapIcon } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

const markerIcon = (urgencyLevel) => {
  const color = urgencyColors[urgencyLevel?.toLowerCase()] || urgencyColors.low
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(28,27,24,0.18)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  })
}

function StatCard({ label, value, accent }) {
  return (
    <Card variant="flat" className="text-center">
      <div className={`text-4xl font-heading font-bold ${accent}`}>{value}</div>
      <div className="mt-1 text-sm font-semibold text-neutral-500">{label}</div>
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
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
        setError('Failed to load your dashboard. Please try again.')
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

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-2">{t('dash_title')}</h1>
          <p className="text-neutral-500">{t('dash_welcome')}{user?.full_name ? `, ${user.full_name}` : ''}. {t('dash_overview')}</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 size={36} className="text-primary-500 animate-spin" />
          </div>
        ) : error ? (
          <Card className="text-center py-12">
            <p className="text-danger font-semibold">{error}</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label={t('dash_total_submitted')} value={stats.total} accent="text-neutral-900" />
              <StatCard label={t('dash_resolved')} value={stats.resolved} accent="text-success" />
              <StatCard label={t('dash_in_progress')} value={stats.in_progress} accent="text-urgency-medium" />
              <StatCard label={t('dash_pending')} value={stats.pending} accent="text-info" />
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Most recent complaint */}
              <Card>
                <h2 className="text-lg font-heading font-bold text-neutral-800 mb-4">{t('dash_most_recent')}</h2>
                {recent ? (
                  <div
                    className="cursor-pointer rounded-lg border border-neutral-200 p-4 hover:shadow-base hover:border-primary-200 transition"
                    onClick={() => navigate(`/complaint/${recent.complaint_id}`)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-heading font-bold text-neutral-900">{recent.complaint_id}</h3>
                      <Badge variant={recent.urgency_level?.toLowerCase()}>
                        {recent.urgency_level} ({recent.urgency_score}/100)
                      </Badge>
                    </div>
                    <p className="text-neutral-600 mb-3 line-clamp-2">
                      {recent.detected_classes?.join(', ') || 'Hazard report'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                      <span>Filed: {formatDate(recent.submitted_at)}</span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusClasses[recent.status] || 'bg-neutral-100 text-neutral-700'}`}>
                        {statusLabels[recent.status] || recent.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-neutral-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Inbox size={28} className="text-neutral-300" />
                    </div>
                    <p className="text-neutral-500 mb-4">{t('dash_no_complaints')}</p>
                    <Button onClick={() => navigate('/report')}>{t('dash_report_first')}</Button>
                  </div>
                )}
              </Card>

              {/* Personal complaint map */}
              <Card className="p-0 overflow-hidden">
                <div className="p-6 pb-0">
                  <h2 className="text-lg font-heading font-bold text-neutral-800 mb-4">{t('dash_my_locations')}</h2>
                </div>
                {locations.length ? (
                  <div className="h-80">
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
                              <p className="font-heading font-bold text-neutral-900">{loc.complaint_id}</p>
                              <p className="text-neutral-600">{statusLabels[loc.status] || loc.status}</p>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-80 px-6 text-center">
                    <div className="w-16 h-16 bg-neutral-50 rounded-xl flex items-center justify-center mb-4">
                      <MapIcon size={28} className="text-neutral-300" />
                    </div>
                    <p className="text-neutral-500">{t('dash_no_locations')}</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
