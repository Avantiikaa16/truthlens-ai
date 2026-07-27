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

const IDLE_TIMEOUT_MS = 30 * 60 * 1000
const IDLE_CHECK_INTERVAL_MS = 30 * 1000
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const
const LAST_ACTIVITY_KEY = 'truthlens_last_activity'

function markActivityNow(): void {
  window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
}

function getIdleDurationMs(): number {
  const stored = window.localStorage.getItem(LAST_ACTIVITY_KEY)
  const lastActivity = stored ? Number(stored) : Date.now()
  return Date.now() - lastActivity
}

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
    markActivityNow()
    setUser(await api.getMe())
  }

  async function signup(email: string, password: string) {
    const { access_token } = await api.signup(email, password)
    api.setToken(access_token)
    markActivityNow()
    setUser(await api.getMe())
  }

  function logout() {
    api.clearToken()
    window.localStorage.removeItem(LAST_ACTIVITY_KEY)
    setUser(null)
  }

  useEffect(() => {
    if (!user) {
      return
    }

    if (!window.localStorage.getItem(LAST_ACTIVITY_KEY)) {
      markActivityNow()
    }

    ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, markActivityNow, { passive: true }),
    )

    const interval = window.setInterval(() => {
      if (getIdleDurationMs() >= IDLE_TIMEOUT_MS) {
        logout()
      }
    }, IDLE_CHECK_INTERVAL_MS)

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, markActivityNow),
      )
      window.clearInterval(interval)
    }
  }, [user])

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
