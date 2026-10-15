import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { api, complaintService } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Alert, FormField, PageTitle } from '../../components/UI'
import Toast from '../../components/Toast'
import VoiceInput from '../../components/VoiceInput'
import CameraCapture from '../../components/CameraCapture'
import {
  Camera, MapPin, FileText, CheckCircle2, ArrowLeft, ArrowRight,
  Lightbulb, Locate, Send, ImagePlus, AlertTriangle, Clock, Loader2,
} from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { useLanguage } from '../../context/LanguageContext'

const WARDS = [
  'Lahore Cant', 'Data Ganj Baksh', 'Allama Iqbal', 'Azad Pul', 'Mall',
  'Johar Town', 'Shadbagh', 'Ravi', 'Thokar Niaz Baig', 'Wagha', 'Gulshan Ravi'
]

const LAHORE = [31.5204, 74.3587]

const STEPS = [
  { num: 1, label: 'report_step_photo',    icon: Camera },
  { num: 2, label: 'report_step_location', icon: MapPin },
  { num: 3, label: 'report_step_details',  icon: FileText },
  { num: 4, label: 'report_step_review',   icon: CheckCircle2 },
]

// A plain map pin; Leaflet's default icon needs image assets Vite does not copy.
const pinIcon = L.divIcon({
  className: '',
  html: '<svg width="36" height="44" viewBox="0 0 36 44" style="display:block;filter:drop-shadow(0 2px 2px rgba(22,25,28,.4))"><path d="M18 1C8.6 1 1 8.6 1 18c0 12.4 17 25 17 25s17-12.6 17-25C35 8.6 27.4 1 18 1z" fill="#c62828" stroke="#fff" stroke-width="2"/><circle cx="18" cy="18" r="6.5" fill="#fff"/></svg>',
  iconSize: [36, 44],
  iconAnchor: [18, 43],
})

// Tap the map to move the pin; the view zooms in on it so the person can
// check it is on the right street.
function PinPicker({ lat, lng, onPick }) {
  const map = useMap()
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng], Math.max(map.getZoom(), 16))
  }, [map, lat, lng])
  return lat != null && lng != null ? <Marker position={[lat, lng]} icon={pinIcon} /> : null
}

