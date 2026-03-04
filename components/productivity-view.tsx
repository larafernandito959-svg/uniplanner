'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db, generateId, type PomodoroSession } from '@/lib/db'
import { Play, Pause, RotateCcw, History, TrendingUp, Flame, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type TimerMode = 'focus' | 'short-break' | 'long-break'

export function ProductivityView() {
  const { user, settings, isLissi } = useAuth()
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const [focusMode, setFocusMode] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [subject, setSubject] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<string>('')

  const focusDuration = (settings?.pomodoroFocus ?? 25) * 60
  const shortBreak = (settings?.pomodoroShort ?? 5) * 60
  const longBreak = (settings?.pomodoroLong ?? 15) * 60

  useEffect(() => {
    if (user) loadSessions()
  }, [user])

  useEffect(() => {
    setTimeLeft(getDuration(mode))
    setIsRunning(false)
  }, [mode, settings])

  function getDuration(m: TimerMode): number {
    if (m === 'focus') return focusDuration
    if (m === 'short-break') return shortBreak
    return longBreak
  }

  async function loadSessions() {
    if (!user) return
    const all = await db.getAll<PomodoroSession>('pomodoroSessions', user)
    setSessions(all.sort((a, b) => b.startedAt.localeCompare(a.startedAt)))
  }

  const completeSession = useCallback(async () => {
    if (!user) return
    const session: PomodoroSession = {
      id: generateId(),
      userId: user,
      date: new Date().toISOString().split('T')[0],
      startedAt: startTimeRef.current || new Date().toISOString(),
      duration: Math.floor(getDuration(mode) / 60),
      type: mode,
      completed: true,
      subject: subject || undefined,
    }
    await db.put('pomodoroSessions', session)
    loadSessions()
    setIsRunning(false)
    setTimeLeft(0)
  }, [user, mode, subject])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            if (intervalRef.current) clearInterval(intervalRef.current)
            completeSession()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, completeSession])

  function startTimer() {
    if (timeLeft === 0) setTimeLeft(getDuration(mode))
    startTimeRef.current = new Date().toISOString()
    setIsRunning(true)
  }

  function pauseTimer() {
    setIsRunning(false)
  }

  function resetTimer() {
    setIsRunning(false)
    setTimeLeft(getDuration(mode))
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = 1 - timeLeft / getDuration(mode)

  // Stats
  const today = new Date().toISOString().split('T')[0]
  const todaySessions = sessions.filter(s => s.date === today && s.completed && s.type === 'focus')
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0)

  // Weekly
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)
  const weekSessions = sessions.filter(s => new Date(s.startedAt) >= weekStart && s.completed && s.type === 'focus')
  const weekMinutes = weekSessions.reduce((acc, s) => acc + s.duration, 0)

  // Monthly
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthSessions = sessions.filter(s => new Date(s.startedAt) >= monthStart && s.completed && s.type === 'focus')
  const monthMinutes = monthSessions.reduce((acc, s) => acc + s.duration, 0)

  // Streak
  const streak = calculateStreak(sessions)

  // Focus mode - minimal UI
  if (focusMode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
        <button onClick={() => setFocusMode(false)} className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:text-foreground">
          <Minimize2 className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center gap-8">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            {mode === 'focus' ? 'Enfoque' : mode === 'short-break' ? 'Descanso' : 'Descanso largo'}
          </p>
          <div className="relative flex h-56 w-56 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="oklch(0.22 0.015 250)" strokeWidth="3" />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke={mode === 'focus' ? 'oklch(0.65 0.18 250)' : 'oklch(0.65 0.18 155)'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${progress * 283} 283`}
                className="transition-all duration-1000"
              />
            </svg>
            <span className="text-5xl font-bold text-foreground font-mono tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          <div className="flex gap-3">
            {!isRunning ? (
              <button onClick={startTimer} className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-90">
                <Play className="h-6 w-6 ml-0.5" />
              </button>
            ) : (
              <button onClick={pauseTimer} className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-90">
                <Pause className="h-6 w-6" />
              </button>
            )}
            <button onClick={resetTimer} className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-transform active:scale-90">
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-transition flex flex-col gap-5 px-4 pb-24 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Productividad</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(!showHistory)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" aria-label="Historial">
            <History className="h-4 w-4" />
          </button>
          <button onClick={() => setFocusMode(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" aria-label="Modo enfoque">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center rounded-2xl border border-border/30 bg-card/50 p-6">
        {/* Mode selector */}
        <div className="mb-6 flex rounded-lg bg-secondary/50 p-0.5">
          {(['focus', 'short-break', 'long-break'] as const).map(m => (
            <button
              key={m}
              onClick={() => { if (!isRunning) setMode(m) }}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {m === 'focus' ? 'Enfoque' : m === 'short-break' ? 'Descanso' : 'Largo'}
            </button>
          ))}
        </div>

        {/* Timer display */}
        <div className="relative mb-6 flex h-48 w-48 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="oklch(0.22 0.015 250)" strokeWidth="2.5" />
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke={mode === 'focus' ? 'oklch(0.65 0.18 250)' : 'oklch(0.65 0.18 155)'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${progress * 283} 283`}
              className="transition-all duration-1000"
            />
          </svg>
          <span className="text-4xl font-bold text-foreground font-mono tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>

        {/* Subject */}
        {mode === 'focus' && !isRunning && (
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Materia (opcional)"
            className="mb-4 w-full max-w-xs rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-center text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none transition-all"
          />
        )}

        {/* Controls */}
        <div className="flex gap-3">
          {!isRunning ? (
            <button onClick={startTimer} className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-90">
              <Play className="h-5 w-5 ml-0.5" />
            </button>
          ) : (
            <button onClick={pauseTimer} className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-90">
              <Pause className="h-5 w-5" />
            </button>
          )}
          <button onClick={resetTimer} className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-transform active:scale-90">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Hoy" value={`${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`} sub={`${todaySessions.length} sesiones`} icon={<TrendingUp className="h-4 w-4" />} />
        <StatBox label="Esta semana" value={`${Math.floor(weekMinutes / 60)}h ${weekMinutes % 60}m`} sub={`${weekSessions.length} sesiones`} icon={<TrendingUp className="h-4 w-4" />} />
        <StatBox label="Este mes" value={`${Math.floor(monthMinutes / 60)}h ${monthMinutes % 60}m`} sub={`${monthSessions.length} sesiones`} icon={<TrendingUp className="h-4 w-4" />} />
        <StatBox label="Racha" value={`${streak} dias`} sub="de constancia" icon={<Flame className="h-4 w-4" />} color={isLissi ? 'text-lissi-accent' : undefined} />
      </div>

      {/* History */}
      {showHistory && (
        <div className="rounded-xl border border-border/30 bg-card/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Historial reciente</h3>
          {sessions.filter(s => s.completed && s.type === 'focus').slice(0, 20).length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin sesiones registradas</p>
          ) : (
            <div className="flex flex-col gap-2">
              {sessions.filter(s => s.completed && s.type === 'focus').slice(0, 20).map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-secondary/20 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.subject || 'Sin materia'}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(s.startedAt).toLocaleDateString('es-CL')}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{s.duration}min</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, sub, icon, color }: {
  label: string; value: string; sub: string; icon: React.ReactNode; color?: string
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/50 p-3.5">
      <div className={cn('mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10', color || 'text-primary')}>
        {icon}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  )
}

function calculateStreak(sessions: PomodoroSession[]): number {
  const focusSessions = sessions.filter(s => s.completed && s.type === 'focus')
  const uniqueDays = new Set(focusSessions.map(s => s.date))
  const sortedDays = Array.from(uniqueDays).sort().reverse()
  
  if (sortedDays.length === 0) return 0
  
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  if (sortedDays[0] !== today && sortedDays[0] !== yesterday) return 0
  
  let streak = 1
  for (let i = 1; i < sortedDays.length; i++) {
    const current = new Date(sortedDays[i - 1])
    const prev = new Date(sortedDays[i])
    const diff = (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) streak++
    else break
  }
  return streak
}
