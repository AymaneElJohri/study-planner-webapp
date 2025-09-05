import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

type Session = { loggedIn: boolean; userId?: number; userName?: string }

type AuthContextType = {
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Session>('/session-check')
      .then((s) => setSession(s))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await api.post<{ success: boolean; userId: number }>('/login', { email, password })
    if (res.success) {
      const s = await api.get<Session>('/session-check')
      setSession(s)
    }
  }

  async function logout() {
    await api.post('/logout')
    setSession({ loggedIn: false })
  }

  return (
    <AuthContext.Provider value={{ session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
