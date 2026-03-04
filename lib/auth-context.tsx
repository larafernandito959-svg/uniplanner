'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { db, hashPassword, type UserRecord, type UserSettings } from './db'

interface AuthContextType {
  user: string | null
  isLissi: boolean
  loading: boolean
  settings: UserSettings | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 60000 // 1 minute

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [attempts, setAttempts] = useState<Record<string, { count: number; lastAttempt: number }>>({})

  const isLissi = user === 'Lissi'

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('uniplanner-user') : null
    if (stored) {
      setUser(stored)
      loadSettings(stored)
    }
    initDefaultUser()
    setLoading(false)
  }, [])

  async function initDefaultUser() {
    try {
      const existing = await db.get<UserRecord>('users', 'Lissi')
      if (!existing) {
        const hash = await hashPassword('lissi123')
        await db.put('users', { username: 'Lissi', passwordHash: hash, createdAt: new Date().toISOString() })
      }
    } catch {
      // IndexedDB not available
    }
  }

  async function loadSettings(userId: string) {
    try {
      const s = await db.get<UserSettings>('settings', userId)
      if (s) {
        setSettings(s)
      } else {
        const defaults: UserSettings = {
          userId,
          scheduleStartHour: 8,
          scheduleEndHour: 20,
          pomodoroFocus: 25,
          pomodoroShort: 5,
          pomodoroLong: 15,
          currentSemester: '2026-1',
          currentWeekType: 'A',
        }
        await db.put('settings', defaults)
        setSettings(defaults)
      }
    } catch {
      // fallback
    }
  }

  const login = useCallback(async (username: string, password: string) => {
    const trimmedUser = username.trim()
    if (!trimmedUser || !password) return { success: false, error: 'Completa todos los campos' }

    // Check lockout
    const userAttempts = attempts[trimmedUser]
    if (userAttempts && userAttempts.count >= MAX_ATTEMPTS) {
      const elapsed = Date.now() - userAttempts.lastAttempt
      if (elapsed < LOCKOUT_DURATION) {
        const remaining = Math.ceil((LOCKOUT_DURATION - elapsed) / 1000)
        return { success: false, error: `Demasiados intentos. Espera ${remaining}s` }
      }
      setAttempts(prev => ({ ...prev, [trimmedUser]: { count: 0, lastAttempt: 0 } }))
    }

    try {
      const record = await db.get<UserRecord>('users', trimmedUser)
      if (!record) return { success: false, error: 'Usuario no encontrado' }

      const hash = await hashPassword(password)
      if (hash !== record.passwordHash) {
        setAttempts(prev => ({
          ...prev,
          [trimmedUser]: {
            count: (prev[trimmedUser]?.count || 0) + 1,
            lastAttempt: Date.now()
          }
        }))
        return { success: false, error: 'Contrasena incorrecta' }
      }

      localStorage.setItem('uniplanner-user', trimmedUser)
      setUser(trimmedUser)
      await loadSettings(trimmedUser)
      return { success: true }
    } catch {
      return { success: false, error: 'Error al iniciar sesion' }
    }
  }, [attempts])

  const register = useCallback(async (username: string, password: string) => {
    const trimmedUser = username.trim()
    if (!trimmedUser || !password) return { success: false, error: 'Completa todos los campos' }
    if (trimmedUser.length < 3) return { success: false, error: 'El usuario debe tener al menos 3 caracteres' }
    if (password.length < 6) return { success: false, error: 'La contrasena debe tener al menos 6 caracteres' }

    try {
      const existing = await db.get<UserRecord>('users', trimmedUser)
      if (existing) return { success: false, error: 'El usuario ya existe' }

      const hash = await hashPassword(password)
      await db.put('users', { username: trimmedUser, passwordHash: hash, createdAt: new Date().toISOString() })
      
      localStorage.setItem('uniplanner-user', trimmedUser)
      setUser(trimmedUser)
      await loadSettings(trimmedUser)
      return { success: true }
    } catch {
      return { success: false, error: 'Error al registrar' }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('uniplanner-user')
    setUser(null)
    setSettings(null)
  }, [])

  const updateSettings = useCallback(async (partial: Partial<UserSettings>) => {
    if (!user || !settings) return
    const updated = { ...settings, ...partial }
    await db.put('settings', updated)
    setSettings(updated)
  }, [user, settings])

  return (
    <AuthContext.Provider value={{ user, isLissi, loading, settings, login, register, logout, updateSettings }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
