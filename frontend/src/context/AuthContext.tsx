import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import * as api from '../api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!api.getToken()) {
      setIsLoading(false)
      return
    }

    api
      .getMe()
      .then(setUser)
      .catch(() => api.clearToken())
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const { access_token } = await api.login(email, password)
    api.setToken(access_token)
    setUser(await api.getMe())
  }

  async function signup(email: string, password: string) {
    const { access_token } = await api.signup(email, password)
    api.setToken(access_token)
    setUser(await api.getMe())
  }

  function logout() {
    api.clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
