import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useState } from 'react'
import { Menu, X, LogOut, Languages } from 'lucide-react'
import { LogoMark } from './UI'

export default function Header() {
  const { user, logout, loading } = useAuth()
  const { t, toggleLanguage } = useLanguage()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // One list drives both the desktop bar and the mobile menu.
  const links = [
    { to: '/', key: 'nav_home', end: true },
    { to: '/map', key: 'nav_map' },
    { to: '/track', key: 'nav_track' },
    ...(user?.role === 'citizen'
      ? [
          { to: '/report', key: 'nav_report', mobileKey: 'nav_report_hazard' },
          { to: '/my-complaints', key: 'nav_my_issues', mobileKey: 'nav_my_complaints' },
          { to: '/dashboard', key: 'nav_my_dashboard' },
        ]
      : []),
    ...(user?.role === 'admin'
      ? [
          { to: '/admin/dashboard', key: 'nav_dashboard' },
          { to: '/admin/flagged', key: 'nav_flagged' },
          { to: '/admin/analytics', key: 'nav_analytics' },
        ]
      : []),
  ]

  // Active page: a survey-blue rule under the link, not a colour change alone.
  const desktopLink = ({ isActive }) =>
    `relative flex h-16 items-center text-sm transition-colors ${
      isActive
        ? 'font-semibold text-neutral-900 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary-500'
        : 'text-neutral-600 hover:text-neutral-900'
    }`

  const mobileLink = ({ isActive }) =>
    `block rounded-sm px-3 py-3 text-[15px] ${
      isActive ? 'bg-primary-50 font-semibold text-primary-700' : 'text-neutral-700 hover:bg-neutral-50'
    }`

  const languageButton = (extra = '') => (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={t('language_toggle_aria')}
      className={`inline-flex items-center gap-1.5 rounded-sm border border-neutral-300 px-2.5 text-sm text-neutral-700 hover:border-neutral-400 hover:text-neutral-900 transition-colors ${extra}`}
    >
      <Languages size={15} aria-hidden="true" />
      {t('language_toggle')}
    </button>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white">
      <nav className="mx-auto flex h-16 max-w-page items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label={t('app_name')} className="flex items-center gap-2.5">
          <LogoMark size={32} />
          <span className="hidden whitespace-nowrap font-heading text-[15px] font-bold tracking-[-0.01em] text-neutral-900 min-[360px]:block sm:text-[17px]">
            {t('app_name')}
          </span>
        </Link>

        {/* lg, not md: signed-in users have up to 6 links plus logout and
            language, which overflowed a 768px tablet. */}
        <div className="hidden items-center gap-6 whitespace-nowrap lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={desktopLink}>
              {t(l.key)}
            </NavLink>
          ))}

          {!loading && (
            <div className="flex items-center gap-2 border-s border-neutral-200 ps-5">
              {languageButton('h-9')}
              {user ? (
                <>
                  <span className="hidden max-w-[12rem] truncate px-1 text-sm text-neutral-500 xl:inline">
                    {user.full_name || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="inline-flex h-9 items-center gap-1.5 rounded-sm px-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                  >
                    <LogOut size={15} aria-hidden="true" className="rtl:-scale-x-100" />
                    {t('nav_logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="inline-flex h-9 items-center rounded-sm px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors">
                    {t('nav_login')}
                  </Link>
                  <Link to="/register" className="inline-flex h-9 items-center rounded-sm bg-primary-500 px-3.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors">
                    {t('nav_register')}
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          {languageButton('h-9')}
        <button
          type="button"
          className="-me-2 rounded-sm p-2 text-neutral-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? t('nav_close_menu') : t('nav_open_menu')}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div id="mobile-nav" className="border-t border-neutral-200 bg-white shadow-elevated lg:hidden">
          <div className="mx-auto max-w-page px-4 py-2 sm:px-6">
            {user && (
              <p className="px-3 pb-2 pt-3 text-sm text-neutral-500">{user.full_name || user.email}</p>
            )}
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={mobileLink}>
                {t(l.mobileKey || l.key)}
              </NavLink>
            ))}
            <div className="mt-2 flex gap-2 border-t border-neutral-200 py-3">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-sm border border-neutral-300 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                >
                  <LogOut size={15} aria-hidden="true" className="rtl:-scale-x-100" />
                  {t('nav_logout')}
                </button>
              ) : (
                <>
                  <Link to="/login" className="inline-flex h-10 flex-1 items-center justify-center rounded-sm border border-neutral-300 text-sm font-semibold text-neutral-800">
                    {t('nav_login')}
                  </Link>
                  <Link to="/register" className="inline-flex h-10 flex-1 items-center justify-center rounded-sm bg-primary-500 text-sm font-semibold text-white">
                    {t('nav_register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
