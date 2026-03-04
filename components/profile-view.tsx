'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db, generateId, type PomodoroSession, type Evaluation, type ScheduleClass, type Project, type SpecialDate } from '@/lib/db'
import { User, Settings, LogOut, Calendar, BookOpen, Timer, FolderKanban, Heart, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getWelcomeMessage, getDailyMessage, getRandomAchievement } from '@/lib/lissi-messages'

export function ProfileView() {
  const { user, isLissi, settings, updateSettings, logout } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalEvals: 0,
    totalProjects: 0,
    totalSessions: 0,
    totalHours: 0,
    avgGrade: 0,
  })

  // Lissi features
  const [showInspiration, setShowInspiration] = useState(false)
  const [inspirationMsg, setInspirationMsg] = useState('')
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([])
  const [showSpecialDateForm, setShowSpecialDateForm] = useState(false)
  const [showWeeklySummary, setShowWeeklySummary] = useState(false)

  useEffect(() => {
    if (user) loadStats()
    if (isLissi) loadSpecialDates()
  }, [user, isLissi])

  async function loadStats() {
    if (!user) return
    const [classes, evals, projects, sessions] = await Promise.all([
      db.getAll<ScheduleClass>('scheduleClasses', user),
      db.getAll<Evaluation>('evaluations', user),
      db.getAll<Project>('projects', user),
      db.getAll<PomodoroSession>('pomodoroSessions', user),
    ])
    const focusSessions = sessions.filter(s => s.completed && s.type === 'focus')
    const gradedEvals = evals.filter(e => e.grade !== undefined)
    const avgGrade = gradedEvals.length > 0 ? gradedEvals.reduce((a, e) => a + e.grade!, 0) / gradedEvals.length : 0

    setStats({
      totalClasses: classes.length,
      totalEvals: evals.length,
      totalProjects: projects.length,
      totalSessions: focusSessions.length,
      totalHours: Math.round(focusSessions.reduce((a, s) => a + s.duration, 0) / 60),
      avgGrade: Number(avgGrade.toFixed(1)),
    })
  }

  async function loadSpecialDates() {
    if (!user) return
    const all = await db.getAll<SpecialDate>('specialDates', user)
    setSpecialDates(all)
  }

  function handleInspiration() {
    setInspirationMsg(getRandomAchievement())
    setShowInspiration(true)
    setTimeout(() => setShowInspiration(false), 5000)
  }

  // Check for special date today
  const todayMMDD = `${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  const todaySpecial = specialDates.find(d => d.date === todayMMDD)

  return (
    <div className="page-transition flex flex-col gap-5 px-4 pb-24 pt-6">
      {/* Profile header */}
      <div className="flex flex-col items-center text-center">
        <div className={cn(
          'mb-3 flex h-20 w-20 items-center justify-center rounded-full',
          isLissi ? 'bg-lissi-accent/20' : 'bg-primary/10'
        )}>
          <User className={cn('h-10 w-10', isLissi ? 'text-lissi-accent' : 'text-primary')} />
        </div>
        <h1 className="text-xl font-bold text-foreground">{user}</h1>
        {isLissi && (
          <p className="mt-1 text-xs text-lissi-accent">{getDailyMessage()}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">Semestre {settings?.currentSemester || '2026-1'}</p>
      </div>

      {/* Lissi: Special date message */}
      {isLissi && todaySpecial && (
        <div className="rounded-xl border border-lissi-accent/20 bg-lissi-warm p-4 text-center">
          <Heart className="mx-auto mb-2 h-5 w-5 text-lissi-accent" />
          <p className="text-sm font-semibold text-foreground">{todaySpecial.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{todaySpecial.message}</p>
        </div>
      )}

      {/* Lissi: Inspiration */}
      {isLissi && showInspiration && (
        <div className="slide-up rounded-xl border border-lissi-accent/20 bg-lissi-warm p-4 text-center">
          <Sparkles className="mx-auto mb-2 h-5 w-5 text-lissi-accent" />
          <p className="text-sm text-foreground">{inspirationMsg}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat icon={<BookOpen className="h-4 w-4" />} label="Clases" value={String(stats.totalClasses)} />
        <MiniStat icon={<Calendar className="h-4 w-4" />} label="Evaluaciones" value={String(stats.totalEvals)} />
        <MiniStat icon={<FolderKanban className="h-4 w-4" />} label="Proyectos" value={String(stats.totalProjects)} />
        <MiniStat icon={<Timer className="h-4 w-4" />} label="Sesiones" value={String(stats.totalSessions)} />
        <MiniStat icon={<Timer className="h-4 w-4" />} label="Horas" value={`${stats.totalHours}h`} />
        <MiniStat icon={<BookOpen className="h-4 w-4" />} label="Promedio" value={stats.avgGrade > 0 ? String(stats.avgGrade) : '-'} />
      </div>

      {/* Lissi: Exclusive buttons */}
      {isLissi && (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleInspiration}
            className="flex items-center justify-center gap-2 rounded-xl border border-lissi-accent/20 bg-lissi-warm px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-lissi-accent/40 active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4 text-lissi-accent" />
            Necesito animo
          </button>
          <button
            onClick={() => setShowWeeklySummary(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-lissi-accent/20 bg-lissi-warm px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-lissi-accent/40 active:scale-[0.98]"
          >
            <Heart className="h-4 w-4 text-lissi-accent" />
            Resumen semanal emocional
          </button>
          <button
            onClick={() => setShowSpecialDateForm(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-border/30 bg-card/50 px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-primary/20 active:scale-[0.98]"
          >
            <Calendar className="h-4 w-4 text-primary" />
            Registrar fecha especial
          </button>
        </div>
      )}

      {/* Settings */}
      <button
        onClick={() => setShowSettings(true)}
        className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/50 px-4 py-3 transition-all hover:border-primary/20"
      >
        <Settings className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Configuracion</span>
      </button>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 transition-all hover:bg-destructive/10"
      >
        <LogOut className="h-5 w-5 text-destructive" />
        <span className="text-sm font-medium text-destructive">Cerrar sesion</span>
      </button>

      {/* Settings Modal */}
      {showSettings && settings && (
        <SettingsModal
          settings={settings}
          onSave={async (partial) => {
            await updateSettings(partial)
            setShowSettings(false)
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Weekly Summary Modal (Lissi) */}
      {isLissi && showWeeklySummary && (
        <WeeklySummary stats={stats} onClose={() => setShowWeeklySummary(false)} />
      )}

      {/* Special Date Form (Lissi) */}
      {isLissi && showSpecialDateForm && (
        <SpecialDateForm
          userId={user!}
          onSave={async (d) => {
            await db.put('specialDates', d)
            setShowSpecialDateForm(false)
            loadSpecialDates()
          }}
          onClose={() => setShowSpecialDateForm(false)}
        />
      )}
    </div>
  )
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border/30 bg-card/50 p-3">
      <div className="text-primary">{icon}</div>
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

function SettingsModal({ settings, onSave, onClose }: {
  settings: any
  onSave: (partial: any) => void
  onClose: () => void
}) {
  const [scheduleStart, setScheduleStart] = useState(settings.scheduleStartHour)
  const [scheduleEnd, setScheduleEnd] = useState(settings.scheduleEndHour)
  const [pomFocus, setPomFocus] = useState(settings.pomodoroFocus)
  const [pomShort, setPomShort] = useState(settings.pomodoroShort)
  const [pomLong, setPomLong] = useState(settings.pomodoroLong)
  const [semester, setSemester] = useState(settings.currentSemester)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="slide-up max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-border/30 bg-card p-5" onClick={e => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-foreground">Configuracion</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Semestre actual</label>
            <input value={semester} onChange={e => setSemester(e.target.value)}
              className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Horario desde</label>
              <input type="number" min={0} max={23} value={scheduleStart} onChange={e => setScheduleStart(Number(e.target.value))}
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Horario hasta</label>
              <input type="number" min={1} max={24} value={scheduleEnd} onChange={e => setScheduleEnd(Number(e.target.value))}
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Enfoque (min)</label>
              <input type="number" min={1} value={pomFocus} onChange={e => setPomFocus(Number(e.target.value))}
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Descanso</label>
              <input type="number" min={1} value={pomShort} onChange={e => setPomShort(Number(e.target.value))}
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Largo</label>
              <input type="number" min={1} value={pomLong} onChange={e => setPomLong(Number(e.target.value))}
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
            </div>
          </div>

          <button
            onClick={() => onSave({
              scheduleStartHour: scheduleStart,
              scheduleEndHour: scheduleEnd,
              pomodoroFocus: pomFocus,
              pomodoroShort: pomShort,
              pomodoroLong: pomLong,
              currentSemester: semester,
            })}
            className="rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function WeeklySummary({ stats, onClose }: { stats: any; onClose: () => void }) {
  const msg = getWelcomeMessage()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="slide-up w-full max-w-sm rounded-2xl border border-lissi-accent/20 bg-lissi-warm p-6 text-center" onClick={e => e.stopPropagation()}>
        <Heart className="mx-auto mb-3 h-8 w-8 text-lissi-accent" />
        <h2 className="mb-4 text-lg font-bold text-foreground">Tu semana, Lissi</h2>
        <div className="mb-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sesiones de estudio</span>
            <span className="font-semibold text-foreground">{stats.totalSessions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Horas totales</span>
            <span className="font-semibold text-foreground">{stats.totalHours}h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Promedio actual</span>
            <span className="font-semibold text-foreground">{stats.avgGrade || '-'}</span>
          </div>
        </div>
        <p className="text-sm text-lissi-accent">{msg}</p>
        <button onClick={onClose} className="mt-4 rounded-lg bg-lissi-accent/20 px-6 py-2 text-sm font-medium text-lissi-accent transition-all hover:bg-lissi-accent/30">
          Cerrar
        </button>
      </div>
    </div>
  )
}

function SpecialDateForm({ userId, onSave, onClose }: {
  userId: string
  onSave: (d: SpecialDate) => void
  onClose: () => void
}) {
  const [month, setMonth] = useState('01')
  const [day, setDay] = useState('01')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return
    onSave({
      id: generateId(),
      userId,
      date: `${month}-${day}`,
      title: title.trim(),
      message: message.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="slide-up w-full max-w-lg rounded-t-2xl border-t border-border/30 bg-card p-5" onClick={e => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-foreground">Fecha especial</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Mes</label>
              <select value={month} onChange={e => setMonth(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Dia</label>
              <select value={day} onChange={e => setDay(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground">
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Titulo</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Mensaje</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} required
              className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground resize-none" />
          </div>
          <button type="submit" className="rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110">
            Guardar
          </button>
        </form>
      </div>
    </div>
  )
}
