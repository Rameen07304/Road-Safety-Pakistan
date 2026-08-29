import { BrowserRouter, Routes, Route, 
         Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Public pages
import Home           from './pages/public/Home'
import LiveMap        from './pages/public/LiveMap'
import TrackComplaint from './pages/public/TrackComplaint'
// Model demo removed per user request

// Auth pages
import Login          from './pages/auth/Login'
import Register       from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'

// Citizen pages
import ReportHazard  from './pages/citizen/ReportHazard'
import MyComplaints  from './pages/citizen/MyComplaints'
import CitizenDashboard from './pages/citizen/Dashboard'

// Admin pages
import Dashboard      from './pages/admin/Dashboard'
import ComplaintDetail from './pages/admin/ComplaintDetail'
import WardAnalytics  from './pages/admin/WardAnalytics'

// Route guard: citizen only
function CitizenRoute({ children }) {
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

        {/* Catch all */}
        <Route path="*" 
               element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
