import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { complaintService } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Badge, Button, Alert, PageTitle } from '../../components/UI'
import Toast from '../../components/Toast'
import { Loader2, ArrowLeft, CheckCircle2, X, AlertTriangle, Eye, Trash2 } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { useLanguage } from '../../context/LanguageContext'

/* eslint-disable react-hooks/set-state-in-effect */

export default function FlaggedQueue() {
  useDocumentTitle('title_flagged')
  const { t, tv, locale } = useLanguage()
  const [flagged, setFlagged] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  // Reject asks again on the page itself: window.confirm() is suppressed by
  // embedded and in-app browsers, which made Reject silently do nothing.
  const [confirmingReject, setConfirmingReject] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const navigate = useNavigate()

  const fetchFlagged = async () => {
    try {
      const response = await complaintService.flaggedList()
      const data = response.data.results || response.data || []
      setFlagged(data)
    } catch {
      setError('fq_load_failed')
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
      setToast({ message: t('fq_approved', { id: complaintId }), type: 'success' })
    } catch {
      setToast({ message: t('fq_approve_failed'), type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (complaintId) => {
    setConfirmingReject(null)
    setActionLoading(complaintId)
    try {
      await complaintService.rejectComplaint(complaintId)
      setFlagged(prev => prev.filter(c => c.complaint_id !== complaintId))
      setToast({ message: t('fq_rejected', { id: complaintId }), type: 'success' })
    } catch {
      setToast({ message: t('fq_reject_failed'), type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  // Permanent: removes the complaint and its photos (see AdminComplaintDeleteView).
  const handleDelete = async (complaintId) => {
    setDeletingId(complaintId)
    try {
      await complaintService.deleteComplaint(complaintId)
      setFlagged((prev) => prev.filter((c) => c.complaint_id !== complaintId))
      setToast({ message: t('admin_deleted', { id: complaintId }), type: 'success' })
    } catch {
      setToast({ message: t('cd_action_failed'), type: 'error' })
    } finally {
      setDeletingId(null)
      setConfirmingDelete(null)
    }
  }

  return (
    <>
      <Header />
      <PageTitle
        titleKey="fq_title"
        subtitle={t('fq_subtitle')}
        actions={
          <Link to="/admin/dashboard" className="inline-flex h-10 items-center gap-2 rounded-sm border border-white/40 px-4 text-sm font-semibold text-white hover:bg-white/10">
            <ArrowLeft size={15} aria-hidden="true" className="rtl:-scale-x-100" /> {t('common_back_to_dashboard')}
          </Link>
        }
      />

      <main className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        {error && <Alert message={t(error)} type="error" className="mb-6" />}

        {loading ? (
          <div className="flex h-60 items-center justify-center" role="status">
            <Loader2 size={28} className="animate-spin text-neutral-500" aria-hidden="true" />
          </div>
        ) : flagged.length === 0 ? (
          <div className="flex items-start gap-3 border border-neutral-200 bg-white px-5 py-6">
            <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold">{t('fq_all_clear')}</h2>
              <p className="mt-1 text-neutral-600">{t('fq_none')}</p>
            </div>
          </div>
        ) : (
          <ul className="border border-neutral-200 bg-white">
            {flagged.map(c => (
              <li key={c.complaint_id} className="flex flex-col gap-4 border-t border-neutral-200 p-4 first:border-t-0 sm:flex-row sm:items-start sm:p-5">
                {c.image_url && (
                  <a href={c.image_url} target="_blank" rel="noreferrer" className="shrink-0" title={t('admin_open_photo')}>
                    <img src={c.image_url} alt={c.complaint_id} className="h-32 w-full border border-neutral-200 object-cover sm:w-32" />
                  </a>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold tnum" dir="ltr">{c.complaint_id}</span>
                    <Badge variant="accent">{t('fq_flagged')}</Badge>
                    <Badge variant={c.urgency_level?.toLowerCase()}>{tv('urgency', c.urgency_level)}</Badge>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[15px] text-neutral-800">
                    {c.description || t('fq_no_summary')}
                  </p>
                  {c.flag_reason && (
                    <p className="mt-2 flex items-start gap-2 text-sm text-accent-dark">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <span><strong>{t('fq_reason')}</strong> {c.flag_reason}</span>
                    </p>
                  )}
                  <p className="mt-2 text-[13px] text-neutral-500">
                    {t('track_ward_label')}: {tv('ward', c.ward) || t('common_na')} · {t('fq_submitted')}: <span className="tnum">{new Date(c.submitted_at).toLocaleString(locale)}</span>
                  </p>
                </div>

                {confirmingDelete === c.complaint_id ? (
                  <div className="flex shrink-0 flex-col gap-2 sm:w-40">
                    <p className="text-sm font-semibold text-danger-700">{t('cd_delete_confirm', { id: c.complaint_id })}</p>
                    <Button variant="danger" loading={deletingId === c.complaint_id} onClick={() => handleDelete(c.complaint_id)}>
                      {deletingId !== c.complaint_id && <Trash2 size={16} aria-hidden="true" />} {t('cd_delete_yes')}
                    </Button>
                    <Button variant="secondary" onClick={() => setConfirmingDelete(null)}>{t('common_cancel')}</Button>
                  </div>
                ) : confirmingReject === c.complaint_id ? (
                  <div className="flex shrink-0 flex-col gap-2 sm:w-40" role="group" aria-label={t('fq_reject_confirm', { id: c.complaint_id })}>
                    <p className="text-sm font-semibold text-danger-700">{t('fq_reject_confirm', { id: c.complaint_id })}</p>
                    <Button variant="danger" onClick={() => handleReject(c.complaint_id)}>
                      <X size={16} aria-hidden="true" /> {t('fq_reject_yes')}
                    </Button>
                    <Button variant="secondary" onClick={() => setConfirmingReject(null)}>{t('common_cancel')}</Button>
                  </div>
                ) : (
                  <div className="flex shrink-0 gap-2 sm:w-32 sm:flex-col">
                    <Button onClick={() => handleApprove(c.complaint_id)} loading={actionLoading === c.complaint_id} className="flex-1 sm:flex-none">
                      {actionLoading !== c.complaint_id && <CheckCircle2 size={16} aria-hidden="true" />} {t('fq_approve')}
                    </Button>
                    <Button variant="danger" onClick={() => setConfirmingReject(c.complaint_id)} disabled={actionLoading === c.complaint_id} className="flex-1 sm:flex-none">
                      <X size={16} aria-hidden="true" /> {t('fq_reject')}
                    </Button>
                    <Button variant="secondary" onClick={() => navigate(`/admin/complaint/${c.complaint_id}`)} className="flex-1 sm:flex-none">
                      <Eye size={16} aria-hidden="true" /> {t('common_view')}
                    </Button>
                    <Button variant="secondary" className="flex-1 !text-danger-700 sm:flex-none" onClick={() => { setConfirmingReject(null); setConfirmingDelete(c.complaint_id) }}>
                      <Trash2 size={16} aria-hidden="true" /> {t('admin_delete')}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  )
}
