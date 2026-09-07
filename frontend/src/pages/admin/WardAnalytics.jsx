import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Card, Badge } from '../../components/UI'
import { Loader2 } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const WARDS = [
  'Lahore Cant', 'Data Ganj Baksh', 'Allama Iqbal', 'Azad Pul', 'Mall',
  'Johar Town', 'Shadbagh', 'Ravi', 'Thokar Niaz Baig', 'Wagha', 'Gulshan Ravi'
]

export default function WardAnalytics() {
  useDocumentTitle('Ward Analytics')
  const [loading, setLoading] = useState(true)
  const [wardStats, setWardStats] = useState([])

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await api.get('/api/analytics/wards/')
        setWardStats(response.data || [])
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchComplaints()
  }, [])

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-96">
          <Loader2 size={36} className="text-primary-500 animate-spin" />
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-8">Ward Performance Analytics</h1>

        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left p-4 font-heading font-bold text-neutral-700">Ward</th>
                <th className="text-center p-4 font-heading font-bold text-neutral-700">Total</th>
                <th className="text-center p-4 font-heading font-bold text-neutral-700">Resolved</th>
                <th className="text-center p-4 font-heading font-bold text-neutral-700">Pending</th>
                <th className="text-center p-4 font-heading font-bold text-neutral-700">Critical</th>
                <th className="text-center p-4 font-heading font-bold text-neutral-700">Avg. Days</th>
                <th className="text-center p-4 font-heading font-bold text-neutral-700">Resolution %</th>
              </tr>
            </thead>
            <tbody>
              {(wardStats.length ? wardStats : WARDS.map(ward => ({ ward }))).map((item) => {
                const stats = {
                  total: item.total_complaints || 0,
                  resolved: item.resolved_count || 0,
                  pending: item.pending_count || 0,
                  avgResolutionDays: item.avg_resolution_days ?? 0,
                  criticalCount: item.critical_count || 0,
                  score: item.performance_score ?? 0,
                }
                const resolutionPercentage = stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0

                return (
                  <tr key={item.ward} className="border-b border-neutral-100 hover:bg-neutral-50 transition">
                    <td className="p-4 font-semibold text-neutral-900">{item.ward}</td>
                    <td className="p-4 text-center text-neutral-700">{stats.total}</td>
                    <td className="p-4 text-center text-success font-semibold">{stats.resolved}</td>
                    <td className="p-4 text-center text-urgency-medium font-semibold">{stats.pending}</td>
                    <td className="p-4 text-center">
                      {stats.criticalCount > 0 && (
                        <Badge variant="critical">{stats.criticalCount}</Badge>
                      )}
                    </td>
                    <td className="p-4 text-center text-neutral-600">{stats.avgResolutionDays} days</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 bg-neutral-100 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full"
                            style={{ width: `${resolutionPercentage}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-neutral-700">{resolutionPercentage}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </div>
      <Footer />
    </>
  )
}
