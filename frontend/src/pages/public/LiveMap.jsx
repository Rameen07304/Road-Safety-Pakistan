import { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet.heat'
import { api } from '../../services/api'
import Header from '../../components/Header'
import { Badge, Button } from '../../components/UI'
import UpvoteButton from '../../components/UpvoteButton'
import { useLanguage } from '../../context/LanguageContext'
import { urgencyColors } from '../../utils/urgencyHelpers'
import { Search, X, Users, TrendingUp, TrendingDown, Minus, BarChart3, Loader2 } from 'lucide-react'
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

const PRIORITY_COLORS = {
  critical: 'bg-danger text-white',
  in_progress: 'bg-urgency-medium text-white',
  pending: 'bg-success text-white',
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

const getStatusClass = (complaint) => {
  const key = getPriorityKey(complaint)
  return PRIORITY_COLORS[key] || PRIORITY_COLORS.pending
}

const ProgressionIcon = ({ progression }) => {
  if (progression === 'Worsening') return <TrendingUp size={11} />
  if (progression === 'Improving') return <TrendingDown size={11} />
  return <Minus size={11} />
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
          const color = urgencyColors[urgencyLevel] || urgencyColors.low
          const icon = L.divIcon({
            className: '',
            html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(28,27,24,0.18)"></span>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            popupAnchor: [0, -9],
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
                  <h3 className="font-heading font-bold text-neutral-900 mb-1">{complaint.complaint_id}</h3>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant={urgencyLevel || 'default'}>
                      {complaint.urgency_level} ({complaint.urgency_score}/100)
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
                    <div className="mb-2 rounded-lg bg-accent-light border border-accent/20 px-2.5 py-1.5 text-xs font-semibold text-neutral-700">
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} className="text-accent-dark" />
                        {complaint.linked_count} reports linked nearby
                      </span>
                      {complaint.cluster_progression && (
                        <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
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
                  <p className="text-sm text-neutral-600 mb-2">{complaint.description}</p>
                  <p className="text-xs text-neutral-400">Location: {complaint.ward || complaint.address || 'Lahore'}</p>
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
  useDocumentTitle('Live Hazard Map')
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ critical: 0, high: 0, medium: 0, low: 0 })
  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState(['pothole', 'manhole', 'street_light', 'encroachment'])
  const [selectedPriorities, setSelectedPriorities] = useState({ critical: true, inProgress: true, pending: true })
  const [activeComplaintId, setActiveComplaintId] = useState(null)
  const [viewMode, setViewMode] = useState('markers')
  const { t, toggleLanguage } = useLanguage()
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
    if (!activeComplaintId) return
    if (!filteredComplaints.some((complaint) => complaint.complaint_id === activeComplaintId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing pattern: clear stale selection
      setActiveComplaintId(null)
    }
  }, [filteredComplaints, activeComplaintId])

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

  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-64px)] bg-neutral-50">
        {/* ── Top Bar ── */}
        <div className="bg-white/95 backdrop-blur-sm shadow-subtle border-b border-neutral-100 p-4">
          <div className="mx-auto max-w-[1600px] flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-xl font-heading font-bold text-neutral-900">{t('map_title')}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="critical">Critical: {stats.critical}</Badge>
              <Badge variant="high">High: {stats.high}</Badge>
              <Badge variant="medium">Medium: {stats.medium}</Badge>
              <Badge variant="low">Low: {stats.low}</Badge>
              <div className="flex rounded-full border border-neutral-100 bg-neutral-50 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode('markers')}
                  aria-pressed={viewMode === 'markers'}
                  className={`rounded-full px-3 py-1.5 transition ${viewMode === 'markers' ? 'bg-primary-800 text-white shadow-subtle' : 'text-neutral-500 hover:text-primary-700'}`}
                >
                  {t('map_markers')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('heatmap')}
                  aria-pressed={viewMode === 'heatmap'}
                  className={`rounded-full px-3 py-1.5 transition ${viewMode === 'heatmap' ? 'bg-primary-800 text-white shadow-subtle' : 'text-neutral-500 hover:text-primary-700'}`}
                >
                  {t('map_heatmap')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-[1600px] flex-row overflow-hidden">
          {/* ── Sidebar ── */}
          <aside className="w-[285px] flex-shrink-0 border-r border-neutral-100 bg-white/95 p-4">
            <div className="space-y-5">
              {/* Search */}
              <div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 shadow-subtle">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <Search size={15} className="text-neutral-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('map_search_placeholder')}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
                    />
                  </div>
                </div>
              </div>

              {/* Hazard Type Filters */}
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">{t('map_hazard_type')}</div>
                <div className="flex flex-wrap gap-2">
                  {typeButtons.map((type) => {
                    const active = selectedTypes.includes(type.key)
                    return (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => toggleType(type.key)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${active ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-200' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
                      >
                        {type.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Priority Filters */}
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">{t('map_priority_status')}</div>
                <div className="space-y-2 text-sm text-neutral-600">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedPriorities.critical} onChange={() => togglePriority('critical')} className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-300" />
                    {t('map_critical_urgency')}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedPriorities.inProgress} onChange={() => togglePriority('inProgress')} className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-300" />
                    {t('map_in_progress')}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedPriorities.pending} onChange={() => togglePriority('pending')} className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-300" />
                    {t('map_pending_verification')}
                  </label>
                </div>
              </div>

              {/* Recent Reports */}
              <div className="border-t border-neutral-100 pt-4">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">{t('map_recent_reports')}</div>
                <div className="space-y-3">
                  {recentReports.length > 0 ? recentReports.map((complaint) => {
                    const isSelected = activeComplaintId === complaint.complaint_id
                    const isCritical = getPriorityKey(complaint) === 'critical'
                    const selectedClass = isSelected
                      ? 'border-danger bg-danger text-white shadow-lg shadow-red-200'
                      : isCritical
                        ? 'border-red-200 bg-red-50 hover:bg-red-100'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50'

                    return (
                    <button
                      key={complaint.complaint_id}
                      type="button"
                      onClick={() => setActiveComplaintId(complaint.complaint_id)}
                      className={`w-full rounded-xl border p-3 text-left transition hover:shadow-subtle ${selectedClass}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={isSelected || isCritical ? 'critical' : 'default'} className="text-[10px] px-2 py-1">
                          {String(complaint.urgency_level || complaint.status || 'N/A').toUpperCase()}
                        </Badge>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${isSelected ? 'bg-white text-danger' : getStatusClass(complaint)}`}>{complaint.status || 'pending'}</span>
                      </div>
                      <div className={`mt-2 text-sm font-semibold ${isSelected ? 'text-white' : 'text-neutral-800'}`}>{complaint.description || complaint.complaint_id}</div>
                      <div className={`mt-1 text-xs ${isSelected ? 'text-red-100' : 'text-neutral-400'}`}>{complaint.ward || complaint.address || 'Lahore'}</div>
                    </button>
                      )
                  }) : (
                    <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-400">
                      {t('map_no_reports_match')}
                    </div>
                  )}
                </div>
              </div>

              {/* Language Toggle */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="w-full rounded-lg bg-primary-800 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-900 transition"
                >
                  {t('language_toggle')}
                </button>
              </div>
            </div>
          </aside>

          {/* ── Map Area ── */}
          <section className="relative min-w-0 flex-1 overflow-hidden bg-neutral-50 h-[calc(100vh-120px)]">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 size={36} className="text-primary-500 animate-spin" />
              </div>
            ) : (
              <div className="absolute inset-0">
                <MapContainer center={[31.5204, 74.3587]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom className="z-0">
                  <MapContent complaints={filteredComplaints} onSelectComplaint={setActiveComplaintId} onMapClick={closeCard} onUpvoteChange={handleUpvoteChange} viewMode={viewMode} />
                </MapContainer>
              </div>
            )}

            {/* ── Floating Preview Card ── */}
            {activeComplaint && (
              <div className="absolute left-1/2 top-20 z-20 w-[290px] -translate-x-1/2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-elevated">
                <button
                  type="button"
                  onClick={closeCard}
                  aria-label="Close hazard preview"
                  className="absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
                >
                  <X size={14} />
                </button>
                <div className="h-28 bg-gradient-to-br from-neutral-600 via-neutral-700 to-neutral-800">
                  {activeComplaint.image_url ? (
                    <img src={activeComplaint.image_url} alt={activeComplaint.complaint_id} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-white/80">Reported hazard preview</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex gap-2 text-[10px] font-bold uppercase">
                        <Badge variant="warning" className="px-2 py-1">{(activeComplaint.detected_classes?.[0] || 'Pothole').toUpperCase()}</Badge>
                        <Badge variant={activeComplaint.urgency_level?.toLowerCase() || 'default'} className="px-2 py-1">{(activeComplaint.urgency_level || 'critical').toUpperCase()}</Badge>
                        {activeComplaint.linked_count > 1 && (
                          <Badge variant="accent" className="px-2 py-1 inline-flex items-center gap-1"><Users size={10} /> {activeComplaint.linked_count} linked</Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-heading font-bold text-neutral-900 leading-tight">{activeComplaint.description || 'Severely Damaged Road'}</h3>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-neutral-500">
                    <div>{activeComplaint.ward || activeComplaint.address || 'Canal Bank Road, near Punjab University'}</div>
                    <div>Anonymous Citizen</div>
                    <div className="text-primary-600 font-semibold">{activeComplaint.status || 'In Progress'}</div>
                  </div>
                  <Button
                    type="button"
                    className="mt-4 w-full !rounded-none !bg-primary-800 !py-3 text-sm font-bold hover:!bg-primary-900"
                    onClick={() => navigate(`/complaint/${activeComplaint.complaint_id}`)}
                  >
                    {t('map_view_full_details')}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Stats Floating Card ── */}
            <div className="absolute right-4 top-4 z-20 w-[220px] rounded-xl border border-neutral-100 bg-white p-4 shadow-elevated">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                <BarChart3 size={12} />
                {t('map_active_hazards')}
              </div>
              <div className="mt-2 flex items-end gap-3">
                <div className="text-4xl font-heading font-bold text-neutral-900">{filteredComplaints.length || 142}</div>
                <div className="text-right text-sm">
                  <div className="font-semibold text-danger">{stats.critical} critical now</div>
                  <div className="text-neutral-400">{t('map_total_reported')}</div>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full w-[75%] rounded-full bg-primary-500" />
              </div>
              <div className="mt-2 text-xs text-neutral-400">{resolutionRate || 75}% {t('map_resolution_rate')}</div>
            </div>

            {/* ── Legend ── */}
            <div className="absolute left-4 bottom-4 z-20 rounded-xl border border-neutral-100 bg-white p-3 shadow-elevated">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">{t('map_urgency_legend')}</div>
              <div className="space-y-1.5">
                {['critical', 'high', 'medium', 'low'].map((level) => (
                  <div key={level} className="flex items-center gap-2 text-xs text-neutral-600">
                    <span
                      className="inline-block h-3 w-3 rounded-full border-2 border-white shadow-subtle"
                      style={{ backgroundColor: urgencyColors[level] }}
                    />
                    {t(`urgency_${level}`)}
                    <span className="text-[10px] text-neutral-300 font-mono">{urgencyColors[level]}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
