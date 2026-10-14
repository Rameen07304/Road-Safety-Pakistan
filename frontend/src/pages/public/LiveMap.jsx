import { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet.heat'
import { api } from '../../services/api'
import Header from '../../components/Header'
import { Badge, Button, UrgencyMark } from '../../components/UI'
import UpvoteButton from '../../components/UpvoteButton'
import { useLanguage } from '../../context/LanguageContext'
import { translate } from '../../translations/translations'
import { urgencyColors, urgencyMarkSvg, statusClasses } from '../../utils/urgencyHelpers'
import { Search, X, Users, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const URGENCY_RANK = { low: 1, medium: 2, high: 3, critical: 4 }

const getHighestUrgencyColor = (markers) => {
  let topLevel = 'low'
  let topRank = 0
  markers.forEach((marker) => {
    const level = marker.options?.urgencyLevel || 'low'
    const rank = URGENCY_RANK[level] || 0
    if (rank > topRank) {
      topRank = rank
      topLevel = level
    }
  })
  return urgencyColors[topLevel] || urgencyColors.low
}

const createClusterIcon = (cluster) => {
  const count = cluster.getChildCount()
  const color = getHighestUrgencyColor(cluster.getAllChildMarkers())
  return L.divIcon({
    html: `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(28,27,24,0.18);color:white;font-weight:700;font-size:13px;">${count}</div>`,
    className: '',
    iconSize: [40, 40],
  })
}

const TYPE_LABELS = {
  pothole: ['pothole', 'speed_bump', 'speed bump', 'road_damage', 'damaged road'],
  manhole: ['manhole', 'open manhole', 'broken manhole'],
  street_light: ['street light', 'street_light', 'broken street light'],
  encroachment: ['encroachment', 'obstruction', 'garbage', 'trash'],
}


const normalizeValue = (value) => String(value || '').toLowerCase().replace(/[_-]+/g, ' ').trim()

const getComplaintText = (complaint) =>
  [
    complaint.complaint_id,
    complaint.description,
    complaint.ward,
    complaint.address,
    (complaint.detected_classes || []).join(' '),
    complaint.hazard_type,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

const getComplaintTypes = (complaint) => {
  const values = [
    complaint.hazard_type,
    ...(complaint.detected_classes || []),
  ].map(normalizeValue)

  if (values.some((value) => TYPE_LABELS.pothole.some((item) => normalizeValue(item) === value))) return ['pothole']
  if (values.some((value) => TYPE_LABELS.manhole.some((item) => normalizeValue(item) === value))) return ['manhole']
  if (values.some((value) => TYPE_LABELS.street_light.some((item) => normalizeValue(item) === value))) return ['street_light']
  if (values.some((value) => TYPE_LABELS.encroachment.some((item) => normalizeValue(item) === value))) return ['encroachment']

  return []
}

const getPriorityKey = (complaint) => {
  const urgency = normalizeValue(complaint.urgency_level)
  const status = normalizeValue(complaint.status)

  if (urgency === 'critical' || status === 'critical') return 'critical'
  if (status === 'in progress' || status === 'in_progress' || urgency === 'high') return 'in_progress'
  return 'pending'
}


const ProgressionIcon = ({ progression }) => {
  if (progression === 'Worsening') return <TrendingUp size={11} />
  if (progression === 'Improving') return <TrendingDown size={11} />
  return <Minus size={11} />
}

// Pans to the complaint named in /map?focus=<id> once it is on the map.
function FocusOnComplaint({ complaint }) {
  const map = useMap()
  useEffect(() => {
    if (!complaint) return
    const lat = Number(complaint.latitude ?? complaint.lat)
    const lng = Number(complaint.longitude ?? complaint.lng)
    if (Number.isFinite(lat) && Number.isFinite(lng)) map.setView([lat, lng], 16)
  }, [map, complaint])
  return null
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: () => onMapClick(),
  })
  return null
}

// urgency_score is a 0-100 integer (see backend/detection/urgency.py); leaflet.heat
// expects a weight roughly in the 0-1 range, so we normalize by dividing by 100.
const MAX_URGENCY_SCORE = 100

function getHeatmapPoints(complaints) {
  const points = []
  complaints.forEach((complaint) => {
    const lat = Number(complaint.latitude ?? complaint.lat)
    const lng = Number(complaint.longitude ?? complaint.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    const rawScore = Number(complaint.urgency_score)
    const score = Number.isFinite(rawScore) ? rawScore : 0
    const intensity = Math.max(0, Math.min(score, MAX_URGENCY_SCORE)) / MAX_URGENCY_SCORE

    points.push([lat, lng, intensity])
  })
  return points
}

function HeatmapLayer({ complaints }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    const points = getHeatmapPoints(complaints)
    const layer = L.heatLayer(points, {
      radius: 28,
      blur: 22,
      maxZoom: 17,
      max: 1,
      gradient: {
        0.2: urgencyColors.low,
        0.45: urgencyColors.medium,
        0.7: urgencyColors.high,
        1.0: urgencyColors.critical,
      },
    })
    layer.addTo(map)
    layerRef.current = layer

    return () => {
      layer.remove()
      layerRef.current = null
    }
  }, [map, complaints])

  return null
}

