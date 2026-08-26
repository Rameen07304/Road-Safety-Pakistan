import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../../services/api'
import Header from '../../components/Header'
import { Badge, Button } from '../../components/UI'
import 'leaflet/dist/leaflet.css'

const TYPE_LABELS = {
  pothole: ['pothole', 'speed_bump', 'speed bump', 'road_damage', 'damaged road'],
  manhole: ['manhole', 'open manhole', 'broken manhole'],
  street_light: ['street light', 'street_light', 'broken street light'],
  encroachment: ['encroachment', 'obstruction', 'garbage', 'trash'],
}

const PRIORITY_COLORS = {
  critical: 'bg-red-600 text-white',
  in_progress: 'bg-amber-500 text-white',
  pending: 'bg-emerald-600 text-white',
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

function MapContent({ complaints }) {
  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {complaints.map(complaint => {
        const colors = {
          critical: '#dc2626',
          high: '#ea580c',
          medium: '#d97706',
          low: '#16a34a',
        }
        const color = colors[complaint.urgency_level?.toLowerCase()] || '#2563eb'
        const icon = L.divIcon({
          className: '',
          html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,.35)"></span>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -9],
        })

        return (
          <Marker key={complaint.complaint_id} position={[Number(complaint.latitude ?? complaint.lat), Number(complaint.longitude ?? complaint.lng)]} icon={icon}>
            <Popup>
              <div className="w-60">
                <h3 className="font-bold text-gray-900 mb-1">{complaint.complaint_id}</h3>
                <Badge variant={complaint.urgency_level?.toLowerCase() || 'default'} className="mb-2">
                  {complaint.urgency_level} ({complaint.urgency_score}/100)
                </Badge>
                <p className="text-sm text-gray-700 mb-2">{complaint.description}</p>
                <p className="text-xs text-gray-600">Location: {complaint.ward || complaint.address || 'Lahore'}</p>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

export default function LiveMap() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ critical: 0, high: 0, medium: 0, low: 0 })
  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState(['pothole', 'manhole', 'street_light', 'encroachment'])
  const [selectedPriorities, setSelectedPriorities] = useState({ critical: true, inProgress: true, pending: true })
  const [activeComplaintId, setActiveComplaintId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await api.get('/api/complaints/map/')
        const data = response.data.complaints || response.data.results || response.data || []
        setComplaints(data)
        setActiveComplaintId((current) => current || data[0]?.complaint_id || null)
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
      const matchesType = selectedTypes.length === 0 || types.some((item) => selectedTypes.includes(item))

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
    if (filteredComplaints.length === 0) return
    if (!filteredComplaints.some((complaint) => complaint.complaint_id === activeComplaintId)) {
      setActiveComplaintId(filteredComplaints[0].complaint_id)
    }
  }, [filteredComplaints, activeComplaintId])

  const activeComplaint = filteredComplaints.find((complaint) => complaint.complaint_id === activeComplaintId) || filteredComplaints[0] || complaints[0]

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
    { key: 'pothole', label: 'Pothole' },
    { key: 'manhole', label: 'Manhole' },
    { key: 'street_light', label: 'Street Light' },
    { key: 'encroachment', label: 'Encroachment' },
  ]

  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-64px)] bg-[#eef6f0]">
        <div className="bg-white/95 shadow-sm border-b border-green-100 p-4">
          <div className="mx-auto max-w-[1600px] flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Live Hazard Map</h1>
            <div className="flex flex-wrap gap-3">
              <Badge variant="critical">Critical: {stats.critical}</Badge>
              <Badge variant="high">High: {stats.high}</Badge>
              <Badge variant="medium">Medium: {stats.medium}</Badge>
              <Badge variant="low">Low: {stats.low}</Badge>
            </div>
          </div>
        </div>

        <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-[1600px] flex-row overflow-hidden">
          <aside className="w-[285px] flex-shrink-0 border-r border-green-100 bg-white/95 p-4">
            <div className="space-y-5">
              <div>
                <div className="rounded-lg border border-green-100 bg-[#f6fbf7] px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>🔎</span>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search areas in Lahore..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Hazard Type</div>
                <div className="flex flex-wrap gap-2">
                  {typeButtons.map((type) => {
                    const active = selectedTypes.includes(type)
                    return (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => toggleType(type.key)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${active ? 'bg-[#dff3e4] text-[#1c4b37] ring-1 ring-[#9fd8ae]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {type.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Priority & Status</div>
                <div className="space-y-2 text-sm text-gray-700">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedPriorities.critical} onChange={() => togglePriority('critical')} className="h-4 w-4 rounded border-gray-300 text-[#2f6a4d] focus:ring-[#2f6a4d]" />
                    Critical Urgency
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedPriorities.inProgress} onChange={() => togglePriority('inProgress')} className="h-4 w-4 rounded border-gray-300 text-[#2f6a4d] focus:ring-[#2f6a4d]" />
                    In Progress
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedPriorities.pending} onChange={() => togglePriority('pending')} className="h-4 w-4 rounded border-gray-300 text-[#2f6a4d] focus:ring-[#2f6a4d]" />
                    Pending Verification
                  </label>
                </div>
              </div>

              <div className="border-t border-green-100 pt-4">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Recent Reports</div>
                <div className="space-y-3">
                  {recentReports.length > 0 ? recentReports.map((complaint) => (
                    (() => {
                      const isSelected = activeComplaintId === complaint.complaint_id
                      const isCritical = getPriorityKey(complaint) === 'critical'
                      const selectedClass = isSelected
                        ? 'border-red-600 bg-red-600 text-white shadow-lg shadow-red-200'
                        : isCritical
                          ? 'border-red-300 bg-red-50 hover:bg-red-100'
                          : 'border-gray-200 bg-white hover:bg-gray-50'

                      return (
                    <button
                      key={complaint.complaint_id}
                      type="button"
                      onClick={() => setActiveComplaintId(complaint.complaint_id)}
                      className={`w-full rounded-xl border p-3 text-left transition hover:shadow-sm ${selectedClass}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={isSelected || isCritical ? 'critical' : 'default'} className="text-[10px] px-2 py-1">
                          {String(complaint.urgency_level || complaint.status || 'N/A').toUpperCase()}
                        </Badge>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${isSelected ? 'bg-white text-red-600' : getStatusClass(complaint)}`}>{complaint.status || 'pending'}</span>
                      </div>
                      <div className={`mt-2 text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>{complaint.description || complaint.complaint_id}</div>
                      <div className={`mt-1 text-xs ${isSelected ? 'text-red-100' : 'text-gray-500'}`}>{complaint.ward || complaint.address || 'Lahore'}</div>
                    </button>
                      )
                    })()
                  )) : (
                    <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                      No reports match the current filters.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3">
                <button className="w-full rounded-lg bg-[#173b2b] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f281d]">
                  اردو / English
                </button>
              </div>
            </div>
          </aside>

          <section className="relative min-w-0 flex-1 overflow-hidden bg-[#eef6f0] h-[calc(100vh-120px)]">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="absolute inset-0">
                <MapContainer center={[31.5204, 74.3587]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom className="z-0">
                  <MapContent complaints={filteredComplaints} />
                </MapContainer>
              </div>
            )}

            {activeComplaint && (
              <div className="absolute left-1/2 top-20 z-20 w-[290px] -translate-x-1/2 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-[0_20px_60px_rgba(27,67,50,0.18)]">
                <div className="h-28 bg-gradient-to-br from-[#4c3723] via-[#6a4d2d] to-[#2e2117]">
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
                      </div>
                      <h3 className="text-lg font-black text-gray-900 leading-tight">{activeComplaint.description || 'Severely Damaged Road'}</h3>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <div>{activeComplaint.ward || activeComplaint.address || 'Canal Bank Road, near Punjab University'}</div>
                    <div>Anonymous Citizen</div>
                    <div className="text-[#2f6a4d] font-semibold">{activeComplaint.status || 'In Progress'}</div>
                  </div>
                  <Button
                    type="button"
                    className="mt-4 w-full !rounded-none !bg-[#173b2b] !py-3 text-sm font-bold hover:!bg-[#0f281d]"
                    onClick={() => navigate(`/complaint/${activeComplaint.complaint_id}`)}
                  >
                    View Full Details
                  </Button>
                </div>
              </div>
            )}

            <div className="absolute right-4 top-4 z-20 w-[220px] rounded-2xl border border-green-100 bg-white p-4 shadow-lg">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Active Hazards</div>
              <div className="mt-2 flex items-end gap-3">
                <div className="text-4xl font-black text-[#173b2b]">{filteredComplaints.length || 142}</div>
                <div className="text-right text-sm">
                  <div className="font-semibold text-[#c62d22]">{stats.critical} critical now</div>
                  <div className="text-gray-500">Total reported</div>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-green-100">
                <div className="h-full w-[75%] rounded-full bg-[#2f6a4d]" />
              </div>
              <div className="mt-2 text-xs text-gray-500">{resolutionRate || 75}% Resolution Rate this week</div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
