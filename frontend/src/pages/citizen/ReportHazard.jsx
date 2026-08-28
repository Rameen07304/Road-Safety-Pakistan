import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, complaintService } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Alert, Card } from '../../components/UI'
import Toast from '../../components/Toast'

/* eslint-disable no-unused-vars */

const WARDS = [
  'Lahore Cant', 'Data Ganj Baksh', 'Allama Iqbal', 'Azad Pul', 'Mall',
  'Johar Town', 'Shadbagh', 'Ravi', 'Thokar Niaz Baig', 'Wagha', 'Gulshan Ravi'
]

const HAZARD_TYPES = [
  { id: 'pothole', label: 'Pothole', icon: '🕳️' },
  { id: 'open_manhole', label: 'Open Manhole', icon: '🔓' },
  { id: 'broken_manhole', label: 'Broken Manhole', icon: '⚠️' },
  { id: 'speed_bump', label: 'Damaged Speed Bump', icon: '🏁' },
  { id: 'garbage', label: 'Garbage', icon: '🗑️' },
]

export default function ReportHazard() {
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
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
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

      if (selectedFile) {
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
      setToast({ message: 'Complaint submitted successfully!', type: 'success' })
      
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        {error && <Alert message={error} type="error" className="mb-6" />}

        <div className="mb-12">
          <div className="flex justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 ${
                  s <= step ? 'bg-green-600' : 'bg-gray-300'
                }`}>
                  {s}
                </div>
                <span className="text-sm text-gray-600">
                  {s === 1 ? 'Photo' : s === 2 ? 'Location' : s === 3 ? 'Details' : 'Review'}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 h-1 rounded-full">
            <div className="bg-green-600 h-1 rounded-full transition-all" style={{ width: `${(step - 1) * 33.33}%` }}></div>
          </div>
        </div>

        {success ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              Your complaint has been submitted successfully. You'll be redirected to track your complaint.
            </p>
          </Card>
        ) : (
          <>
            {step === 1 && (
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 1: Upload Photo</h2>
                <div className="border-2 border-dashed border-green-300 rounded-lg p-12 text-center hover:border-green-600 transition cursor-pointer"
                     onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? (
                    <div>
                      <img src={imagePreview} alt="Preview" className="max-w-xs max-h-64 mx-auto rounded-lg mb-4" />
                      <p className="text-green-600 font-semibold">Photo selected!</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-5xl mb-4">📸</div>
                      <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </Card>
            )}

            {step === 2 && (
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 2: Confirm Location</h2>
                <div className="space-y-4">
                  <Button variant="secondary" className="w-full" onClick={handleGeoLocation}>
                    📍 Detect My Current Location
                  </Button>
                  <select name="ward" value={formData.ward} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                    <option value="">Choose a ward...</option>
                    {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Street Address" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  <div className="flex gap-4">
                    <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>← Back</Button>
                    <Button className="flex-1" onClick={() => setStep(3)}>Next →</Button>
                  </div>
                </div>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 3: Describe the Hazard</h2>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the hazard..." className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none mb-4" rows="5" required></textarea>
                <div className="flex gap-4">
                  <Button variant="secondary" className="flex-1" onClick={() => setStep(2)}>← Back</Button>
                  <Button className="flex-1" onClick={() => setStep(4)}>Review →</Button>
                </div>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 4: Review & Submit</h2>
                {imagePreview && <img src={imagePreview} alt="Review" className="max-w-xs max-h-48 rounded-lg mb-4" />}
                <p className="text-gray-900 mb-4">{formData.description}</p>
                {uploadProgress > 0 && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div className="bg-green-600 h-3" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Uploading image: {uploadProgress}%</p>
                  </div>
                )}
                <div className="flex gap-4">
                  <Button variant="secondary" className="flex-1" onClick={() => setStep(3)}>← Back</Button>
                  <Button className="flex-1" loading={loading} onClick={handleSubmit}>✓ Submit</Button>
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