function MapContent({ complaints, onSelectComplaint, onMapClick, onUpvoteChange, viewMode }) {
  const { t, tv } = useLanguage()
  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <MapClickHandler onMapClick={onMapClick} />
      {viewMode === 'heatmap' ? (
        <HeatmapLayer complaints={complaints} />
      ) : (
      <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterIcon}>
        {complaints.map(complaint => {
          const urgencyLevel = complaint.urgency_level?.toLowerCase() || 'low'
          // Pins use the legend shape for their urgency, not a generic dot.
          const icon = L.divIcon({
            className: '',
            html: urgencyMarkSvg(urgencyLevel, 22),
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            popupAnchor: [0, -11],
          })

          return (
            <Marker
              key={complaint.complaint_id}
              position={[Number(complaint.latitude ?? complaint.lat), Number(complaint.longitude ?? complaint.lng)]}
              icon={icon}
              urgencyLevel={urgencyLevel}
              eventHandlers={{ click: () => onSelectComplaint(complaint.complaint_id) }}
            >
              <Popup>
                <div className="w-60">
                  <h3 className="mb-1.5 text-sm font-semibold text-neutral-900 tnum">{complaint.complaint_id}</h3>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant={urgencyLevel || 'default'}>
                      {tv('urgency', complaint.urgency_level)} ({complaint.urgency_score}/100)
                    </Badge>
                    <UpvoteButton
                      complaintId={complaint.complaint_id}
                      upvotes={complaint.upvotes || 0}
                      hasUpvoted={!!complaint.has_upvoted}
                      size="sm"
                      onChange={(next) => onUpvoteChange(complaint.complaint_id, next)}
                    />
                  </div>
                  {complaint.linked_count > 1 && (
                    <div className="mb-2 flex flex-wrap items-center gap-2 border-y border-neutral-200 py-1.5 text-xs font-medium text-neutral-700">
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} aria-hidden="true" />
                        {t('map_linked_nearby', { n: complaint.linked_count })}
                      </span>
                      {complaint.cluster_progression && (
                        <span className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 ${
                          complaint.cluster_progression === 'Worsening'
                            ? 'bg-danger-50 text-danger-700'
                            : complaint.cluster_progression === 'Improving'
                              ? 'bg-success-50 text-success-700'
                              : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          <ProgressionIcon progression={complaint.cluster_progression} />
                          {tv('progression', complaint.cluster_progression)}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-neutral-600 mb-2">{complaint.description}</p>
                  <p className="text-xs text-neutral-500">{t('track_location_label')}: {tv('ward', complaint.ward) || complaint.address || t('common_lahore')}</p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MarkerClusterGroup>
      )}
    </>
  )
}

export default function LiveMap() {
  useDocumentTitle('map_title')
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ critical: 0, high: 0, medium: 0, low: 0 })
  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState(['pothole', 'manhole', 'street_light', 'encroachment'])
  const [selectedPriorities, setSelectedPriorities] = useState({ critical: true, inProgress: true, pending: true })
  const [searchParams] = useSearchParams()
  const focusId = searchParams.get('focus')
  const [activeComplaintId, setActiveComplaintId] = useState(focusId)
  const [viewMode, setViewMode] = useState('markers')
  const { t, tv, language } = useLanguage()
  const other = language === 'ur' ? 'en' : 'ur'
  const navigate = useNavigate()

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await api.get('/api/complaints/map/')
        const data = response.data.complaints || response.data.results || response.data || []
        setComplaints(data)
        setStats({
          critical: data.filter(c => c.urgency_level === 'critical').length,
          high: data.filter(c => c.urgency_level === 'high').length,
          medium: data.filter(c => c.urgency_level === 'medium').length,
          low: data.filter(c => c.urgency_level === 'low').length,
        })
      } catch (err) {
        console.error('Failed to fetch map data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchComplaints()
    const interval = setInterval(fetchComplaints, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredComplaints = useMemo(() => {
    const term = search.trim().toLowerCase()
    return complaints.filter((complaint) => {
      const text = getComplaintText(complaint)
      const matchesSearch = !term || text.includes(term)
      const types = getComplaintTypes(complaint)
      const matchesType = selectedTypes.length === 0 || types.length === 0 || types.some((item) => selectedTypes.includes(item))

      const priorityKey = getPriorityKey(complaint)
      const isCritical = priorityKey === 'critical'
      const isInProgress = priorityKey === 'in_progress'
      const isPending = priorityKey === 'pending'
      const matchesPriority =
        (isCritical && selectedPriorities.critical) ||
        (isInProgress && selectedPriorities.inProgress) ||
        (isPending && selectedPriorities.pending)

      return matchesSearch && matchesType && matchesPriority
    })
  }, [complaints, search, selectedTypes, selectedPriorities])

  useEffect(() => {
    // Wait for the first load, or a ?focus= id would be cleared before it exists.
    if (!activeComplaintId || loading) return
    if (!filteredComplaints.some((complaint) => complaint.complaint_id === activeComplaintId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing pattern: clear stale selection
      setActiveComplaintId(null)
    }
  }, [filteredComplaints, activeComplaintId, loading])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveComplaintId(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const activeComplaint = activeComplaintId
    ? filteredComplaints.find((complaint) => complaint.complaint_id === activeComplaintId)
    : null

  const closeCard = () => setActiveComplaintId(null)
  const focusComplaint = focusId ? complaints.find((c) => c.complaint_id === focusId) : null

  const handleUpvoteChange = (complaintId, next) => {
    setComplaints((prev) =>
      prev.map((c) => (c.complaint_id === complaintId ? { ...c, upvotes: next.upvotes, has_upvoted: next.hasUpvoted } : c))
    )
  }

  const resolutionRate = complaints.length ? Math.round(((complaints.filter((complaint) => complaint.status === 'resolved').length) / complaints.length) * 100) : 0

  const toggleType = (type) => {
    setSelectedTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
    )
  }

  const togglePriority = (key) => {
    setSelectedPriorities((current) => ({ ...current, [key]: !current[key] }))
  }

  const recentReports = filteredComplaints.slice(0, 3)
  const typeButtons = [
    { key: 'pothole', label: t('map_pothole') },
    { key: 'manhole', label: t('map_manhole') },
    { key: 'street_light', label: t('map_street_light') },
    { key: 'encroachment', label: t('map_encroachment') },
  ]

  const legend = ['critical', 'high', 'medium', 'low']
  const toggleClass = (active) =>
    `h-8 rounded-sm border px-3 text-[13px] font-medium transition-colors ${
      active ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400'
    }`

  return (
    <>
      <Header />
      <div className="bg-neutral-50">
        {/* Toolbar: title, the legend with live counts, and the view switch. */}
        <div className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
            <div>
              <h1 className="font-heading text-xl font-bold">{t('map_title')}</h1>
              <p lang={other} dir={other === 'ur' ? 'rtl' : 'ltr'} style={{ textAlign: language === 'ur' ? 'right' : 'left' }} className="text-[13px] text-neutral-500">
                {translate(other, 'map_title')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <p className="text-sm text-neutral-600 tnum">{t('map_summary', { n: filteredComplaints.length, pct: resolutionRate })}</p>
              <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-700" aria-label={t('map_urgency_legend')}>
                {legend.map((level) => (
                  <li key={level} className="inline-flex items-center gap-1.5">
                    <UrgencyMark level={level} size={11} />
                    {t(`urgency_${level}`)}
                    <span className="font-semibold text-neutral-900 tnum">{stats[level]}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-1" role="group" aria-label={`${t('map_markers')} / ${t('map_heatmap')}`}>
                {['markers', 'heatmap'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    aria-pressed={viewMode === mode}
                    className={toggleClass(viewMode === mode)}
                  >
                    {t(mode === 'markers' ? 'map_markers' : 'map_heatmap')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Phones: map first at full width, filters below. */}
        <div className="mx-auto flex min-h-[calc(100dvh-121px)] max-w-[1600px] flex-col overflow-hidden md:flex-row">
          <aside className="order-last w-full flex-shrink-0 border-t border-neutral-200 bg-white md:order-none md:w-[300px] md:border-e md:border-t-0">
            <div className="border-b border-neutral-200 p-4">
              <label className="relative block">
                <span className="sr-only">{t('map_search_placeholder')}</span>
                <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('map_search_placeholder')}
                  className="field ps-9"
                />
              </label>
            </div>

            <fieldset className="border-b border-neutral-200 p-4">
              <legend className="label float-start mb-3 w-full">{t('map_hazard_type')}</legend>
              <div className="clear-both flex flex-wrap gap-2">
                {typeButtons.map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => toggleType(type.key)}
                    aria-pressed={selectedTypes.includes(type.key)}
                    className={toggleClass(selectedTypes.includes(type.key))}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="border-b border-neutral-200 p-4">
              <legend className="label float-start mb-2 w-full">{t('map_priority_status')}</legend>
              <div className="clear-both space-y-1 text-sm text-neutral-800">
                {[
                  ['critical', 'map_critical_urgency'],
                  ['inProgress', 'map_in_progress'],
                  ['pending', 'map_pending_verification'],
                ].map(([key, label]) => (
                  <label key={key} className="flex min-h-8 cursor-pointer items-center gap-2.5">
                    <input type="checkbox" checked={selectedPriorities[key]} onChange={() => togglePriority(key)} className="h-4 w-4" />
                    {t(label)}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="p-4">
              <h2 className="label mb-2">{t('map_recent_reports')}</h2>
              {recentReports.length > 0 ? (
                <ul className="-mx-4">
                  {recentReports.map((complaint) => {
                    const isSelected = activeComplaintId === complaint.complaint_id
                    return (
                      <li key={complaint.complaint_id}>
                        <button
                          type="button"
                          onClick={() => setActiveComplaintId(complaint.complaint_id)}
                          aria-pressed={isSelected}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-start transition-colors ${isSelected ? 'bg-primary-50' : 'hover:bg-neutral-50'}`}
                        >
                          <UrgencyMark level={complaint.urgency_level} size={11} className="mt-1.5" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-neutral-900">{complaint.description || complaint.complaint_id}</span>
                            <span className="mt-0.5 flex items-center gap-2 text-[13px] text-neutral-500">
                              {tv('ward', complaint.ward) || complaint.address || t('common_lahore')}
                              <span className={`rounded-sm px-1.5 text-xs ${statusClasses[complaint.status] || statusClasses.submitted}`}>{tv('status', complaint.status || 'pending')}</span>
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="py-4 text-sm text-neutral-500">{t('map_no_reports_match')}</p>
              )}
            </div>
          </aside>

          <section className="relative h-[65dvh] min-w-0 flex-none overflow-hidden bg-neutral-100 md:h-[calc(100dvh-121px)] md:flex-1">
            {loading ? (
              <div className="flex h-full items-center justify-center" role="status">
                <Loader2 size={28} className="animate-spin text-neutral-500" aria-hidden="true" />
              </div>
            ) : (
              <div className="absolute inset-0">
                <MapContainer center={[31.5204, 74.3587]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom className="z-0">
                  <MapContent complaints={filteredComplaints} onSelectComplaint={setActiveComplaintId} onMapClick={closeCard} onUpvoteChange={handleUpvoteChange} viewMode={viewMode} />
                  <FocusOnComplaint complaint={focusComplaint} />
                </MapContainer>
              </div>
            )}

            {activeComplaint && (
              <div className="absolute inset-x-4 top-4 z-20 mx-auto max-w-[300px] border border-neutral-300 bg-white shadow-elevated">
                <div className="relative h-32 bg-neutral-200">
                  {activeComplaint.image_url ? (
                    <img src={activeComplaint.image_url} alt={activeComplaint.complaint_id} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-500">{t('map_preview_placeholder')}</div>
                  )}
                  <button
                    type="button"
                    onClick={closeCard}
                    aria-label={t('map_close_preview')}
                    className="absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-sm bg-neutral-900/80 text-white transition-colors hover:bg-neutral-900"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {activeComplaint.urgency_level && (
                      <Badge variant={activeComplaint.urgency_level.toLowerCase()}>{tv('urgency', activeComplaint.urgency_level)}</Badge>
                    )}
                    <Badge>{tv('hazard', activeComplaint.detected_classes?.[0]) || t('map_hazard')}</Badge>
                    {activeComplaint.linked_count > 1 && (
                      <Badge variant="accent"><Users size={11} aria-hidden="true" /> {t('map_linked', { n: activeComplaint.linked_count })}</Badge>
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-semibold leading-snug">{activeComplaint.description || activeComplaint.complaint_id}</h3>
                  <div className="mt-2 space-y-0.5 text-sm text-neutral-600">
                    <div>{tv('ward', activeComplaint.ward) || activeComplaint.address || t('common_lahore')}</div>
                    <div className="flex items-center gap-2">
                      <span className="tnum" dir="ltr">{activeComplaint.complaint_id}</span>
                      <span className={`rounded-sm px-1.5 text-xs ${statusClasses[activeComplaint.status] || statusClasses.submitted}`}>{tv('status', activeComplaint.status || 'pending')}</span>
                    </div>
                  </div>
                  <Button type="button" className="mt-4 w-full" onClick={() => navigate(`/complaint/${activeComplaint.complaint_id}`)}>
                    {t('map_view_full_details')}
                  </Button>
                </div>
              </div>
            )}


            <div className="absolute bottom-4 start-4 z-20 hidden border border-neutral-300 bg-white px-3 py-2.5 shadow-elevated md:block">
              <div className="label mb-1.5">{t('map_urgency_legend')}</div>
              <ul className="space-y-1">
                {legend.map((level) => (
                  <li key={level} className="flex items-center gap-2 text-[13px] text-neutral-700">
                    <UrgencyMark level={level} size={11} />
                    {t(`urgency_${level}`)}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
