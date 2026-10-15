import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, analyticsService, complaintService } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Toast from '../../components/Toast'
import { Button, Alert, PageTitle, StatStrip, UrgencyMark } from '../../components/UI'
import { statusClasses } from '../../utils/urgencyHelpers'
import { Loader2, FileDown, Building2, Eye, X, CheckCircle2, Wrench, RotateCcw, ImageOff, Trash2 } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { useLanguage } from '../../context/LanguageContext'

// Tabs are stages of work; the list is fetched per tab from the server, so
// it is never limited to the first page of every complaint.
const TABS = [
  { id: 'waiting', status: 'submitted,verified', label: 'dash_pending' },
  { id: 'in_progress', status: 'in_progress', label: 'dash_in_progress' },
  { id: 'resolved', status: 'resolved', label: 'dash_resolved' },
  { id: 'rejected', status: 'rejected', label: 'dash_rejected' },
  { id: 'all', status: '', label: 'common_all' },
]

// The next sensible moves from each stage, as one-tap buttons.
const ACTIONS = {
  submitted: ['verified', 'in_progress', 'rejected'],
  verified: ['in_progress', 'rejected'],
  in_progress: ['resolved'],
  resolved: ['in_progress'],
  rejected: ['verified'],
}
const ACTION_LOOK = {
  verified: { key: 'admin_act_check', icon: CheckCircle2, variant: 'secondary' },
  in_progress: { key: 'admin_act_start', icon: Wrench, variant: 'primary' },
  resolved: { key: 'admin_act_fixed', icon: CheckCircle2, variant: 'primary' },
  rejected: { key: 'fq_reject', icon: X, variant: 'danger' },
}

