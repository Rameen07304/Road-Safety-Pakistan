import axios from 'axios'

// Read the API base URL from Vite env vars; fall back to localhost for dev.
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000'

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auto attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem(
    'access_token')
  if (token) {
    config.headers.Authorization = 
      `Bearer ${token}`
  }
  return config
})

// Auto refresh token on 401 error
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (
      error.response?.status === 401 &&
      !original._retry
    ) {
      original._retry = true
      try {
        const refresh = localStorage.getItem(
          'refresh_token')
        const res = await axios.post(
          `${API_BASE_URL}/api/auth/token/refresh/`,
          { refresh }
        )
        localStorage.setItem(
          'access_token',
          res.data.access
        )
        original.headers.Authorization =
          `Bearer ${res.data.access}`
        return API(original)
      } catch {
        localStorage.clear()
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
  logout: (refresh) => 
    API.post('/api/auth/logout/', { refresh }),
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
  getDetail: (id) => 
    API.get(`/api/complaints/${id}/`),
  updateStatus: (id, data) => 
    API.patch(
      `/api/admin/complaints/${id}/status/`,
      data
    ),
}

// Detection service functions
export const detectionService = {
  analyze: (data) => 
    API.post('/api/detect/analyze/', data),
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
}

export default API
export const api = API