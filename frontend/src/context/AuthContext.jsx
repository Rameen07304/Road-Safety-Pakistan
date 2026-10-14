import {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react'
import API, { refreshAccessToken, setAccessToken, SESSION_HINT } from '../services/api'

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(() => !!localStorage.getItem(SESSION_HINT))

  useEffect(() => {
    // Tokens used to live in localStorage; drop any left over from older builds.
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    if (!localStorage.getItem(SESSION_HINT)) return
    // Restore the session from the httpOnly refresh cookie.
    refreshAccessToken()
      .then(() => API.get('/api/auth/profile/'))
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem(SESSION_HINT)
        setAccessToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = (userData, tokens) => {
    setAccessToken(tokens.access)
    localStorage.setItem(SESSION_HINT, '1')
    setUser(userData)
  }

  const logout = async () => {
    try {
      await API.post('/api/auth/logout/')
    } catch {
      // Logout API call is best-effort; ignore errors silently
    }
    setAccessToken(null)
    localStorage.removeItem(SESSION_HINT)
    setUser(null)
  }

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }))
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      updateUser,
      isAdmin: user?.role === 'admin',
      isCitizen: user?.role === 'citizen',
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    )
  }
  return context
}
