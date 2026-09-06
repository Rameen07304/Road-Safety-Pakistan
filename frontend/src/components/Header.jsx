import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useState } from 'react'
import { Route, Menu, X, LogOut, Globe } from 'lucide-react'

export default function Header() {
  const { user, logout, loading } = useAuth()
  const { t, toggleLanguage, isUrdu } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const isActive = (path) =>
    location.pathname === path
      ? 'text-primary-500 font-semibold'
      : 'text-neutral-500 hover:text-primary-600 transition'

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-neutral-100 shadow-subtle sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-800 rounded-lg flex items-center justify-center">
            <Route size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-bold text-lg text-neutral-900 hidden sm:block">
            {t('app_name')}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className={`${isActive('/')} text-sm`}>
            {t('nav_home')}
          </Link>
          <Link to="/map" className={`${isActive('/map')} text-sm`}>
            {t('nav_map')}
          </Link>
          <Link to="/track" className={`${isActive('/track')} text-sm`}>
            {t('nav_track')}
          </Link>

          {!loading && (
            <>
              {user ? (
                <>
                  {user.role === 'citizen' && (
                    <>
                      <Link to="/report" className={`${isActive('/report')} text-sm`}>
                        {t('nav_report')}
                      </Link>
                      <Link to="/my-complaints" className={`${isActive('/my-complaints')} text-sm`}>
                        {t('nav_my_issues')}
                      </Link>
                      <Link to="/dashboard" className={`${isActive('/dashboard')} text-sm`}>
                        {t('nav_my_dashboard')}
                      </Link>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <Link to="/admin/dashboard" className={`${isActive('/admin/dashboard')} text-sm`}>
                        {t('nav_dashboard')}
                      </Link>
                      <Link to="/admin/flagged" className={`${isActive('/admin/flagged')} text-sm`}>
                        Flagged
                      </Link>
                      <Link to="/admin/analytics" className={`${isActive('/admin/analytics')} text-sm`}>
                        {t('nav_analytics')}
                      </Link>
                    </>
                  )}
                  <div className="flex items-center gap-3 pl-3 border-l border-neutral-200">
                    <span className="text-sm text-neutral-500">
                      {user.full_name || user.email}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1.5 bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-900 transition"
                    >
                      <LogOut size={14} />
                      {t('nav_logout')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2 pl-3 border-l border-neutral-200">
                  <Link to="/login" className="border border-primary-500 text-primary-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-50 transition">
                    {t('nav_login')}
                  </Link>
                  <Link to="/register" className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-600 transition">
                    {t('nav_register')}
                  </Link>
                </div>
              )}
              <button
                type="button"
                onClick={toggleLanguage}
                aria-label={isUrdu ? 'Switch to English' : 'اردو میں تبدیل کریں'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:border-primary-300 hover:text-primary-600 transition"
              >
                <Globe size={13} />
                {t('language_toggle')}
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-neutral-500"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white p-4 space-y-1">
          <Link to="/" className="block py-2.5 px-3 rounded-lg text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition text-sm">{t('nav_home')}</Link>
          <Link to="/map" className="block py-2.5 px-3 rounded-lg text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition text-sm">{t('nav_map')}</Link>
          <Link to="/track" className="block py-2.5 px-3 rounded-lg text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition text-sm">{t('nav_track')}</Link>
          {user && user.role === 'citizen' && (
            <>
              <Link to="/report" className="block py-2.5 px-3 rounded-lg text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition text-sm">{t('nav_report_hazard')}</Link>
              <Link to="/my-complaints" className="block py-2.5 px-3 rounded-lg text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition text-sm">{t('nav_my_complaints')}</Link>
              <Link to="/dashboard" className="block py-2.5 px-3 rounded-lg text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition text-sm">{t('nav_my_dashboard')}</Link>
            </>
          )}
          {user && user.role === 'admin' && (
            <>
              <Link to="/admin/dashboard" className="block py-2.5 px-3 rounded-lg text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition text-sm">{t('nav_dashboard')}</Link>
              <Link to="/admin/flagged" className="block py-2.5 px-3 rounded-lg text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition text-sm">Flagged</Link>
              <Link to="/admin/analytics" className="block py-2.5 px-3 rounded-lg text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition text-sm">{t('nav_analytics')}</Link>
            </>
          )}
          {!user && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-100">
              <Link to="/login" className="flex-1 border border-primary-500 text-primary-600 px-4 py-2.5 rounded-lg text-center text-sm font-semibold hover:bg-primary-50 transition">
                {t('nav_login')}
              </Link>
              <Link to="/register" className="flex-1 bg-primary-500 text-white px-4 py-2.5 rounded-lg text-center text-sm font-semibold hover:bg-primary-600 transition">
                {t('nav_register')}
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={toggleLanguage}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-500 hover:border-primary-300 hover:text-primary-600 transition"
          >
            <Globe size={14} />
            {t('language_toggle')}
          </button>
          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-danger text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition mt-2 text-sm font-semibold"
            >
              <LogOut size={14} />
              {t('nav_logout')}
            </button>
          )}
        </div>
      )}
    </header>
  )
}
