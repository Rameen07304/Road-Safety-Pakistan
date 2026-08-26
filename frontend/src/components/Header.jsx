import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Header() {
  const { user, logout, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-green-600'

  return (
    <header className="bg-[#f6fbf7]/95 backdrop-blur border-b border-green-100 shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#2f6a4d] to-[#143627] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🛣️</span>
          </div>
          <span className="font-bold text-lg text-gray-900 hidden sm:block">
            Road Safety Pakistan
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={`${isActive('/')} pb-1`}>
            Home
          </Link>
          <Link to="/map" className={`${isActive('/map')} pb-1`}>
            Map
          </Link>
          <Link to="/track" className={`${isActive('/track')} pb-1`}>
            Track
          </Link>
          {/* AI Demo link removed per user request */}

          {!loading && (
            <>
              {user ? (
                <>
                  {user.role === 'citizen' && (
                    <>
                      <Link to="/report" className={`${isActive('/report')} pb-1`}>
                        Report
                      </Link>
                      <Link to="/my-complaints" className={`${isActive('/my-complaints')} pb-1`}>
                        My Issues
                      </Link>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <Link to="/admin/dashboard" className={`${isActive('/admin/dashboard')} pb-1`}>
                        Dashboard
                      </Link>
                      <Link to="/admin/analytics" className={`${isActive('/admin/analytics')} pb-1`}>
                        Analytics
                      </Link>
                    </>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      {user.full_name || user.email}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="bg-[#143627] text-white px-4 py-2 rounded hover:bg-[#0f281d] transition"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="border border-[#2f6a4d] text-[#2f6a4d] px-4 py-2 rounded hover:bg-green-50 transition">
                    Login
                  </Link>
                  <Link to="/register" className="bg-[#2f6a4d] text-white px-4 py-2 rounded hover:bg-[#24563f] transition">
                    Register
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-green-100 bg-[#f4faf6] p-4">
          <Link to="/" className="block py-2 text-gray-600 hover:text-green-600">Home</Link>
          <Link to="/map" className="block py-2 text-gray-600 hover:text-green-600">Map</Link>
          <Link to="/track" className="block py-2 text-gray-600 hover:text-green-600">Track</Link>
          {user && user.role === 'citizen' && (
            <>
              <Link to="/report" className="block py-2 text-gray-600 hover:text-green-600">Report Hazard</Link>
              <Link to="/my-complaints" className="block py-2 text-gray-600 hover:text-green-600">My Complaints</Link>
            </>
          )}
          {user && user.role === 'admin' && (
            <>
              <Link to="/admin/dashboard" className="block py-2 text-gray-600 hover:text-green-600">Dashboard</Link>
              <Link to="/admin/analytics" className="block py-2 text-gray-600 hover:text-green-600">Analytics</Link>
            </>
          )}
          {!user && (
            <div className="flex gap-2 mt-2">
              <Link to="/login" className="flex-1 border border-green-600 text-green-600 px-4 py-2 rounded text-center">
                Login
              </Link>
              <Link to="/register" className="flex-1 bg-green-600 text-white px-4 py-2 rounded text-center">
                Register
              </Link>
            </div>
          )}
          {user && (
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition mt-2"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  )
}
