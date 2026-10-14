import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, analyticsService, complaintService } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Button, Alert, PageTitle, StatStrip, UrgencyMark } from '../../components/UI'
import { statusClasses } from '../../utils/urgencyHelpers'
import { Loader2, FileDown, Building2 } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { useLanguage } from '../../context/LanguageContext'

/* eslint-disable react-hooks/set-state-in-effect */

export default function Dashboard() {
  useDocumentTitle('title_admin_dashboard')
  const { t, tv } = useLanguage()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, critical: 0 })
  const [flaggedCount, setFlaggedCount] = useState(0)
  const [reportStartDate, setReportStartDate] = useState('')
  const [reportEndDate, setReportEndDate] = useState('')
  const [exportingReport, setExportingReport] = useState(false)
  const [exportError, setExportError] = useState('')
  const navigate = useNavigate()

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/api/complaints/')
      const data = response.data.results || response.data || []
      setComplaints(data.sort((a, b) => b.urgency_score - a.urgency_score))
      
      setStats({
        total: data.length,
        pending: data.filter(c => c.status !== 'resolved').length,
        resolved: data.filter(c => c.status === 'resolved').length,
        critical: data.filter(c => c.urgency_level === 'critical').length,
      })
    } catch (err) {
      console.error('Failed to fetch complaints:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchFlaggedCount = async () => {
    try {
      const res = await complaintService.flaggedList()
      const data = res.data.results || res.data || []
      setFlaggedCount(data.length)
    } catch {
      // Non-critical
    }
  }

  useEffect(() => {
    fetchComplaints()
    fetchFlaggedCount()
  }, [])

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

  const filteredComplaints = complaints.filter(c => {
    if (filter === 'pending') return c.status !== 'resolved'
    if (filter === 'critical') return c.urgency_level === 'critical'
    return true
  })

  const filters = [
    { id: 'all', label: t('common_all') },
    { id: 'pending', label: t('status_pending') },
    { id: 'critical', label: t('urgency_critical') },
  ]

  return (
    <>
      <Header />
      <PageTitle titleKey="admin_title" subtitle={t('admin_subtitle')} />

      <main className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8">
        <StatStrip
          className="mb-8"
          items={[
            { label: t('admin_total'), value: stats.total },
            { label: t('status_pending'), value: stats.pending },
            { label: t('status_resolved'), value: stats.resolved },
            { label: t('urgency_critical'), value: stats.critical },
            {
              label: t('admin_flagged_review'),
              value: flaggedCount,
              tone: 'text-accent-dark',
              onClick: () => navigate('/admin/flagged'),
              ariaLabel: t('admin_flagged_aria', { n: flaggedCount }),
            },
          ]}
        />

        {/* Toolbar: the queue filter on one side, the occasional PDF export on the other. */}
        <div className="flex flex-col gap-4 border-b border-neutral-300 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex" role="tablist">
            {filters.map(f => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`-mb-px h-11 border-b-2 px-4 text-sm font-semibold transition-colors ${
                  filter === f.id ? 'border-primary-500 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {f.label}
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
        ) : (
          <div className="overflow-x-auto border-x border-b border-neutral-200 bg-white">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('th_id')}</th>
                  <th className="hidden lg:table-cell">{t('th_summary')}</th>
                  <th className="hidden lg:table-cell">{t('th_department')}</th>
                  <th>{t('th_urgency')}</th>
                  <th>{t('th_status')}</th>
                  <th className="hidden text-end md:table-cell"><span className="sr-only">{t('th_action')}</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map(complaint => (
                  <tr key={complaint.complaint_id}>
                    <td className="whitespace-nowrap font-semibold tnum" dir="ltr">
                      <Link to={`/admin/complaint/${complaint.complaint_id}`} className="-my-1.5 inline-block py-1.5 hover:text-primary-600 hover:underline">
                        {complaint.complaint_id}
                      </Link>
                    </td>
                    <td className="hidden max-w-xs truncate text-neutral-700 lg:table-cell" title={complaint.summary}>
                      {complaint.summary || '—'}
                    </td>
                    <td className="hidden whitespace-nowrap lg:table-cell">
                      {complaint.assigned_department ? (
                        <span className="inline-flex items-center gap-1.5 text-neutral-700">
                          <Building2 size={13} className="text-neutral-500" aria-hidden="true" /> {tv('dept', complaint.assigned_department)}
                        </span>
                      ) : (
                        <span className="text-neutral-500">{t('admin_unassigned')}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <UrgencyMark level={complaint.urgency_level} size={11} />
                        {tv('urgency', complaint.urgency_level)}
                        <span className="text-neutral-500 tnum">{complaint.urgency_score}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${statusClasses[complaint.status] || 'bg-neutral-100 text-neutral-700'}`}>
                        {tv('status', complaint.status)}
                      </span>
                    </td>
                    <td className="hidden text-end md:table-cell">
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/complaint/${complaint.complaint_id}`)}>
                        {t('common_view')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
