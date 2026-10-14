import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { PageTitle, UrgencyMark } from '../../components/UI'
import { Loader2 } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { useLanguage } from '../../context/LanguageContext'

const WARDS = [
  'Lahore Cant', 'Data Ganj Baksh', 'Allama Iqbal', 'Azad Pul', 'Mall',
  'Johar Town', 'Shadbagh', 'Ravi', 'Thokar Niaz Baig', 'Wagha', 'Gulshan Ravi'
]

export default function WardAnalytics() {
  useDocumentTitle('title_ward_analytics')
  const { t, tv } = useLanguage()
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

  const rows = wardStats.length ? wardStats : WARDS.map(ward => ({ ward }))

  return (
    <>
      <Header />
      <PageTitle titleKey="wa_title" />

      <main className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex h-60 items-center justify-center" role="status">
            <Loader2 size={28} className="animate-spin text-neutral-500" aria-hidden="true" />
          </div>
        ) : (
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('th_ward')}</th>
                  <th className="!text-end">{t('th_total')}</th>
                  <th className="!text-end">{t('status_resolved')}</th>
                  <th className="!text-end">{t('status_pending')}</th>
                  <th className="!text-end">{t('urgency_critical')}</th>
                  <th className="!text-end">{t('th_avg_days')}</th>
                  <th>{t('th_resolution')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const total = item.total_complaints || 0
                  const resolved = item.resolved_count || 0
                  const critical = item.critical_count || 0
                  const pct = total > 0 ? (resolved / total) * 100 : 0
                  return (
                    <tr key={item.ward}>
                      <td className="font-semibold">{tv('ward', item.ward)}</td>
                      <td className="text-end tnum">{total}</td>
                      <td className="text-end text-success-700 tnum">{resolved}</td>
                      <td className="text-end text-warning-700 tnum">{item.pending_count || 0}</td>
                      <td className="text-end tnum">
                        {critical > 0 ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-danger-700">
                            <UrgencyMark level="critical" size={10} />
                            {critical}
                          </span>
                        ) : (
                          <span className="text-neutral-500">0</span>
                        )}
                      </td>
                      <td className="text-end tnum">{t('common_days', { n: item.avg_resolution_days ?? 0 })}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-24" aria-hidden="true">
                            <div className="h-full bg-success" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-12 text-end font-semibold tnum">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