export default function ReportHazard() {
  useDocumentTitle('title_report')
  const { t, tv } = useLanguage()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    image_url: '',
    description: '',
    latitude: null,
    longitude: null,
    address: '',
    ward: '',
    landmark: '',
  })
  const [imagePreview, setImagePreview] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [submittedId, setSubmittedId] = useState(null)
  const [toast, setToast] = useState(null)
  const [detectedClasses, setDetectedClasses] = useState([])
  // Result of the automatic photo check: null while unknown, then 'found',
  // 'none' (nothing recognised) or 'unavailable' (the service is down).
  const [photoCheck, setPhotoCheck] = useState(null)
  const [heldForReview, setHeldForReview] = useState(false)
  const [imageUrlUploading, setImageUrlUploading] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  // The upload started at step 1 (it also runs hazard detection, which can
  // take half a minute). Send waits for it instead of uploading again.
  const uploadRef = useRef(null)
  // In-page camera (front/back switch, works on laptops). Without it, or when
  // the browser refuses it, "Take photo" uses the phone's own camera input.
  const [cameraOpen, setCameraOpen] = useState(false)
  const [liveCamera, setLiveCamera] = useState(() => !!navigator.mediaDevices?.getUserMedia)
  const openCamera = () => (liveCamera ? setCameraOpen(true) : cameraInputRef.current?.click())
  const cameraUnavailable = useCallback(() => {
    setCameraOpen(false)
    setLiveCamera(false)
    setError(t('camera_unavailable'))
  }, [t])

  const hasLocation = formData.latitude != null && formData.longitude != null
  const pinPosition = hasLocation ? [formData.latitude, formData.longitude] : null

  const handleImageChange = (e) => acceptImageFile(e.target.files?.[0])

  const handleImageDrop = (e) => {
    e.preventDefault()
    setIsDraggingOver(false)
    acceptImageFile(e.dataTransfer?.files?.[0])
  }

  const acceptImageFile = async (file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError(t('report_invalid_image'))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setImagePreview(event.target.result)
    }
    reader.readAsDataURL(file)
    setSelectedFile(file)
    setFormData(prev => ({ ...prev, image_url: '' }))
    setDetectedClasses([])
    setPhotoCheck(null)
    setError('')

    // Upload image immediately so we get early detection results
    setImageUrlUploading(true)
    const fd = new FormData()
    fd.append('image', file)
    const upload = complaintService.uploadImage(fd, (progressEvent) => {
      const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      setUploadProgress(percent)
    }).then((res) => res.data)
    uploadRef.current = upload
    try {
      const data = await upload
      if (uploadRef.current !== upload) return // a newer photo replaced this one
      setFormData(prev => ({ ...prev, image_url: data.image_url }))
      if (data.detected_classes?.length > 0) {
        setDetectedClasses(data.detected_classes)
      }
      setPhotoCheck(data.detection_available === false ? 'unavailable' : data.detected_classes?.length ? 'found' : 'none')
    } catch {
      // Non-fatal: image will be re-uploaded at submit time if needed
    } finally {
      if (uploadRef.current === upload) {
        setImageUrlUploading(false)
        setUploadProgress(0)
      }
    }
  }

  // Dictated speech appends rather than replaces, so a citizen can speak in
  // several goes and still edit the result by hand afterwards.
  const handleTranscript = (text) => {
    setFormData(prev => {
      const existing = prev.description.trim()
      return { ...prev, description: existing ? `${existing} ${text}` : text }
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const setPin = (latitude, longitude) => {
    setFormData(prev => ({ ...prev, latitude, longitude }))
    setError('')
  }

  const handleGeoLocation = () => {
    if (!('geolocation' in navigator)) {
      setError(t('report_location_failed'))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        setPin(position.coords.latitude, position.coords.longitude)
        setToast({ message: t('report_location_detected'), type: 'success' })
      },
      () => {
        setLocating(false)
        setError(t('report_location_failed'))
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  // Each step checks its own input, so a missing piece is caught where it can
  // be fixed instead of at the final Send.
  const goTo = (next) => {
    if (next > 1 && !selectedFile && !formData.image_url) return setError(t('report_need_photo'))
    if (next > 2 && !hasLocation) return setError(t('report_need_location'))
    if (next > 3 && !formData.description.trim()) return setError(t('report_need_description'))
    setError('')
    setStep(next)
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      if (!selectedFile && !formData.image_url) {
        throw new Error(t('report_need_photo'))
      }
      if (!formData.description.trim()) {
        throw new Error(t('report_need_description'))
      }

      // Was the "nothing found" warning already on screen when Send was
      // pressed? Then this press is the "Send anyway".
      const alreadyWarned = photoCheck === 'none' || photoCheck === 'unavailable'
      let imageUrl = formData.image_url
      if (!imageUrl && uploadRef.current) {
        // The photo check is still running: wait for it, so the person is
        // asked before sending rather than finding out afterwards.
        const data = await uploadRef.current.catch(() => null)
        imageUrl = data?.image_url || ''
        const nothingFound = data && (data.detection_available === false || !data.detected_classes?.length)
        if (nothingFound && !alreadyWarned) return // the warning and "Send anyway" now show
      }

      // Only upload if the step 1 upload failed
      if (!imageUrl && selectedFile) {
        const fd = new FormData()
        fd.append('image', selectedFile)
        const uploadRes = await complaintService.uploadImage(fd, (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percent)
        })
        imageUrl = uploadRes.data.image_url
      }

      const response = await api.post('/api/complaints/submit/', {
        image_url: imageUrl,
        // The model stores 6 decimal places (about 10 cm).
        latitude: Number(formData.latitude.toFixed(6)),
        longitude: Number(formData.longitude.toFixed(6)),
        description: formData.description,
        address: formData.address,
        ward: formData.ward,
        landmark: formData.landmark,
      })

      // No automatic redirect: the complaint number has to stay on screen
      // long enough to be written down.
      setSubmittedId(response.data.complaint_id)
      setHeldForReview(!!response.data.flagged)
      setToast({ message: t(response.data.flagged ? 'report_under_review' : 'report_submitted'), type: response.data.flagged ? 'info' : 'success' })
    } catch (err) {
      // Server messages without the API field names (image_url: ...), which
      // mean nothing to the person reporting.
      const responseData = err.response?.data
      const serverMessage = responseData?.detail
        || (responseData && typeof responseData === 'object' && [].concat(Object.values(responseData)[0] ?? '')[0])
      const message = serverMessage || (err.response ? t('report_failed') : err.message) || t('report_failed')
      setError(message)
      setToast({ message, type: 'error' })
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const resetForm = () => {
    setStep(1)
    setFormData({ image_url: '', description: '', latitude: null, longitude: null, address: '', ward: '', landmark: '' })
    setImagePreview('')
    setSelectedFile(null)
    setDetectedClasses([])
    setPhotoCheck(null)
    setHeldForReview(false)
    setSubmittedId(null)
    setError('')
    uploadRef.current = null
  }

  // The suggested text is inserted into the description, so it is written in
  // the UI language; the sentiment analyser reads Urdu and English alike.
  const suggestion = detectedClasses.length > 0
    ? (formData.ward
        ? t('report_suggest_ward', { hazard: tv('hazard', detectedClasses[0]), ward: tv('ward', formData.ward) })
        : t('report_suggest_local', { hazard: tv('hazard', detectedClasses[0]) }))
    : ''

  const stepHeading = (Icon, key) => (
    <h2 className="mb-5 flex items-center gap-2.5 text-xl font-bold sm:text-2xl">
      <Icon size={22} className="shrink-0 text-neutral-500" aria-hidden="true" />
      {t(key)}
    </h2>
  )

  const navButtons = (back, next, nextLabel = 'common_next') => (
    <div className="mt-6 flex gap-3 border-t border-neutral-200 pt-5">
      {back && (
        <Button variant="secondary" size="lg" className="flex-1 sm:flex-none" onClick={() => { setError(''); setStep(back) }}>
          <ArrowLeft size={18} aria-hidden="true" className="rtl:-scale-x-100" /> {t('common_back')}
        </Button>
      )}
      <Button size="lg" className="flex-1" onClick={() => goTo(next)}>
        {t(nextLabel)} <ArrowRight size={18} aria-hidden="true" className="rtl:-scale-x-100" />
      </Button>
    </div>
  )

  const progressBar = (percent, key) => (
    <div className="mt-4">
      <div className="h-1.5 bg-neutral-200">
        <div className="h-full bg-primary-500 transition-all" style={{ width: `${percent}%` }} />
      </div>
      {/* At 100% the server is still running detection on the photo. */}
      <p className="mt-1.5 text-sm text-neutral-700 tnum">{percent >= 100 ? t('report_checking_photo') : t(key, { n: percent })}</p>
    </div>
  )

  return (
    <>
      <Header />
      <PageTitle titleKey="title_report" />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        {cameraOpen && (
          <CameraCapture
            onCapture={(file) => { setCameraOpen(false); acceptImageFile(file) }}
            onClose={() => setCameraOpen(false)}
            onUnavailable={cameraUnavailable}
          />
        )}

        {/* Step indicator: four segments; done and current fill green. */}
        <ol className="mb-6 grid grid-cols-4 gap-2">
          {STEPS.map(({ num, label }) => {
            const isCompleted = num < step || submittedId
            const isActive = num === step && !submittedId
            return (
              <li key={num} aria-current={isActive ? 'step' : undefined}>
                <div className={`h-1.5 ${isCompleted || isActive ? 'bg-primary-500' : 'bg-neutral-300'}`} aria-hidden="true" />
                <div className={`mt-2 flex items-center gap-1.5 text-[15px] ${isActive ? 'font-bold text-neutral-900' : 'text-neutral-600'}`}>
                  {isCompleted ? (
                    <CheckCircle2 size={16} className="shrink-0 text-primary-500" aria-hidden="true" />
                  ) : (
                    <span className="tnum">{num}</span>
                  )}
                  <span className="truncate">{t(label)}</span>
                </div>
              </li>
            )
          })}
        </ol>

        {error && <Alert message={error} type="error" className="mb-5" />}

        <div className="border border-neutral-200 bg-white p-5 sm:p-7">
          {submittedId ? (
            <div className="py-4 text-center" role="status">
              <CheckCircle2 size={44} className="mx-auto text-success" aria-hidden="true" />
              <h2 className="mt-3 text-2xl font-bold">{t('report_thanks')}</h2>
              <p className="mt-5 text-[15px] text-neutral-700">{t('report_your_number')}</p>
              <p className="mt-1 font-heading text-3xl font-bold tracking-wide text-neutral-900 tnum sm:text-4xl" dir="ltr">{submittedId}</p>
              <p className="mx-auto mt-3 max-w-sm text-[15px] text-neutral-700">{t('report_thanks_body')}</p>
              {heldForReview && (
                <p className="mx-auto mt-4 flex max-w-sm items-start gap-2 border border-warning-200 bg-warning-50 px-3 py-2.5 text-start text-[15px] text-warning-700">
                  <Clock size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {t('report_held_for_review')}
                </p>
              )}
              <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
                <Link to={`/track?id=${submittedId}`} className="inline-flex h-12 items-center justify-center rounded-sm bg-primary-500 px-4 text-base font-semibold text-white hover:bg-primary-600">
                  {t('report_see_status')}
                </Link>
                <button type="button" onClick={resetForm} className="inline-flex h-12 items-center justify-center rounded-sm border border-neutral-300 px-4 text-base font-semibold text-neutral-800 hover:bg-neutral-50">
                  {t('report_another')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {step === 1 && (
                <>
                  {stepHeading(Camera, 'report_upload_photo')}
                  <div
                    className={`border-2 border-dashed p-5 text-center transition-colors sm:p-8 ${
                      isDraggingOver ? 'border-primary-500 bg-primary-50' : 'border-neutral-300'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true) }}
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={handleImageDrop}
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt={t('report_upload_photo')} className="mx-auto max-h-64 max-w-full border border-neutral-200" />
                        <p className="mt-3 flex items-center justify-center gap-1.5 text-base font-semibold text-success-700">
                          <CheckCircle2 size={18} aria-hidden="true" />
                          {t('common_photo_selected')}
                        </p>
                      </>
                    ) : (
                      <>
                        <ImagePlus size={40} className="mx-auto text-neutral-500" aria-hidden="true" />
                        <p className="mt-3 text-[15px] text-neutral-700">{t('report_photo_tip')}</p>
                      </>
                    )}
                    {/* Two plain choices: the camera directly, or a photo
                        already on the phone. */}
                    <div className="mx-auto mt-5 flex max-w-sm flex-col gap-3">
                      <Button size="lg" variant={imagePreview ? 'secondary' : 'primary'} onClick={openCamera}>
                        <Camera size={20} aria-hidden="true" />
                        {imagePreview ? t('report_change_photo') : t('report_take_photo')}
                      </Button>
                      <Button size="lg" variant="secondary" onClick={() => galleryInputRef.current?.click()}>
                        <ImagePlus size={20} aria-hidden="true" />
                        {t('report_choose_photo')}
                      </Button>
                    </div>
                  </div>
                  {imageUrlUploading && uploadProgress > 0 && progressBar(uploadProgress, 'report_uploading')}
                  {photoCheck === 'found' && (
                    <p className="mt-4 flex items-center gap-2 text-base font-semibold text-success-700" role="status">
                      <CheckCircle2 size={18} aria-hidden="true" />
                      {t('report_found', { hazard: tv('hazard', detectedClasses[0]) })}
                    </p>
                  )}
                  {photoCheck === 'none' && (
                    <p className="mt-4 flex items-start gap-2 border border-warning-200 bg-warning-50 px-3 py-2.5 text-[15px] text-warning-700" role="status">
                      <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                      {t('report_not_found')}
                    </p>
                  )}
                  {photoCheck === 'unavailable' && (
                    <p className="mt-4 text-[15px] text-neutral-700" role="status">{t('report_check_unavailable')}</p>
                  )}
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="sr-only" tabIndex={-1} aria-hidden="true" />
                  <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleImageChange} className="sr-only" tabIndex={-1} aria-hidden="true" />
                  {imagePreview && navButtons(null, 2)}
                </>
              )}

              {step === 2 && (
                <>
                  {stepHeading(MapPin, 'report_confirm_location')}
                  <Button size="lg" className="w-full" loading={locating} onClick={handleGeoLocation}>
                    {!locating && <Locate size={20} aria-hidden="true" />}
                    {locating ? t('report_finding_location') : t('report_detect_location')}
                  </Button>
                  <p className="mt-4 text-[15px] text-neutral-700">{t('report_map_tip')}</p>
                  <div className="mt-2 h-72 border border-neutral-300 sm:h-80">
                    <MapContainer center={pinPosition || LAHORE} zoom={pinPosition ? 16 : 12} style={{ height: '100%', width: '100%' }} className="z-0">
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                      <PinPicker lat={formData.latitude} lng={formData.longitude} onPick={setPin} />
                    </MapContainer>
                  </div>
                  {hasLocation && (
                    <p className="mt-2 flex items-center gap-1.5 text-base font-semibold text-success-700" role="status">
                      <CheckCircle2 size={18} aria-hidden="true" /> {t('report_location_set')}
                    </p>
                  )}

                  <div className="mt-5 space-y-5">
                    <FormField id="report-ward" labelKey="report_ward">
                      <select id="report-ward" name="ward" value={formData.ward} onChange={handleChange} className="field h-12 text-base">
                        <option value="">{t('report_choose_ward')}</option>
                        {WARDS.map(w => <option key={w} value={w}>{tv('ward', w)}</option>)}
                      </select>
                    </FormField>
                    <FormField id="report-address" labelKey="report_address">
                      <input id="report-address" type="text" name="address" value={formData.address} onChange={handleChange} placeholder={t('report_street_address')} className="field h-12 text-base" />
                    </FormField>
                  </div>
                  {navButtons(1, 3)}
                </>
              )}

              {step === 3 && (
                <>
                  {stepHeading(FileText, 'report_describe')}
                  <p className="mb-4 text-[15px] text-neutral-700">{t('report_describe_tip')}</p>

                  {detectedClasses.length > 0 && !formData.description && (
                    <div className="mb-5 flex flex-wrap items-center gap-3 border border-info-200 bg-info-50 px-4 py-3">
                      <Lightbulb size={18} className="shrink-0 text-info-700" aria-hidden="true" />
                      <p className="min-w-0 flex-1 text-[15px] text-neutral-800">
                        <strong className="text-info-700">{t('report_suggestion')}</strong>{' '}
                        {suggestion}
                      </p>
                      <Button variant="secondary" onClick={() => setFormData(prev => ({ ...prev, description: suggestion }))}>
                        {t('report_use_this')}
                      </Button>
                    </div>
                  )}

                  <VoiceInput onTranscript={handleTranscript} />

                  <label htmlFor="hazard-description" className="sr-only">
                    {t('report_describe')}
                  </label>
                  <textarea
                    id="hazard-description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={t('report_desc_placeholder')}
                    className="field resize-y text-base"
                    rows="4"
                    required
                  />
                  {navButtons(2, 4)}
                </>
              )}

              {step === 4 && (
                <>
                  {stepHeading(CheckCircle2, 'report_review_submit')}

                  <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                    {imagePreview && (
                      <img src={imagePreview} alt={t('report_upload_photo')} className="max-h-48 w-full border border-neutral-200 object-cover" />
                    )}
                    <dl className="divide-y divide-neutral-200 border-y border-neutral-200 text-[15px]">
                      <div className="py-3">
                        <dt className="font-semibold text-neutral-600">{t('report_describe')}</dt>
                        <dd className="mt-1 text-neutral-900">{formData.description}</dd>
                      </div>
                      <div className="py-3">
                        <dt className="font-semibold text-neutral-600">{t('track_location_label')}</dt>
                        <dd className="mt-1 flex items-center gap-1.5 text-neutral-900">
                          <CheckCircle2 size={16} className="shrink-0 text-success-700" aria-hidden="true" />
                          {[formData.address, formData.ward && tv('ward', formData.ward)].filter(Boolean).join(', ') || t('report_location_set')}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {uploadProgress > 0 && progressBar(uploadProgress, 'report_uploading_image')}
                  {photoCheck === null && imageUrlUploading && (
                    <p className="mt-5 flex items-center gap-2 text-[15px] text-neutral-700" role="status">
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" /> {t('report_checking_photo')}
                    </p>
                  )}
                  {(photoCheck === 'none' || photoCheck === 'unavailable') && (
                    <div className="mt-5 border border-warning-200 bg-warning-50 p-4" role="alert">
                      <p className="flex items-start gap-2 text-base font-semibold text-warning-700">
                        <AlertTriangle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                        {t(photoCheck === 'none' ? 'report_send_warning' : 'report_send_warning_unchecked')}
                      </p>
                      <Button variant="secondary" className="mt-3" onClick={() => { setError(''); setStep(1) }}>
                        <Camera size={16} aria-hidden="true" /> {t('report_change_photo')}
                      </Button>
                    </div>
                  )}
                  <div className="mt-6 flex gap-3 border-t border-neutral-200 pt-5">
                    <Button variant="secondary" size="lg" className="flex-1 sm:flex-none" onClick={() => setStep(3)}>
                      <ArrowLeft size={18} aria-hidden="true" className="rtl:-scale-x-100" /> {t('common_back')}
                    </Button>
                    <Button size="lg" className="flex-1" loading={loading} onClick={handleSubmit}>
                      {!loading && <Send size={18} aria-hidden="true" className="rtl:-scale-x-100" />} {t(photoCheck === 'none' ? 'report_send_anyway' : 'report_submit')}
                    </Button>
                  </div>
                  {loading && <p className="mt-3 text-center text-[15px] text-neutral-700" role="status">{t('report_sending_wait')}</p>}
                </>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
