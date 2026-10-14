import { useEffect, useState } from 'react'
import Header from './Header'
import Footer from './Footer'
import { api } from '../services/api'
import { useLanguage } from '../context/LanguageContext'

// The Mall, Lahore. Tariq Khan, CC BY-SA 4.0, via Wikimedia Commons (1280px
// rendition, self-hosted). The licence requires the credit line rendered under
// the photo.
const PHOTO_URL = '/images/the-mall-lahore.jpg'
const PHOTO_PAGE = 'https://commons.wikimedia.org/wiki/File:The_Mall_Road_Lahore.jpg'
const LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/'

/**
 * Shared frame for login, register and password pages: a real Lahore road on
 * the left with the platform's live counts, the form on the right.
 */
export default function AuthLayout({ children }) {
  const { t } = useLanguage()
  const [summary, setSummary] = useState(null)
  const [photoFailed, setPhotoFailed] = useState(false)

  useEffect(() => {
    api.get('/api/analytics/summary/').then((res) => setSummary(res.data)).catch(() => {})
  }, [])

  return (
    <>
      <Header />
      <div className="mx-auto grid min-h-[calc(100dvh-64px)] max-w-page lg:grid-cols-2 lg:px-8">
        <aside className="relative hidden flex-col justify-end overflow-hidden bg-neutral-800 lg:flex">
          {!photoFailed && (
            <img
              src={PHOTO_URL}
              alt={t('auth_photo_alt')}
              onError={() => setPhotoFailed(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="relative bg-neutral-900/85 px-8 py-7 text-white">
            <p className="max-w-[24ch] font-heading text-[26px] font-bold leading-tight">{t('home_hero_title')}</p>
            <dl className="mt-6 grid grid-cols-2 gap-px bg-white/15">
              <div className="bg-neutral-900/90 py-3 pe-4">
                <dt className="text-[13px] text-white/70">{t('login_stat_reported')}</dt>
                <dd className="mt-1 font-heading text-2xl font-bold tnum">{summary ? summary.total_complaints : '…'}</dd>
              </div>
              <div className="bg-neutral-900/90 py-3 ps-4">
                <dt className="text-[13px] text-white/70">{t('login_stat_resolved')}</dt>
                <dd className="mt-1 font-heading text-2xl font-bold tnum">{summary ? summary.resolved_count : '…'}</dd>
              </div>
            </dl>
            {!photoFailed && (
              <p className="mt-5 text-[11px] text-white/60" dir="ltr">
                Photo: <a href={PHOTO_PAGE} className="underline hover:text-white" target="_blank" rel="noreferrer">The Mall, Lahore</a>, Tariq Khan,{' '}
                <a href={LICENSE_URL} className="underline hover:text-white" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
              </p>
            )}
          </div>
        </aside>

        <main className="flex items-start justify-center bg-white px-4 py-10 sm:px-8 lg:items-center lg:py-14">
          <div className="w-full max-w-[420px]">{children}</div>
        </main>
      </div>
      <Footer />
    </>
  )
}
