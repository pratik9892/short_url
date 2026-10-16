import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setAccessToken } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await api.me()
      setUser(res?.data || null)
      return res?.data || null
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password })
    setUser(res?.data || null)
    return res
  }, [])

  const register = useCallback(async (payload) => {
    return api.register(payload)
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setAccessToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refresh,
      isAuthenticated: !!user,
    }),
    [user, loading, login, register, logout, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
