import axios from 'axios'

// Dev talks to the local Django server. Production builds default to the same
// origin: vercel.json proxies /api/* to the backend, so the refresh cookie is
// first-party. Set VITE_API_URL only to call an API on another origin.
const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '')

const API = axios.create({
  baseURL: API_BASE_URL,
  // Sends the httpOnly refresh cookie on /api/auth/ calls.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// The access token is kept in memory only, never in localStorage, so an
// injected script cannot lift a long-lived session. The refresh token is an
// httpOnly cookie the backend sets and rotates.
let accessToken = null

// Non-secret flag: lets the app skip the refresh call for visitors who were
// never signed in, instead of logging a 401 on every page load.
export const SESSION_HINT = 'has_session'

export const setAccessToken = (token) => {
  accessToken = token
}

// One refresh at a time: refresh tokens rotate, so two parallel refreshes
// would make the second one present an already-revoked token.
let refreshing = null
export function refreshAccessToken() {
  refreshing ??= axios
    .post(`${API_BASE_URL}/api/auth/token/refresh/`, {}, { withCredentials: true })
    .then((res) => {
      accessToken = res.data.access
      return accessToken
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

API.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// On 401, refresh once and retry. If the session is gone, send a signed-in
// user back to the login page; anonymous requests just fail as before.
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && original && !original._retry && accessToken) {
      original._retry = true
      try {
        const token = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${token}`
        return API(original)
      } catch {
        accessToken = null
        localStorage.removeItem(SESSION_HINT)
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth service functions
export const authService = {
  register: (data) => 
    API.post('/api/auth/register/', data),
  login: (data) => 
    API.post('/api/auth/login/', data),
  logout: () =>
    API.post('/api/auth/logout/'),
  requestPasswordReset: (email) =>
    API.post('/api/auth/password-reset/', { email }),
  confirmPasswordReset: (data) =>
    API.post('/api/auth/password-reset/confirm/', data),
  getProfile: () => 
    API.get('/api/auth/profile/'),
  updateProfile: (data) => 
    API.patch('/api/auth/profile/', data),
  changePassword: (data) => 
    API.post('/api/auth/change-password/', data),
}

// Complaints service functions
export const complaintService = {
  submit: (data) => 
    API.post('/api/complaints/submit/', data),
  uploadImage: (formData, onUploadProgress) =>
    API.post('/api/complaints/upload-image/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  list: (params) => 
    API.get('/api/complaints/', { params }),
  getMap: () => 
    API.get('/api/complaints/map/'),
  track: (params) => 
    API.get('/api/complaints/track/', { params }),
  myComplaints: () =>
    API.get('/api/complaints/my/'),
  myDashboard: () =>
    API.get('/api/complaints/my-dashboard/'),
  getDetail: (id) =>
    API.get(`/api/complaints/${id}/`),
  updateStatus: (id, data) =>
    API.patch(
      `/api/admin/complaints/${id}/status/`,
      data
    ),
  upvote: (id) =>
    API.post(`/api/complaints/${id}/upvote/`),
  removeUpvote: (id) =>
    API.delete(`/api/complaints/${id}/upvote/`),
  // Admin flagged-complaint review queue
  flaggedList: () =>
    API.get('/api/admin/complaints/flagged/'),
  approveComplaint: (id) =>
    API.post(`/api/admin/complaints/${id}/approve/`),
  rejectComplaint: (id) =>
    API.post(`/api/admin/complaints/${id}/reject/`),
}

// Analytics service functions
export const analyticsService = {
  getSummary: () => 
    API.get('/api/analytics/summary/'),
  getWards: () => 
    API.get('/api/analytics/wards/'),
  getHazards: () => 
    API.get('/api/analytics/hazards/'),
  getTrends: (days = 30) =>
    API.get('/api/analytics/trends/',
      { params: { days } }),
  exportPdfReport: (params) =>
    API.get('/api/analytics/report/pdf/', {
      params,
      responseType: 'blob',
    }),
}

export default API
export const api = API