export default function Dashboard() {
  useDocumentTitle('title_admin_dashboard')
  const { t, tv } = useLanguage()
  const [tab, setTab] = useState('waiting')
  const [complaints, setComplaints] = useState([])
  const [nextPage, setNextPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [stats, setStats] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirmingReject, setConfirmingReject] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [toast, setToast] = useState(null)
  const [reportStartDate, setReportStartDate] = useState('')
  const [reportEndDate, setReportEndDate] = useState('')
  const [exportingReport, setExportingReport] = useState(false)
  const [exportError, setExportError] = useState('')
  const navigate = useNavigate()

  const fetchStats = useCallback(() => {
    api.get('/api/admin/complaints/stats/').then((res) => setStats(res.data)).catch(() => {})
  }, [])

  const fetchPage = useCallback(async (tabId, url) => {
    const status = TABS.find((x) => x.id === tabId).status
    // DRF's "next" is absolute and names the API host; keep only the path so
    // it goes through the same origin (the Vercel /api proxy in production).
    const res = url
      ? await api.get(new URL(url).pathname + new URL(url).search)
      : await api.get('/api/complaints/', { params: { ordering: '-urgency_score', ...(status && { status }) } })
    return res.data
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchPage(tab)
      .then((data) => {
        if (cancelled) return
        setComplaints(data.results || [])
        setNextPage(data.next)
      })
      .catch(() => { if (!cancelled) setComplaints([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tab, fetchPage])

  useEffect(() => { fetchStats() }, [fetchStats])

  const selectTab = (id) => {
    if (id === tab) return
    setLoading(true)
    setConfirmingReject(null)
    setTab(id)
  }

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const data = await fetchPage(tab, nextPage)
      setComplaints((prev) => [...prev, ...(data.results || [])])
      setNextPage(data.next)
    } finally {
      setLoadingMore(false)
    }
  }

  const changeStatus = async (complaint, status) => {
    setConfirmingReject(null)
    setBusyId(complaint.complaint_id)
    try {
      await complaintService.updateStatus(complaint.complaint_id, { status })
      const stillHere = tab === 'all' || TABS.find((x) => x.id === tab).status.split(',').includes(status)
      setComplaints((prev) => stillHere
        ? prev.map((c) => (c.complaint_id === complaint.complaint_id ? { ...c, status } : c))
        : prev.filter((c) => c.complaint_id !== complaint.complaint_id))
      setToast({ message: t('admin_status_changed', { id: complaint.complaint_id, status: tv('status', status) }), type: 'success' })
      fetchStats()
    } catch {
      setToast({ message: t('admin_status_failed'), type: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  // Permanent: removes the complaint and its photos (see AdminComplaintDeleteView).
  const handleDelete = async (complaintId) => {
    setDeletingId(complaintId)
    try {
      await complaintService.deleteComplaint(complaintId)
      setComplaints((prev) => prev.filter((c) => c.complaint_id !== complaintId))
      setToast({ message: t('admin_deleted', { id: complaintId }), type: 'success' })
      fetchStats()
    } catch {
      setToast({ message: t('cd_action_failed'), type: 'error' })
    } finally {
      setDeletingId(null)
      setConfirmingDelete(null)
    }
  }

  const handleExportReport = async () => {
    setExportError('')
    setExportingReport(true)
    try {
      const params = {}
      if (reportStartDate) params.start_date = reportStartDate
      if (reportEndDate) params.end_date = reportEndDate

      const response = await analyticsService.exportPdfReport(params)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'road_safety_report.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export PDF report:', err)
      setExportError('admin_export_failed')
    } finally {
      setExportingReport(false)
    }
  }

  const count = (key) => (stats ? stats[key] : '…')

  return (
    <>
      <Header />
      <PageTitle titleKey="admin_title" subtitle={t('admin_subtitle')} />

      <main className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        <StatStrip
          className="mb-8"
          items={[
            { label: t('admin_total'), value: count('total') },
            { label: t('dash_pending'), value: count('pending'), onClick: () => selectTab('waiting') },
            { label: t('dash_in_progress'), value: count('in_progress'), onClick: () => selectTab('in_progress') },
            { label: t('dash_resolved'), value: count('resolved'), onClick: () => selectTab('resolved') },
            { label: t('dash_rejected'), value: count('rejected'), onClick: () => selectTab('rejected') },
            {
              label: t('admin_flagged_review'),
              value: count('flagged'),
              tone: 'text-accent-dark',
              onClick: () => navigate('/admin/flagged'),
              ariaLabel: t('admin_flagged_aria', { n: count('flagged') }),
            },
          ]}
        />

        {/* Toolbar: the stage tabs on one side, the occasional PDF export on the other. */}
        <div className="flex flex-col gap-4 border-b border-neutral-300 lg:flex-row lg:items-end lg:justify-between">
          <div className="-mb-px flex overflow-x-auto" role="tablist">
            {TABS.map((x) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={tab === x.id}
                onClick={() => selectTab(x.id)}
                className={`h-11 shrink-0 border-b-2 px-4 text-[15px] font-semibold transition-colors ${
                  tab === x.id ? 'border-primary-500 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {t(x.label)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-2 pb-3">
            <div>
              <label htmlFor="report-start-date" className="label mb-1 block">{t('admin_start_date')}</label>
              <input id="report-start-date" type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="field h-9 !min-h-9 w-auto text-sm" />
            </div>
            <div>
              <label htmlFor="report-end-date" className="label mb-1 block">{t('admin_end_date')}</label>
              <input id="report-end-date" type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="field h-9 !min-h-9 w-auto text-sm" />
            </div>
            <Button variant="secondary" size="sm" className="!h-9" loading={exportingReport} onClick={handleExportReport}>
              {!exportingReport && <FileDown size={15} aria-hidden="true" />}
              {exportingReport ? t('admin_generating') : t('admin_export')}
            </Button>
          </div>
        </div>
        {exportError && <Alert message={t(exportError)} type="error" className="mt-4" />}

        {loading ? (
          <div className="flex h-60 items-center justify-center" role="status">
            <Loader2 size={28} className="animate-spin text-neutral-500" aria-hidden="true" />
          </div>
        ) : complaints.length === 0 ? (
          <p className="border-x border-b border-neutral-200 bg-white px-5 py-10 text-center text-neutral-600">{t('admin_none_here')}</p>
        ) : (
          <ul className="border-x border-b border-neutral-200 bg-white">
            {complaints.map((c) => {
              const busy = busyId === c.complaint_id
              return (
                <li key={c.complaint_id} className="flex flex-col gap-4 border-t border-neutral-200 p-4 first:border-t-0 sm:flex-row sm:items-start sm:p-5">
                  {c.image_url ? (
                    <a href={c.image_url} target="_blank" rel="noreferrer" className="shrink-0" title={t('admin_open_photo')}>
                      <img src={c.image_url} alt={c.complaint_id} className="h-36 w-full border border-neutral-200 bg-neutral-100 object-cover sm:h-28 sm:w-28" />
                    </a>
                  ) : (
                    <div className="hidden h-28 w-28 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-400 sm:flex" aria-hidden="true">
                      <ImageOff size={24} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <Link to={`/admin/complaint/${c.complaint_id}`} className="font-semibold tnum hover:text-primary-600 hover:underline" dir="ltr">
                        {c.complaint_id}
                      </Link>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
                        <UrgencyMark level={c.urgency_level} size={13} />
                        {tv('urgency', c.urgency_level)}
                      </span>
                      <span className={`rounded-sm px-2 py-0.5 text-[13px] font-semibold ${statusClasses[c.status] || 'bg-neutral-100 text-neutral-700'}`}>
                        {tv('status', c.status)}
                      </span>
                      {c.flagged && <span className="rounded-sm bg-accent-light px-2 py-0.5 text-[13px] font-semibold text-accent-dark">{t('fq_flagged')}</span>}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[15px] text-neutral-800">{c.description}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-neutral-600">
                      <span>{tv('ward', c.ward) || c.address || t('common_lahore')}</span>
                      <span className="inline-flex items-center gap-1">
                        <Building2 size={13} aria-hidden="true" />
                        {c.assigned_department ? tv('dept', c.assigned_department) : t('admin_unassigned')}
                      </span>
                      <span className="tnum">{new Date(c.submitted_at).toLocaleDateString()}</span>
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
                    <div className="flex shrink-0 flex-col gap-2 sm:w-40">
                      <p className="text-sm font-semibold text-danger-700">{t('fq_reject_confirm', { id: c.complaint_id })}</p>
                      <Button variant="danger" onClick={() => changeStatus(c, 'rejected')}>
                        <X size={16} aria-hidden="true" /> {t('fq_reject_yes')}
                      </Button>
                      <Button variant="secondary" onClick={() => setConfirmingReject(null)}>{t('common_cancel')}</Button>
                    </div>
                  ) : (
                    <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:w-40 sm:flex-col">
                      {(ACTIONS[c.status] || []).map((next) => {
                        const look = ACTION_LOOK[next]
                        const Icon = c.status === 'resolved' || c.status === 'rejected' ? RotateCcw : look.icon
                        return (
                          <Button
                            key={next}
                            variant={look.variant}
                            loading={busy}
                            disabled={busy}
                            onClick={() => (next === 'rejected' ? setConfirmingReject(c.complaint_id) : changeStatus(c, next))}
                          >
                            {!busy && <Icon size={16} aria-hidden="true" />}
                            {c.status === 'resolved' || c.status === 'rejected' ? t('admin_act_reopen') : t(look.key)}
                          </Button>
                        )
                      })}
                      <Button variant="secondary" onClick={() => navigate(`/admin/complaint/${c.complaint_id}`)}>
                        <Eye size={16} aria-hidden="true" /> {t('common_view')}
                      </Button>
                      <Button variant="secondary" className="!text-danger-700" onClick={() => { setConfirmingReject(null); setConfirmingDelete(c.complaint_id) }}>
                        <Trash2 size={16} aria-hidden="true" /> {t('admin_delete')}
                      </Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {nextPage && !loading && (
          <div className="mt-4 text-center">
            <Button variant="secondary" loading={loadingMore} onClick={loadMore}>{t('admin_load_more')}</Button>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
