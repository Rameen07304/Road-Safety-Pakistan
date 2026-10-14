import { BrowserRouter, Routes, Route, 
         Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from './context/AuthContext'
import { useLanguage } from './context/LanguageContext'

// Pages are code-split per route: the whole app used to ship as one
// ~590 kB bundle, so a citizen on a phone downloaded every admin screen
// before the home page could paint.

// Public pages
const Home           = lazy(() => import('./pages/public/Home'))
const LiveMap        = lazy(() => import('./pages/public/LiveMap'))
const TrackComplaint = lazy(() => import('./pages/public/TrackComplaint'))

// Auth pages
const Login          = lazy(() => import('./pages/auth/Login'))
const Register       = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword  = lazy(() => import('./pages/auth/ResetPassword'))

// Citizen pages
const ReportHazard      = lazy(() => import('./pages/citizen/ReportHazard'))
const MyComplaints      = lazy(() => import('./pages/citizen/MyComplaints'))
const CitizenDashboard  = lazy(() => import('./pages/citizen/Dashboard'))

// Admin pages
const Dashboard       = lazy(() => import('./pages/admin/Dashboard'))
const ComplaintDetail = lazy(() => import('./pages/admin/ComplaintDetail'))
const WardAnalytics   = lazy(() => import('./pages/admin/WardAnalytics'))
const FlaggedQueue    = lazy(() => import('./pages/admin/FlaggedQueue'))

// Shown while a route chunk is still downloading.
function RouteFallback() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
      <span className="sr-only">{t('common_loading_page')}</span>
    </div>
  )
}

// Route guard: citizen only
function CitizenRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return (
    <div className="min-h-screen flex items-center
                    justify-center">
      <div className="animate-spin rounded-full 
                      h-12 w-12 border-b-2 
                      border-primary"></div>
    </div>
  )
  // Remember where the guest was going so login can return them there.
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role === 'admin') 
    return <Navigate to="/admin/dashboard" replace />
  return children
}

// Route guard: admin only
function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center
                    justify-center">
      <div className="animate-spin rounded-full 
                      h-12 w-12 border-b-2 
                      border-primary"></div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') 
    return <Navigate to="/" replace />
  return children
}

// Route guard: redirect if already logged in
function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    return user.role === 'admin'
      ? <Navigate to="/admin/dashboard" replace />
      : <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
      <Routes>

        {/* Public routes */}
        <Route path="/" 
               element={<Home />} />
        <Route path="/map" 
               element={<LiveMap />} />
        <Route path="/track" 
               element={<TrackComplaint />} />
        <Route path="/complaint/:id" 
               element={<TrackComplaint />} />
        {/* Model demo removed */}

        {/* Auth routes */}
        <Route path="/login" element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        } />
        <Route path="/register" element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        } />
        <Route path="/forgot-password" element={
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        } />

        {/* Opened from the reset email; no guest guard so it also works while signed in. */}
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

        {/* Citizen routes */}
        <Route path="/report" element={
          <CitizenRoute>
            <ReportHazard />
          </CitizenRoute>
        } />
        <Route path="/my-complaints" element={
          <CitizenRoute>
            <MyComplaints />
          </CitizenRoute>
        } />
        <Route path="/dashboard" element={
          <CitizenRoute>
            <CitizenDashboard />
          </CitizenRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        } />
        <Route path="/admin/complaint/:id" element={
          <AdminRoute>
            <ComplaintDetail />
          </AdminRoute>
        } />
        <Route path="/admin/analytics" element={
          <AdminRoute>
            <WardAnalytics />
          </AdminRoute>
        } />
        <Route path="/admin/flagged" element={
          <AdminRoute>
            <FlaggedQueue />
          </AdminRoute>
        } />

        {/* Catch all */}
        <Route path="*" 
               element={<Navigate to="/" replace />} />

      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
