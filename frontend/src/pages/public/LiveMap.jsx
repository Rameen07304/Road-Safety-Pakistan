import { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet.heat'
import { api } from '../../services/api'
import Header from '../../components/Header'
import { Button, UrgencyMark } from '../../components/UI'
import UpvoteButton from '../../components/UpvoteButton'
import { useLanguage } from '../../context/LanguageContext'
import { translate } from '../../translations/translations'
import { urgencyColors, urgencyMarkSvg, statusClasses, sizedPhoto } from '../../utils/urgencyHelpers'
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
    html: `<div style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:9999px;background:#fff;border:5px solid ${color};box-shadow:0 2px 6px rgba(22,25,28,0.35);color:#16191c;font-weight:800;font-size:16px;">${count}</div>`,
    className: '',
    iconSize: [44, 44],
  })
}

// Filter buttons, keyed by what the detector reports (see detection/detector.py).
const TYPE_LABELS = {
  pothole: ['pothole'],
  manhole: ['open manhole', 'broken manhole', 'manhole'],
  speed_bump: ['speed bump'],
  garbage: ['garbage'],
}
const TYPE_KEYS = Object.keys(TYPE_LABELS)
const LEVELS = ['critical', 'high', 'medium', 'low']


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

  return TYPE_KEYS.filter((key) => TYPE_LABELS[key].some((item) => values.includes(item)))
}

