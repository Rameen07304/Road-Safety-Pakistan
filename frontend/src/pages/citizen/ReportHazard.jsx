import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, complaintService } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Alert, Card } from '../../components/UI'
import Toast from '../../components/Toast'
import {
  Camera, MapPin, FileText, CheckCircle2, ArrowLeft, ArrowRight,
  Lightbulb, Locate, Send, ImagePlus,
} from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const WARDS = [
  'Lahore Cant', 'Data Ganj Baksh', 'Allama Iqbal', 'Azad Pul', 'Mall',
  'Johar Town', 'Shadbagh', 'Ravi', 'Thokar Niaz Baig', 'Wagha', 'Gulshan Ravi'
]

const STEPS = [
  { num: 1, label: 'Photo',    icon: Camera },
  { num: 2, label: 'Location', icon: MapPin },
  { num: 3, label: 'Details',  icon: FileText },
  { num: 4, label: 'Review',   icon: CheckCircle2 },
]

export default function ReportHazard() {
  useDocumentTitle('Report a Hazard')
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
      setError('Please select a valid image file')
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleGeoLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }))
          setToast({ message: 'Location detected successfully!', type: 'success' })
        },
        () => {
          setError('Could not detect your location. Please enter it manually.')
        }
      )
    }
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      if (!selectedFile && !formData.image_url) {
        throw new Error('Please select a photo before submitting.')
      }
      if (!formData.description.trim()) {
        throw new Error('Please describe the hazard before submitting.')
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
        setToast({ message: 'Your complaint is under review by our team.', type: 'info' })
      } else {
        setToast({ message: 'Complaint submitted successfully!', type: 'success' })
      }
      
      setTimeout(() => {
        navigate(`/track?id=${response.data.complaint_id}`)
      }, 1500)
    } catch (err) {
      const responseData = err.response?.data
      const validationMessage = responseData && typeof responseData === 'object'
        ? Object.entries(responseData).map(([field, messages]) => `${field}: ${[].concat(messages).join(', ')}`).join(' ')
        : ''
      const message = responseData?.detail || validationMessage || err.message || 'Failed to submit complaint. Try again.'
      setError(message)
      setToast({ message, type: 'error' })
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        {error && <Alert message={error} type="error" className="mb-6" />}

        {/* ── Step Wizard ── */}
        <div className="mb-10">
          <div className="flex items-start justify-between relative">
            {/* Connecting line behind the circles */}
            <div className="absolute top-5 left-[12%] right-[12%] h-0.5 bg-neutral-100 rounded-full" />
            <div
              className="absolute top-5 left-[12%] h-0.5 bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 76}%` }}
            />

            {STEPS.map(({ num, label, icon: Icon }) => {
              const isCompleted = num < step
              const isActive    = num === step

              return (
                <div key={num} className="flex flex-col items-center relative z-10" style={{ width: '25%' }}>
                  {/* Circle */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isCompleted
                      ? 'bg-primary-500 text-white'
                      : isActive
                        ? 'bg-primary-500 text-white shadow-base'
                        : 'bg-neutral-100 text-neutral-400'
                  }`}>
                    {isCompleted
                      ? <CheckCircle2 size={18} />
                      : <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                    }
                  </div>
                  {/* Label */}
                  <span className={`text-xs mt-2 font-medium ${
                    isActive ? 'text-primary-600' : isCompleted ? 'text-primary-500' : 'text-neutral-400'
                  }`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Success State ── */}
        {success ? (
          <Card variant="elevated" className="text-center py-14">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={36} className="text-success" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-2">Thank You!</h2>
            <p className="text-neutral-500 max-w-sm mx-auto">
              Your complaint has been submitted successfully. You'll be redirected to track your complaint.
            </p>
          </Card>
        ) : (
          <>
            {/* ── Step 1: Upload Photo ── */}
            {step === 1 && (
              <Card>
                <h2 className="text-xl font-heading font-bold text-neutral-900 mb-6 flex items-center gap-2.5">
                  <Camera size={20} className="text-primary-500" />
                  Upload Photo
                </h2>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload a photo of the hazard. JPG or PNG, up to 10 megabytes."
                  className={`rounded-xl border-2 border-dashed p-10 text-center transition cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    isDraggingOver
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30'
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
                      <img src={imagePreview} alt="Preview" className="max-w-xs max-h-64 mx-auto rounded-lg mb-4 shadow-subtle" />
                      <p className="text-primary-600 font-semibold flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={16} />
                        Photo selected
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-16 h-16 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-100 transition">
                        <ImagePlus size={28} className="text-neutral-400 group-hover:text-primary-500 transition" />
                      </div>
                      <p className="text-neutral-600 font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-neutral-400 text-sm">JPG, PNG up to 10 MB</p>
                    </div>
                  )}
                </div>
                {imageUrlUploading && uploadProgress > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">Uploading: {uploadProgress}%</p>
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
              </Card>
            )}

            {/* ── Step 2: Confirm Location ── */}
            {step === 2 && (
              <Card>
                <h2 className="text-xl font-heading font-bold text-neutral-900 mb-6 flex items-center gap-2.5">
                  <MapPin size={20} className="text-primary-500" />
                  Confirm Location
                </h2>
                <div className="space-y-4">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleGeoLocation}
                  >
                    <Locate size={16} />
                    Detect My Current Location
                  </Button>

                  <select name="ward" value={formData.ward} onChange={handleChange} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition" required>
                    <option value="">Choose a ward...</option>
                    {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Street Address" className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition" />

                  <div className="flex gap-4 pt-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                      <ArrowLeft size={16} /> Back
                    </Button>
                    <Button className="flex-1" onClick={() => setStep(3)}>
                      Next <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* ── Step 3: Describe the Hazard ── */}
            {step === 3 && (
              <Card>
                <h2 className="text-xl font-heading font-bold text-neutral-900 mb-6 flex items-center gap-2.5">
                  <FileText size={20} className="text-primary-500" />
                  Describe the Hazard
                </h2>

                {/* Smart description suggestion */}
                {detectedClasses.length > 0 && !formData.description && (
                  <div className="mb-5 flex items-center gap-3 rounded-lg border border-info/20 bg-info-light px-4 py-3">
                    <div className="w-8 h-8 bg-info/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lightbulb size={16} className="text-info" />
                    </div>
                    <p className="flex-1 text-sm text-neutral-700">
                      <strong className="text-info">Suggestion:</strong>{' '}
                      {detectedClasses[0].replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())} reported in {formData.ward || 'your'} area
                    </p>
                    <button
                      type="button"
                      className="rounded-full bg-info px-3 py-1.5 text-xs font-bold text-white hover:bg-info/90 transition flex-shrink-0"
                      onClick={() => {
                        const hazard = detectedClasses[0].replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
                        setFormData(prev => ({
                          ...prev,
                          description: `${hazard} reported in ${formData.ward || 'local'} area`
                        }))
                      }}
                    >
                      Use this
                    </button>
                  </div>
                )}

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the hazard..."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg resize-none mb-4 focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition"
                  rows="5"
                  required
                />
                <div className="flex gap-4 pt-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setStep(2)}>
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button className="flex-1" onClick={() => setStep(4)}>
                    Review <ArrowRight size={16} />
                  </Button>
                </div>
              </Card>
            )}

            {/* ── Step 4: Review & Submit ── */}
            {step === 4 && (
              <Card>
                <h2 className="text-xl font-heading font-bold text-neutral-900 mb-6 flex items-center gap-2.5">
                  <CheckCircle2 size={20} className="text-primary-500" />
                  Review &amp; Submit
                </h2>

                {imagePreview && (
                  <img src={imagePreview} alt="Review" className="max-w-xs max-h-48 rounded-lg mb-4 shadow-subtle" />
                )}

                <div className="bg-neutral-50 rounded-lg p-4 mb-4 space-y-2">
                  <p className="text-neutral-800">{formData.description}</p>
                  {formData.ward && (
                    <p className="text-sm text-neutral-500">
                      <span className="font-medium">Ward:</span> {formData.ward}
                    </p>
                  )}
                  {formData.address && (
                    <p className="text-sm text-neutral-500">
                      <span className="font-medium">Address:</span> {formData.address}
                    </p>
                  )}
                  <p className="text-sm text-neutral-500">
                    <span className="font-medium">Coords:</span> {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </p>
                </div>

                {uploadProgress > 0 && (
                  <div className="mb-4">
                    <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-primary-500 h-2.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">Uploading image: {uploadProgress}%</p>
                  </div>
                )}
                <div className="flex gap-4 pt-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setStep(3)}>
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button className="flex-1" loading={loading} onClick={handleSubmit}>
                    <Send size={16} /> Submit
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  )
}
