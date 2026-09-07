import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { complaintService } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Card, Badge, Button, Alert } from '../../components/UI'
import Toast from '../../components/Toast'
import { Loader2, ArrowLeft, CheckCircle2, X, AlertTriangle, Eye, Flag } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'

/* eslint-disable react-hooks/set-state-in-effect */

export default function FlaggedQueue() {
  useDocumentTitle('Flagged Reports')
  const [flagged, setFlagged] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const navigate = useNavigate()

  const fetchFlagged = async () => {
    try {
      const response = await complaintService.flaggedList()
      const data = response.data.results || response.data || []
      setFlagged(data)
    } catch {
      setError('Failed to load flagged complaints')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlagged()
  }, [])

  const handleApprove = async (complaintId) => {
    setActionLoading(complaintId)
    try {
      await complaintService.approveComplaint(complaintId)
      setFlagged(prev => prev.filter(c => c.complaint_id !== complaintId))
      setToast({ message: `Complaint ${complaintId} approved`, type: 'success' })
    } catch {
      setToast({ message: 'Failed to approve complaint', type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (complaintId) => {
    if (!window.confirm(`Reject and remove complaint ${complaintId}? This will mark it as rejected.`)) {
      return
    }
    setActionLoading(complaintId)
    try {
      await complaintService.rejectComplaint(complaintId)
      setFlagged(prev => prev.filter(c => c.complaint_id !== complaintId))
      setToast({ message: `Complaint ${complaintId} rejected`, type: 'success' })
    } catch {
      setToast({ message: 'Failed to reject complaint', type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-neutral-900 flex items-center gap-2.5">
              <Flag size={26} className="text-accent-dark" />
              Flagged Review Queue
            </h1>
            <p className="text-neutral-500 mt-1">
              Complaints auto-flagged by spam detection. Approve to make visible, or reject to remove.
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Button>
        </div>

        {error && <Alert message={error} type="error" className="mb-6" />}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 size={36} className="text-primary-500 animate-spin" />
          </div>
        ) : flagged.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-success" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-2">All Clear</h2>
            <p className="text-neutral-500">No flagged complaints awaiting review.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {flagged.map(c => (
              <Card key={c.complaint_id} className="border-l-4 border-l-accent">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Thumbnail */}
                  {c.image_url && (
                    <img
                      src={c.image_url}
                      alt="Complaint"
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0 shadow-subtle"
                    />
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-heading font-bold text-neutral-900">{c.complaint_id}</span>
                      <Badge variant="warning">Flagged</Badge>
                      <Badge variant={c.urgency_level?.toLowerCase()}>
                        {c.urgency_level}
                      </Badge>
                    </div>

                    <p className="text-sm text-neutral-600 mb-2 truncate" title={c.summary}>
                      {c.summary || 'No summary'}
                    </p>

                    {c.flag_reason && (
                      <div className="flex items-center gap-2 rounded-lg bg-accent-light border border-accent/20 px-3 py-2 text-sm text-neutral-700 mb-2">
                        <AlertTriangle size={14} className="text-accent-dark flex-shrink-0" />
                        <span><strong>Flag reason:</strong> {c.flag_reason}</span>
                      </div>
                    )}

                    <div className="text-xs text-neutral-400">
                      Ward: {c.ward || 'N/A'} &middot; Submitted: {new Date(c.submitted_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(c.complaint_id)}
                      loading={actionLoading === c.complaint_id}
                      className="flex-1 sm:flex-none"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(c.complaint_id)}
                      loading={actionLoading === c.complaint_id}
                      className="flex-1 sm:flex-none"
                    >
                      <X size={14} /> Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/admin/complaint/${c.complaint_id}`)}
                      className="flex-1 sm:flex-none"
                    >
                      <Eye size={14} /> View
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
