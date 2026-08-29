import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, analyticsService } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Card, Badge, Button, Alert } from '../../components/UI'

/* eslint-disable react-hooks/set-state-in-effect */

export default function Dashboard() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, critical: 0 })
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

  useEffect(() => {
    fetchComplaints()
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>

          <Card className="w-full lg:w-auto">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <Button loading={exportingReport} onClick={handleExportReport}>
                {exportingReport ? 'Generating report...' : '📄 Export PDF Report'}
              </Button>
            </div>
            {exportError && <Alert message={exportError} type="error" className="mt-3" />}
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">{stats.total}</div>
            <div className="text-gray-600">Total Complaints</div>
          </Card>
          <Card className="text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">{stats.pending}</div>
            <div className="text-gray-600">Pending</div>
          </Card>
          <Card className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{stats.resolved}</div>
            <div className="text-gray-600">Resolved</div>
          </Card>
          <Card className="text-center">
            <div className="text-4xl font-bold text-red-600 mb-2">{stats.critical}</div>
            <div className="text-gray-600">Critical</div>
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
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === f.id ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Complaints Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-bold">ID</th>
                  <th className="text-left p-4 font-bold">Location</th>
                  <th className="text-left p-4 font-bold">Hazard</th>
                  <th className="text-left p-4 font-bold">Urgency</th>
                  <th className="text-left p-4 font-bold">Status</th>
                  <th className="text-left p-4 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map(complaint => (
                  <tr key={complaint.complaint_id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-semibold">{complaint.complaint_id}</td>
                    <td className="p-4">{complaint.ward}</td>
                    <td className="p-4">{complaint.detected_classes?.join(', ') || 'N/A'}</td>
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
