import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, analyticsService, complaintService } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Card, Badge, Button, Alert } from '../../components/UI'
import { Loader2, FileText, FileDown, Clock, CheckCircle2, AlertTriangle, Flag, Building2 } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'

/* eslint-disable react-hooks/set-state-in-effect */

export default function Dashboard() {
  useDocumentTitle('Admin Dashboard')
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
      setExportError('Failed to generate the report. Please try again.')
    } finally {
      setExportingReport(false)
    }
  }

  const filteredComplaints = complaints.filter(c => {
    if (filter === 'pending') return c.status !== 'resolved'
    if (filter === 'critical') return c.urgency_level === 'critical'
    return true
  })

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-heading font-bold text-neutral-900">Admin Dashboard</h1>

          <Card className="w-full lg:w-auto">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="report-start-date" className="block text-xs font-semibold text-neutral-500 mb-1">Start Date</label>
                <input
                  id="report-start-date"
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition"
                />
              </div>
              <div>
                <label htmlFor="report-end-date" className="block text-xs font-semibold text-neutral-500 mb-1">End Date</label>
                <input
                  id="report-end-date"
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition"
                />
              </div>
              <Button loading={exportingReport} onClick={handleExportReport}>
                <FileDown size={16} />
                {exportingReport ? 'Generating report...' : 'Export PDF Report'}
              </Button>
            </div>
            {exportError && <Alert message={exportError} type="error" className="mt-3" />}
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card variant="flat" className="text-center">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText size={18} className="text-primary-500" />
            </div>
            <div className="text-3xl font-heading font-bold text-neutral-900 mb-1">{stats.total}</div>
            <div className="text-sm text-neutral-500">Total Complaints</div>
          </Card>
          <Card variant="flat" className="text-center">
            <div className="w-10 h-10 bg-warning-50 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Clock size={18} className="text-urgency-medium" />
            </div>
            <div className="text-3xl font-heading font-bold text-urgency-medium mb-1">{stats.pending}</div>
            <div className="text-sm text-neutral-500">Pending</div>
          </Card>
          <Card variant="flat" className="text-center">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={18} className="text-success" />
            </div>
            <div className="text-3xl font-heading font-bold text-success mb-1">{stats.resolved}</div>
            <div className="text-sm text-neutral-500">Resolved</div>
          </Card>
          <Card variant="flat" className="text-center">
            <div className="w-10 h-10 bg-danger-50 rounded-lg flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={18} className="text-urgency-critical" />
            </div>
            <div className="text-3xl font-heading font-bold text-danger mb-1">{stats.critical}</div>
            <div className="text-sm text-neutral-500">Critical</div>
          </Card>
          <Card
            variant="flat"
            role="link"
            tabIndex={0}
            aria-label={`Flagged for review: ${flaggedCount}. Open the flagged queue.`}
            className="text-center cursor-pointer transition hover:ring-2 hover:ring-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => navigate('/admin/flagged')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate('/admin/flagged')
              }
            }}
          >
            <div className="w-10 h-10 bg-accent-light rounded-lg flex items-center justify-center mx-auto mb-3">
              <Flag size={18} className="text-accent-dark" />
            </div>
            <div className="text-3xl font-heading font-bold text-accent-dark mb-1">{flaggedCount}</div>
            <div className="text-sm text-neutral-500">Flagged for Review</div>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'critical', label: 'Critical' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                filter === f.id ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Complaints Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 size={36} className="text-primary-500 animate-spin" />
          </div>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left p-4 font-heading font-bold text-neutral-700">ID</th>
                  <th className="text-left p-4 font-heading font-bold text-neutral-700">Summary</th>
                  <th className="text-left p-4 font-heading font-bold text-neutral-700">Department</th>
                  <th className="text-left p-4 font-heading font-bold text-neutral-700">Urgency</th>
                  <th className="text-left p-4 font-heading font-bold text-neutral-700">Status</th>
                  <th className="text-left p-4 font-heading font-bold text-neutral-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map(complaint => (
                  <tr key={complaint.complaint_id} className="border-b border-neutral-100 hover:bg-neutral-50 transition">
                    <td className="p-4 font-semibold text-neutral-900">{complaint.complaint_id}</td>
                    <td className="p-4 text-sm text-neutral-600 max-w-xs truncate" title={complaint.summary}>
                      {complaint.summary || '—'}
                    </td>
                    <td className="p-4">
                      {complaint.assigned_department ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-info-light px-2 py-1 text-xs font-semibold text-info">
                          <Building2 size={11} /> {complaint.assigned_department}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant={complaint.urgency_level?.toLowerCase()}>
                        {complaint.urgency_level} ({complaint.urgency_score})
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={complaint.status === 'resolved' ? 'success' : 'warning'}>
                        {complaint.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/admin/complaint/${complaint.complaint_id}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
      <Footer />
    </>
  )
}
