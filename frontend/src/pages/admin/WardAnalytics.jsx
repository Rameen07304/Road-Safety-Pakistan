import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Card, Badge } from '../../components/UI'

const WARDS = [
  'Lahore Cant', 'Data Ganj Baksh', 'Allama Iqbal', 'Azad Pul', 'Mall',
  'Johar Town', 'Shadbagh', 'Ravi', 'Thokar Niaz Baig', 'Wagha', 'Gulshan Ravi'
]

export default function WardAnalytics() {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Ward Performance Analytics</h1>

        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-4 font-bold">Ward</th>
                <th className="text-center p-4 font-bold">Total</th>
                <th className="text-center p-4 font-bold">Resolved</th>
                <th className="text-center p-4 font-bold">Pending</th>
                <th className="text-center p-4 font-bold">Critical</th>
                <th className="text-center p-4 font-bold">Avg. Days</th>
                <th className="text-center p-4 font-bold">Resolution %</th>
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
                  <tr key={item.ward} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-semibold">{item.ward}</td>
                    <td className="p-4 text-center">{stats.total}</td>
                    <td className="p-4 text-center text-green-600 font-semibold">{stats.resolved}</td>
                    <td className="p-4 text-center text-orange-600 font-semibold">{stats.pending}</td>
                    <td className="p-4 text-center">
                      {stats.criticalCount > 0 && (
                        <Badge variant="critical">{stats.criticalCount}</Badge>
                      )}
                    </td>
                    <td className="p-4 text-center">{stats.avgResolutionDays} days</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${resolutionPercentage}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold">{resolutionPercentage}%</span>
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
