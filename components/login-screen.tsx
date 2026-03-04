'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Eye, EyeOff, LogIn, UserPlus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoginScreen() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = mode === 'login'
        ? await login(username, password)
        : await register(username, password)

      if (!result.success) {
        setError(result.error || 'Error desconocido')
      }
    } catch {
      setError('Ocurrio un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'linear-gradient(145deg, oklch(0.12 0.02 250), oklch(0.16 0.01 250), oklch(0.13 0.015 270))' }}>
      <div className="slide-up w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm">
            <BookIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">UniPlanner Pro</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tu planificador academico inteligente</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/50 bg-card/80 p-6 shadow-2xl backdrop-blur-xl">
          {/* Tabs */}
          <div className="mb-6 flex rounded-lg bg-secondary/50 p-1">
            <button
              onClick={() => { setMode('login'); setError('') }}
              className={cn(
                'flex-1 rounded-md py-2 text-sm font-medium transition-all duration-200',
                mode === 'login'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Iniciar Sesion
            </button>
            <button
              onClick={() => { setMode('register'); setError('') }}
              className={cn(
                'flex-1 rounded-md py-2 text-sm font-medium transition-all duration-200',
                mode === 'register'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoComplete="username"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Contrasena
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contrasena"
                  className="w-full rounded-lg border border-border/50 bg-input/50 px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === 'login' ? (
                <LogIn className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-muted-foreground/60">Version Beta</p>
          <p className="text-[11px] text-muted-foreground/40">Desarrollado por Fernando</p>
        </div>
      </div>
    </div>
  )
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M8 7h6" />
      <path d="M8 11h4" />
    </svg>
  )
}
