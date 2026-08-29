import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, complaintService } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Card, Badge, Button, Alert } from '../../components/UI'
import Toast from '../../components/Toast'

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

export default function ComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [resolvedFile, setResolvedFile] = useState(null)
  const [resolvedPreview, setResolvedPreview] = useState('')
  const [uploadingResolved, setUploadingResolved] = useState(false)
  const [resolvedUploadError, setResolvedUploadError] = useState('')
  const resolvedFileInputRef = useRef(null)

  const fetchComplaint = async () => {
    try {
      const response = await api.get(`/api/complaints/${id}/`)
      setComplaint(response.data)
      setStatus(response.data.status)
      setNotes(response.data.admin_notes || '')
    } catch {
      setError('Failed to load complaint details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaint()
  }, [id])

  const handleResolvedFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setResolvedUploadError('')

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setResolvedUploadError('Please select a JPG, PNG, or WEBP image.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setResolvedUploadError('File too large. Max size is 10MB.')
      return
    }

    setResolvedFile(file)
    const reader = new FileReader()
    reader.onload = (event) => setResolvedPreview(event.target.result)
    reader.readAsDataURL(file)
  }

  const handleUpdate = async () => {
    setUpdating(true)
    setResolvedUploadError('')
    try {
      let resolvedImageUrl = complaint.resolved_image_url

      if (status === 'resolved' && resolvedFile) {
        setUploadingResolved(true)
        const fd = new FormData()
        fd.append('image', resolvedFile)
        try {
          const uploadRes = await complaintService.uploadImage(fd)
          resolvedImageUrl = uploadRes.data.image_url
        } catch (uploadErr) {
          const message = uploadErr.response?.data?.detail || 'Failed to upload the after photo. Status was not changed.'
          setResolvedUploadError(message)
          setToast({ message, type: 'error' })
          setUpdating(false)
          setUploadingResolved(false)
          return
        } finally {
          setUploadingResolved(false)
        }
      }

      const payload = { status, admin_notes: notes }
      if (status === 'resolved' && resolvedImageUrl) {
        payload.resolved_image_url = resolvedImageUrl
      }

      const response = await api.patch(`/api/admin/complaints/${id}/status/`, payload)
      setComplaint(response.data)
      setResolvedFile(null)
      setResolvedPreview('')
      setToast({ message: 'Complaint updated successfully!', type: 'success' })
    } catch {
      setError('Failed to update complaint')
      setToast({ message: 'Failed to update complaint', type: 'error' })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
        <Footer />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Alert message={error} type="error" />
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-900">{complaint.complaint_id}</h1>
          <Button variant="secondary" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Photo */}
            {(complaint.image_url || complaint.annotated_image_url || complaint.annotated_image_base64) && (
              <Card>
                <h3 className="font-bold text-gray-900 mb-4">Image Comparison</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {complaint.image_url && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Original photo</p>
                      <img src={complaint.image_url} alt="Original complaint" className="w-full max-h-96 object-contain rounded-lg" />
                    </div>
                  )}
                  {(complaint.annotated_image_url || complaint.annotated_image_base64) && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">AI annotated photo</p>
                      <img
                        src={complaint.annotated_image_url || `data:image/jpeg;base64,${complaint.annotated_image_base64}`}
                        alt="AI detection annotations"
                        className="w-full max-h-96 object-contain rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Hazard Details */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Hazard Analysis</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Detected Classes</p>
                  <p className="text-gray-900 font-semibold">{complaint.detected_classes?.join(', ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Confidence Scores</p>
                  <p className="text-gray-900 font-semibold">
                    {Object.entries(complaint.confidence_scores || {}).map(([k, v]) => `${k}: ${(Number(v) * 100).toFixed(1)}%`).join(', ') || 'N/A'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Description & Sentiment</h3>
              <p className="text-gray-700 mb-4">{complaint.description}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Sentiment Analysis</p>
                  <Badge variant="default">{complaint.sentiment}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Keywords Found</p>
                  <div className="flex flex-wrap gap-2">
                    {complaint.sentiment_keywords?.map(kw => (
                      <Badge key={kw} variant="default" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Location */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Location Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Address</p>
                  <p className="text-gray-900">{complaint.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ward</p>
                  <p className="text-gray-900">{complaint.ward}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Coordinates</p>
                  <p className="text-gray-900">{Number(complaint.latitude).toFixed(4)}, {Number(complaint.longitude).toFixed(4)}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Urgency */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Urgency Score</h3>
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">{complaint.urgency_score}</div>
                <Badge variant={complaint.urgency_level?.toLowerCase()} className="w-full text-center justify-center">
                  {complaint.urgency_level}
                </Badge>
              </div>
            </Card>

            {/* Status Update */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Update Status</h3>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              >
                <option value="submitted">Submitted</option>
                <option value="verified">Verified</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>

              {status === 'resolved' && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    Upload an "after" photo showing the resolved hazard
                  </p>
                  {complaint.resolved_image_url && !resolvedPreview && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-600 mb-1">Current after photo:</p>
                      <img src={complaint.resolved_image_url} alt="Current resolved" className="h-24 rounded-lg object-cover" />
                    </div>
                  )}
                  {resolvedPreview ? (
                    <div className="mb-2">
                      <img src={resolvedPreview} alt="After preview" className="h-24 rounded-lg object-cover" />
                      <p className="mt-1 text-xs text-green-700 font-semibold">✓ Photo selected</p>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer rounded-lg border-2 border-dashed border-green-300 p-4 text-center text-sm text-gray-600 hover:border-green-500"
                      onClick={() => resolvedFileInputRef.current?.click()}
                    >
                      📷 Click to select after photo
                    </div>
                  )}
                  <input
                    ref={resolvedFileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleResolvedFileChange}
                    className="hidden"
                  />
                  {resolvedUploadError && (
                    <p className="mt-2 text-xs text-red-600">{resolvedUploadError}</p>
                  )}
                  {uploadingResolved && (
                    <p className="mt-2 text-xs text-gray-600">Uploading after photo...</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">Optional, but recommended when marking a complaint resolved.</p>
                </div>
              )}

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Admin notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none mb-4"
                rows="4"
              ></textarea>

              <Button className="w-full" loading={updating} onClick={handleUpdate}>
                {uploadingResolved ? 'Uploading Photo...' : 'Save Changes'}
              </Button>
            </Card>

            {/* Metadata */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Metadata</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Reported:</strong> {new Date(complaint.submitted_at).toLocaleDateString()}</p>
                <p><strong>Reporter:</strong> {complaint.citizen_name || 'Citizen'}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