const levelOf = (complaint) => {
  const level = String(complaint.urgency_level || '').toLowerCase()
  return LEVELS.includes(level) ? level : 'low'
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

// The mouse wheel scrolls the page, not the map, until the map is clicked;
// otherwise a person scrolling down the page gets stuck zooming the map.
function MapClickHandler({ onMapClick }) {
  const map = useMapEvents({
    click: () => {
      map.scrollWheelZoom.enable()
      onMapClick()
    },
    mouseout: () => map.scrollWheelZoom.disable(),
  })
  return null
}

// Heat per report, by danger level: even a minor problem must show. (Raw
// urgency scores sit near 0.1 for minor ones, which drew next to nothing.)
const HEAT_WEIGHT = { low: 0.4, medium: 0.6, high: 0.8, critical: 1 }

function getHeatmapPoints(complaints) {
  const points = []
  complaints.forEach((complaint) => {
    const lat = Number(complaint.latitude ?? complaint.lat)
    const lng = Number(complaint.longitude ?? complaint.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    points.push([lat, lng, HEAT_WEIGHT[levelOf(complaint)]])
  })
  return points
}

function HeatmapLayer({ complaints }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    const points = getHeatmapPoints(complaints)
    const layer = L.heatLayer(points, {
      radius: 32,
      blur: 24,
      // leaflet.heat halves every point per zoom level below maxZoom; at 17 a
      // city view (zoom 12-13) drew at 1/16 strength, i.e. invisibly.
      maxZoom: 11,
      max: 1,
      minOpacity: 0.35,
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

function MapContent({ complaints, onSelectComplaint, onMapClick, viewMode }) {
  const { tv } = useLanguage()
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
          const urgencyLevel = levelOf(complaint)
          // Pins use the legend shape for their urgency, not a generic dot.
          const icon = L.divIcon({
            className: '',
            html: urgencyMarkSvg(urgencyLevel, 32),
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })

          return (
            <Marker
              key={complaint.complaint_id}
              position={[Number(complaint.latitude ?? complaint.lat), Number(complaint.longitude ?? complaint.lng)]}
              icon={icon}
              urgencyLevel={urgencyLevel}
              title={`${tv('urgency', urgencyLevel)} · ${tv('hazard', complaint.detected_classes?.[0]) || complaint.complaint_id}`}
              eventHandlers={{ click: () => onSelectComplaint(complaint.complaint_id) }}
            />
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
  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState(TYPE_KEYS)
  const [selectedLevels, setSelectedLevels] = useState(LEVELS)
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

      return matchesSearch && matchesType && selectedLevels.includes(levelOf(complaint))
    })
  }, [complaints, search, selectedTypes, selectedLevels])

  const counts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0 }
    complaints.forEach((complaint) => { c[levelOf(complaint)] += 1 })
    return c
  }, [complaints])

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

  const toggleIn = (setter) => (key) =>
    setter((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]))
  const toggleType = toggleIn(setSelectedTypes)
  const toggleLevel = toggleIn(setSelectedLevels)

  const recentReports = filteredComplaints.slice(0, 3)
  const typeButtons = TYPE_KEYS.map((key) => ({ key, label: key === 'manhole' ? t('map_manhole') : tv('hazard', key) }))

  const toggleClass = (active) =>
    `min-h-10 rounded-sm border px-3.5 text-[15px] font-medium transition-colors ${
      active ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400'
    }`

  return (
    <>
      <Header />
      {/* Fills the screen below the header, but never shorter than 720px:
          on a short laptop screen the page scrolls instead of squeezing the map. */}
      <div className="bg-neutral-50 md:flex md:h-[calc(100dvh-64px)] md:min-h-[720px] md:flex-col">
        {/* Toolbar: title, what to do, and the danger levels. The levels are
            the legend, the counts and the filter in one row, right above the
            map, so phones see them before the map too. */}
        <div className="flex-none border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
              <div>
                <h1 className="font-heading text-xl font-bold">{t('map_title')}</h1>
                <p lang={other} dir={other === 'ur' ? 'rtl' : 'ltr'} style={{ textAlign: language === 'ur' ? 'right' : 'left' }} className="text-[13px] text-neutral-500">
                  {translate(other, 'map_title')}
                </p>
              </div>
              <div className="flex gap-1.5" role="group" aria-label={`${t('map_markers')} / ${t('map_heatmap')}`}>
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

            <p className="mt-2 text-[15px] text-neutral-800">
              <span className="font-semibold tnum">{t('map_summary', { n: complaints.length, pct: resolutionRate })}</span>
              {viewMode === 'markers' && <span className="text-neutral-600"> · {t('map_hint')}</span>}
            </p>

            <fieldset className="mt-3">
              <legend className="mb-2 text-[15px] font-semibold text-neutral-900">{t('map_urgency_legend')}</legend>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((level) => {
                  const on = selectedLevels.includes(level)
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleLevel(level)}
                      aria-pressed={on}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-sm border-2 px-3 text-[15px] font-semibold transition-colors ${
                        on ? 'border-neutral-800 bg-white text-neutral-900' : 'border-neutral-200 bg-neutral-100 text-neutral-500 line-through'
                      }`}
                    >
                      <span className={on ? '' : 'opacity-40'}><UrgencyMark level={level} size={18} /></span>
                      {t(`urgency_${level}`)}
                      <span className="tnum font-bold">{counts[level]}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>
          </div>
        </div>

        {/* Phones: map first at full width, filters below. */}
        <div className="mx-auto flex w-full max-w-[1600px] flex-col overflow-hidden md:min-h-0 md:flex-1 md:flex-row">
          <aside className="order-last w-full flex-shrink-0 border-t border-neutral-200 bg-white md:order-none md:w-[300px] md:overflow-y-auto md:border-e md:border-t-0">
            <div className="border-b border-neutral-200 p-4">
              <label className="relative block">
                <span className="sr-only">{t('map_search_placeholder')}</span>
                <Search size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('map_search_placeholder')}
                  className="field ps-10 text-[15px]"
                />
              </label>
            </div>

            <fieldset className="border-b border-neutral-200 p-4">
              <legend className="float-start mb-3 w-full text-[15px] font-semibold text-neutral-900">{t('map_hazard_type')}</legend>
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

            <div className="p-4">
              <h2 className="mb-1 text-[15px] font-semibold text-neutral-900">{t('map_recent_reports')}</h2>
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
                          {complaint.image_url ? (
                            <img src={sizedPhoto(complaint.image_url, 160)} alt="" className="h-14 w-14 shrink-0 border border-neutral-200 bg-neutral-100 object-cover" loading="lazy" />
                          ) : (
                            <UrgencyMark level={levelOf(complaint)} size={16} className="mt-1" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-x-1.5 text-[15px] font-semibold text-neutral-900">
                              {complaint.image_url && <UrgencyMark level={levelOf(complaint)} size={13} />}
                              <span className="whitespace-nowrap">{t(`urgency_${levelOf(complaint)}`)}</span>
                              {complaint.detected_classes?.[0] && <span className="font-normal text-neutral-700"> · {tv('hazard', complaint.detected_classes[0])}</span>}
                            </span>
                            <span className="mt-0.5 block truncate text-sm text-neutral-700">{complaint.description || complaint.complaint_id}</span>
                            <span className="mt-1 flex items-center gap-2 text-sm text-neutral-600">
                              {tv('ward', complaint.ward) || complaint.address || t('common_lahore')}
                              <span className={`rounded-sm px-1.5 text-[13px] ${statusClasses[complaint.status] || statusClasses.submitted}`}>{tv('status', complaint.status || 'pending')}</span>
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="py-4 text-[15px] text-neutral-600">{t('map_no_reports_match')}</p>
              )}
            </div>
          </aside>

          <section className="relative h-[65dvh] min-w-0 flex-none overflow-hidden bg-neutral-100 md:h-auto md:flex-1">
            {loading ? (
              <div className="flex h-full items-center justify-center" role="status">
                <Loader2 size={28} className="animate-spin text-neutral-500" aria-hidden="true" />
              </div>
            ) : (
              <div className="absolute inset-0">
                <MapContainer center={[31.5204, 74.3587]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} className="z-0">
                  <MapContent complaints={filteredComplaints} onSelectComplaint={setActiveComplaintId} onMapClick={closeCard} viewMode={viewMode} />
                  <FocusOnComplaint complaint={focusComplaint} />
                </MapContainer>
              </div>
            )}

            {activeComplaint && (() => {
              const level = levelOf(activeComplaint)
              const hazard = activeComplaint.detected_classes?.[0]
              return (
                <div className="absolute inset-x-3 top-3 z-20 mx-auto max-w-[320px] border border-neutral-300 bg-white shadow-elevated">
                  {activeComplaint.image_url && (activeComplaint.resolved_image_url ? (
                    <div className="grid grid-cols-2 gap-px bg-neutral-300">
                      {[[activeComplaint.image_url, 'track_before'], [activeComplaint.resolved_image_url, 'track_after']].map(([src, label]) => (
                        <a key={label} href={src} target="_blank" rel="noreferrer" className="relative block">
                          <img src={sizedPhoto(src, 480)} alt={t(label)} className="h-40 w-full bg-neutral-200 object-cover" />
                          <span className="absolute bottom-1.5 start-1.5 bg-neutral-900/80 px-1.5 py-0.5 text-xs font-semibold text-white">{t(label)}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    // Tap the photo to see it full size: the point is to judge the road.
                    <a href={activeComplaint.image_url} target="_blank" rel="noreferrer" className="block" title={t('admin_open_photo')}>
                      <img src={sizedPhoto(activeComplaint.image_url, 640)} alt={hazard ? tv('hazard', hazard) : activeComplaint.complaint_id} className="h-48 w-full bg-neutral-200 object-cover" />
                    </a>
                  ))}
                  <button
                    type="button"
                    onClick={closeCard}
                    aria-label={t('map_close_preview')}
                    className="absolute end-2 top-2 flex h-10 w-10 items-center justify-center rounded-sm bg-neutral-900/85 text-white transition-colors hover:bg-neutral-900"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                  <div className="p-4">
                    {/* The danger level first, as big as a heading: it is the
                        one thing every reader needs. */}
                    <p className={`flex flex-wrap items-center gap-2 text-lg font-bold text-neutral-900 ${activeComplaint.image_url ? '' : 'pe-11'}`}>
                      <UrgencyMark level={level} size={20} />
                      {t(`urgency_${level}`)}
                      {hazard && <span className="font-semibold text-neutral-700">· {tv('hazard', hazard)}</span>}
                    </p>
                    {activeComplaint.description && (
                      <p className="mt-2 text-[15px] leading-snug text-neutral-800">{activeComplaint.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-700">
                      <span>{tv('ward', activeComplaint.ward) || activeComplaint.address || t('common_lahore')}</span>
                      <span className={`rounded-sm px-1.5 text-[13px] ${statusClasses[activeComplaint.status] || statusClasses.submitted}`}>{tv('status', activeComplaint.status || 'pending')}</span>
                    </div>
                    {activeComplaint.linked_count > 1 && (
                      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-700">
                        <span className="inline-flex items-center gap-1"><Users size={14} aria-hidden="true" /> {t('map_linked_nearby', { n: activeComplaint.linked_count })}</span>
                        {activeComplaint.cluster_progression && (
                          <span className={`inline-flex items-center gap-1 rounded-sm px-1.5 ${
                            activeComplaint.cluster_progression === 'Worsening'
                              ? 'bg-danger-50 text-danger-700'
                              : activeComplaint.cluster_progression === 'Improving'
                                ? 'bg-success-50 text-success-700'
                                : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            <ProgressionIcon progression={activeComplaint.cluster_progression} />
                            {tv('progression', activeComplaint.cluster_progression)}
                          </span>
                        )}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <UpvoteButton
                        complaintId={activeComplaint.complaint_id}
                        upvotes={activeComplaint.upvotes || 0}
                        hasUpvoted={!!activeComplaint.has_upvoted}
                        onChange={(next) => handleUpvoteChange(activeComplaint.complaint_id, next)}
                      />
                      <Button type="button" className="flex-1" onClick={() => navigate(`/complaint/${activeComplaint.complaint_id}`)}>
                        {t('map_view_full_details')}
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-neutral-500 tnum" dir="ltr">{activeComplaint.complaint_id}</p>
                  </div>
                </div>
              )
            })()}

            {viewMode === 'markers' ? (
              <p className="absolute bottom-3 start-3 z-20 flex max-w-[300px] items-center gap-2.5 border border-neutral-300 bg-white px-3 py-2 text-[13px] leading-snug text-neutral-800 shadow-elevated">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-neutral-500 bg-white text-sm font-extrabold" aria-hidden="true">3</span>
                {t('map_cluster_note')}
              </p>
            ) : (
              <p className="absolute bottom-3 start-3 z-20 flex max-w-[300px] items-center gap-2.5 border border-neutral-300 bg-white px-3 py-2 text-[13px] leading-snug text-neutral-800 shadow-elevated">
                <span
                  className="h-8 w-8 shrink-0 rounded-full"
                  style={{ background: `radial-gradient(circle, ${urgencyColors.critical} 0%, ${urgencyColors.high} 35%, ${urgencyColors.medium} 60%, ${urgencyColors.low} 85%, transparent 100%)` }}
                  aria-hidden="true"
                />
                {t('map_heat_note')}
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
