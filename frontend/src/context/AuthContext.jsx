import { 
  createContext, 
  useContext,
  useState, 
  useEffect 
} from 'react'
import API from '../services/api'

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(() => !!localStorage.getItem('access_token'))

  useEffect(() => {
    const token = localStorage.getItem(
      'access_token')
    if (token) {
      API.get('/api/auth/profile/')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.clear()
          setUser(null)
        })
        .finally(() => setLoading(false))
    }
  }, [])

  const login = (userData, tokens) => {
    localStorage.setItem(
      'access_token', tokens.access)
    localStorage.setItem(
      'refresh_token', tokens.refresh)
    setUser(userData)
  }

  const logout = async () => {
    try {
      const refresh = localStorage.getItem(
        'refresh_token')
      await API.post('/api/auth/logout/', 
        { refresh })
    } catch (e) {
      // Logout API call is best-effort; ignore errors silently
    }
    localStorage.clear()
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

export default AuthContext
