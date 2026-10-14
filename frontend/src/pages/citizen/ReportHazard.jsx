import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, complaintService } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Alert, FormField, PageTitle } from '../../components/UI'
import Toast from '../../components/Toast'
import VoiceInput from '../../components/VoiceInput'
import {
  Camera, MapPin, FileText, CheckCircle2, ArrowLeft, ArrowRight,
  Lightbulb, Locate, Send, ImagePlus,
} from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { useLanguage } from '../../context/LanguageContext'

const WARDS = [
  'Lahore Cant', 'Data Ganj Baksh', 'Allama Iqbal', 'Azad Pul', 'Mall',
  'Johar Town', 'Shadbagh', 'Ravi', 'Thokar Niaz Baig', 'Wagha', 'Gulshan Ravi'
]

const STEPS = [
  { num: 1, label: 'report_step_photo',    icon: Camera },
  { num: 2, label: 'report_step_location', icon: MapPin },
  { num: 3, label: 'report_step_details',  icon: FileText },
  { num: 4, label: 'report_step_review',   icon: CheckCircle2 },
]

export default function ReportHazard() {
  useDocumentTitle('title_report')
  const { t, tv } = useLanguage()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    image_url: '',
    description: '',
    latitude: 31.5204,
    longitude: 74.3587,
    address: '',
    ward: '',
    landmark: '',
  })
  const [imagePreview, setImagePreview] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [toast, setToast] = useState(null)
  const [detectedClasses, setDetectedClasses] = useState([])
  const [imageUrlUploading, setImageUrlUploading] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

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
    setError('')
    setStep(2)

    // Upload image immediately so we get early detection results
    setImageUrlUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const uploadRes = await complaintService.uploadImage(fd, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        setUploadProgress(percent)
      })
      setFormData(prev => ({ ...prev, image_url: uploadRes.data.image_url }))
      if (uploadRes.data.detected_classes?.length > 0) {
        setDetectedClasses(uploadRes.data.detected_classes)
      }
    } catch {
      // Non-fatal: image will be re-uploaded at submit time if needed
    } finally {
      setImageUrlUploading(false)
      setUploadProgress(0)
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

  const handleGeoLocation = () => {
    if (!('geolocation' in navigator)) {
      setError(t('report_location_failed'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }))
        setToast({ message: t('report_location_detected'), type: 'success' })
      },
      () => {
        setError(t('report_location_failed'))
      }
    )
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

      let imageUrl = formData.image_url

      // Only upload if not already uploaded at step 1
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
        description: formData.description,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address,
        ward: formData.ward,
        landmark: formData.landmark,
      })

      setSuccess(true)
      
      if (response.data.flagged) {
        setToast({ message: t('report_under_review'), type: 'info' })
      } else {
        setToast({ message: t('report_submitted'), type: 'success' })
      }
      
      setTimeout(() => {
        navigate(`/track?id=${response.data.complaint_id}`)
      }, 1500)
    } catch (err) {
      const responseData = err.response?.data
      const validationMessage = responseData && typeof responseData === 'object'
        ? Object.entries(responseData).map(([field, messages]) => `${field}: ${[].concat(messages).join(', ')}`).join(' ')
        : ''
      const message = responseData?.detail || validationMessage || err.message || t('report_failed')
      setError(message)
      setToast({ message, type: 'error' })
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  // The suggested text is inserted into the description, so it is written in
  // the UI language; the sentiment analyser reads Urdu and English alike.
  const suggestion = detectedClasses.length > 0
    ? (formData.ward
        ? t('report_suggest_ward', { hazard: tv('hazard', detectedClasses[0]), ward: tv('ward', formData.ward) })
        : t('report_suggest_local', { hazard: tv('hazard', detectedClasses[0]) }))
    : ''

  const stepHeading = (Icon, key) => (
    <h2 className="mb-6 flex items-center gap-2.5 text-xl font-semibold">
      <Icon size={20} className="text-neutral-500" aria-hidden="true" />
      {t(key)}
    </h2>
  )

  const backButton = (to) => (
    <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => setStep(to)}>
      <ArrowLeft size={16} aria-hidden="true" className="rtl:-scale-x-100" /> {t('common_back')}
    </Button>
  )

  return (
    <>
      <Header />
      <PageTitle titleKey="title_report" />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        {error && <Alert message={error} type="error" className="mb-6" />}

        {/* Step indicator: four segments; done and current fill survey blue. */}
        <ol className="mb-8 grid grid-cols-4 gap-2">
          {STEPS.map(({ num, label }) => {
            const isCompleted = num < step || success
            const isActive = num === step && !success
            return (
              <li key={num} aria-current={isActive ? 'step' : undefined}>
                <div className={`h-1 ${isCompleted || isActive ? 'bg-primary-500' : 'bg-neutral-300'}`} aria-hidden="true" />
                <div className={`mt-2 flex items-center gap-1.5 text-[13px] ${isActive ? 'font-semibold text-neutral-900' : 'text-neutral-500'}`}>
                  {isCompleted ? (
                    <CheckCircle2 size={14} className="shrink-0 text-primary-500" aria-hidden="true" />
                  ) : (
                    <span className="tnum">{num}</span>
                  )}
                  <span className="truncate">{t(label)}</span>
                </div>
              </li>
            )
          })}
        </ol>

        <div className="border border-neutral-200 bg-white p-5 sm:p-7">
          {success ? (
            <div className="py-8 text-center" role="status">
              <CheckCircle2 size={36} className="mx-auto text-success" aria-hidden="true" />
              <h2 className="mt-4 text-2xl font-bold">{t('report_thanks')}</h2>
              <p className="mx-auto mt-2 max-w-sm text-neutral-600">{t('report_thanks_body')}</p>
            </div>
          ) : (
            <>
              {step === 1 && (
                <>
                  {stepHeading(Camera, 'report_upload_photo')}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={t('report_upload_aria')}
                    className={`cursor-pointer border-2 border-dashed p-10 text-center transition-colors ${
                      isDraggingOver ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 hover:border-neutral-500 hover:bg-neutral-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        fileInputRef.current?.click()
                      }
                    }}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true) }}
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={handleImageDrop}
                  >
                    {imagePreview ? (
                      <div>
                        <img src={imagePreview} alt={t('report_upload_photo')} className="mx-auto mb-4 max-h-64 max-w-xs border border-neutral-200" />
                        <p className="flex items-center justify-center gap-1.5 font-semibold text-success-700">
                          <CheckCircle2 size={16} aria-hidden="true" />
                          {t('common_photo_selected')}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <ImagePlus size={32} className="mx-auto mb-4 text-neutral-500" aria-hidden="true" />
                        <p className="font-semibold text-neutral-800">
                          <span className="sm:hidden">{t('report_take_photo')}</span>
                          <span className="hidden sm:inline">{t('report_click_upload')}</span>
                        </p>
                        <p className="mt-1 text-sm text-neutral-500">{t('report_file_hint')}</p>
                      </div>
                    )}
                  </div>
                  {imageUrlUploading && uploadProgress > 0 && (
                    <div className="mt-4">
                      <div className="h-1 bg-neutral-200">
                        <div className="h-full bg-primary-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="mt-1.5 text-[13px] text-neutral-600 tnum">{t('report_uploading', { n: uploadProgress })}</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    id="hazard-photo"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </>
              )}

              {step === 2 && (
                <>
                  {stepHeading(MapPin, 'report_confirm_location')}
                  <div className="space-y-5">
                    <Button variant="secondary" className="w-full" onClick={handleGeoLocation}>
                      <Locate size={16} aria-hidden="true" />
                      {t('report_detect_location')}
                    </Button>

                    <FormField id="report-ward" labelKey="report_ward">
                      <select id="report-ward" name="ward" value={formData.ward} onChange={handleChange} className="field" required>
                        <option value="">{t('report_choose_ward')}</option>
                        {WARDS.map(w => <option key={w} value={w}>{tv('ward', w)}</option>)}
                      </select>
                    </FormField>
                    <FormField id="report-address" labelKey="report_address">
                      <input id="report-address" type="text" name="address" value={formData.address} onChange={handleChange} placeholder={t('report_street_address')} className="field" />
                    </FormField>

                    <div className="flex gap-3 border-t border-neutral-200 pt-5">
                      {backButton(1)}
                      <Button className="flex-1" onClick={() => setStep(3)}>
                        {t('common_next')} <ArrowRight size={16} aria-hidden="true" className="rtl:-scale-x-100" />
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  {stepHeading(FileText, 'report_describe')}

                  {detectedClasses.length > 0 && !formData.description && (
                    <div className="mb-5 flex flex-wrap items-center gap-3 border border-info-200 bg-info-50 px-4 py-3">
                      <Lightbulb size={16} className="shrink-0 text-info-700" aria-hidden="true" />
                      <p className="min-w-0 flex-1 text-sm text-neutral-800">
                        <strong className="text-info-700">{t('report_suggestion')}</strong>{' '}
                        {suggestion}
                      </p>
                      <Button size="sm" variant="secondary" onClick={() => setFormData(prev => ({ ...prev, description: suggestion }))}>
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
                    className="field resize-y"
                    rows="5"
                    required
                  />
                  <div className="mt-5 flex gap-3 border-t border-neutral-200 pt-5">
                    {backButton(2)}
                    <Button className="flex-1" onClick={() => setStep(4)}>
                      {t('report_step_review')} <ArrowRight size={16} aria-hidden="true" className="rtl:-scale-x-100" />
                    </Button>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  {stepHeading(CheckCircle2, 'report_review_submit')}

                  <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
                    {imagePreview && (
                      <img src={imagePreview} alt={t('report_step_review')} className="max-h-40 w-full border border-neutral-200 object-cover" />
                    )}
                    <dl className="divide-y divide-neutral-200 border-y border-neutral-200 text-sm">
                      <div className="py-2.5">
                        <dt className="label">{t('track_description')}</dt>
                        <dd className="mt-1 text-[15px] text-neutral-900">{formData.description}</dd>
                      </div>
                      {formData.ward && (
                        <div className="flex justify-between gap-4 py-2.5">
                          <dt className="text-neutral-500">{t('report_ward')}</dt>
                          <dd className="font-medium">{tv('ward', formData.ward)}</dd>
                        </div>
                      )}
                      {formData.address && (
                        <div className="flex justify-between gap-4 py-2.5">
                          <dt className="text-neutral-500">{t('report_address')}</dt>
                          <dd className="font-medium">{formData.address}</dd>
                        </div>
                      )}
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-neutral-500">{t('report_coords')}</dt>
                        <dd className="font-medium tnum" dir="ltr">{formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</dd>
                      </div>
                    </dl>
                  </div>

                  {uploadProgress > 0 && (
                    <div className="mt-5">
                      <div className="h-1 bg-neutral-200">
                        <div className="h-full bg-primary-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="mt-1.5 text-[13px] text-neutral-600 tnum">{t('report_uploading_image', { n: uploadProgress })}</p>
                    </div>
                  )}
                  <div className="mt-6 flex gap-3 border-t border-neutral-200 pt-5">
                    {backButton(3)}
                    <Button className="flex-1" loading={loading} onClick={handleSubmit}>
                      {!loading && <Send size={16} aria-hidden="true" className="rtl:-scale-x-100" />} {t('report_submit')}
                    </Button>
                  </div>
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
