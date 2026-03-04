'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db, type ScheduleClass, type Evaluation, type PomodoroSession } from '@/lib/db'
import { Clock, BookOpen, Target, Timer, ArrowRight, TrendingUp, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return 'Buenas noches'
  if (hour < 12) return 'Buenos dias'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function getTimeString(time: string): string {
  return time
}

interface DashboardProps {
  onNavigate: (page: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user, isLissi } = useAuth()
  const [classes, setClasses] = useState<ScheduleClass[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    if (!user) return
    loadData()
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [user])

  async function loadData() {
    if (!user) return
    const [c, e, s] = await Promise.all([
      db.getAll<ScheduleClass>('scheduleClasses', user),
      db.getAll<Evaluation>('evaluations', user),
      db.getAll<PomodoroSession>('pomodoroSessions', user),
    ])
    setClasses(c)
    setEvaluations(e)
    setSessions(s)
  }

  // Next class today
  const dayOfWeek = (now.getDay() + 6) % 7 // 0=Monday
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const todayClasses = classes
    .filter(c => c.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  const nextClass = todayClasses.find(c => c.startTime > currentTime) || todayClasses.find(c => c.endTime > currentTime)

  // Next evaluation
  const today = now.toISOString().split('T')[0]
  const upcomingEvals = evaluations
    .filter(e => e.date >= today && e.grade === undefined)
    .sort((a, b) => a.date.localeCompare(b.date))
  const nextEval = upcomingEvals[0]

  // Days until next eval
  const daysUntilEval = nextEval
    ? Math.ceil((new Date(nextEval.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Weekly productivity
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)
  const weekSessions = sessions.filter(s => {
    const d = new Date(s.startedAt)
    return d >= weekStart && s.completed && s.type === 'focus'
  })
  const weekMinutes = weekSessions.reduce((acc, s) => acc + s.duration, 0)

  // Pending evaluations count
  const pendingEvals = evaluations.filter(e => e.date >= today && e.grade === undefined).length

  return (
    <div className="page-transition flex flex-col gap-5 px-4 pb-24 pt-6">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">{getGreeting()}</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{user}</h1>
        {isLissi && (
          <p className="mt-1 text-xs text-lissi-accent">Tu dia va a ser increible</p>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Clases hoy"
          value={String(todayClasses.length)}
          color="text-chart-1"
          bgColor="bg-chart-1/10"
        />
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Evaluaciones pendientes"
          value={String(pendingEvals)}
          color="text-chart-2"
          bgColor="bg-chart-2/10"
        />
        <StatCard
          icon={<Timer className="h-4 w-4" />}
          label="Horas esta semana"
          value={`${Math.floor(weekMinutes / 60)}h ${weekMinutes % 60}m`}
          color="text-chart-3"
          bgColor="bg-chart-3/10"
        />
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Sesiones semanales"
          value={String(weekSessions.length)}
          color="text-chart-4"
          bgColor="bg-chart-4/10"
        />
      </div>

      {/* Next Class */}
      {nextClass && (
        <DashboardCard
          title="Proxima clase"
          icon={<Clock className="h-4 w-4 text-primary" />}
          onClick={() => onNavigate('schedule')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{nextClass.name}</p>
              <p className="text-xs text-muted-foreground">
                {getTimeString(nextClass.startTime)} - {getTimeString(nextClass.endTime)}
              </p>
              {nextClass.room && (
                <p className="text-xs text-muted-foreground">Sala: {nextClass.room}</p>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
          </div>
        </DashboardCard>
      )}

      {/* Next Evaluation */}
      {nextEval && (
        <DashboardCard
          title="Proxima evaluacion"
          icon={<BookOpen className="h-4 w-4 text-chart-5" />}
          onClick={() => onNavigate('evaluations')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{nextEval.subject} - {nextEval.type}</p>
              <p className="text-xs text-muted-foreground">{nextEval.date}</p>
            </div>
            {daysUntilEval !== null && (
              <div className="flex flex-col items-center rounded-xl bg-chart-5/10 px-3 py-2">
                <span className="text-lg font-bold text-chart-5">{daysUntilEval}</span>
                <span className="text-[10px] text-muted-foreground">{daysUntilEval === 1 ? 'dia' : 'dias'}</span>
              </div>
            )}
          </div>
        </DashboardCard>
      )}

      {/* Academic Load */}
      <DashboardCard
        title="Carga academica semanal"
        icon={<TrendingUp className="h-4 w-4 text-chart-2" />}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Evaluaciones esta semana</span>
            <span className="font-semibold text-foreground">
              {evaluations.filter(e => {
                const evalDate = new Date(e.date)
                return evalDate >= weekStart && evalDate <= new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) && e.grade === undefined
              }).length}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Clases semanales</span>
            <span className="font-semibold text-foreground">{classes.length}</span>
          </div>
        </div>
      </DashboardCard>

      {/* Quick Access */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Accesos rapidos</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Horario', icon: Clock, page: 'schedule' },
            { label: 'Calendario', icon: Calendar, page: 'calendar' },
            { label: 'Notas', icon: BookOpen, page: 'evaluations' },
            { label: 'Pomodoro', icon: Timer, page: 'productivity' },
          ].map(item => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-secondary/50 px-2 py-3 transition-all duration-200 hover:bg-secondary active:scale-95"
            >
              <item.icon className="h-5 w-5 text-primary" />
              <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, bgColor }: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  bgColor: string
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/50 p-3.5">
      <div className={cn('mb-2 flex h-8 w-8 items-center justify-center rounded-lg', bgColor, color)}>
        {icon}
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function DashboardCard({ title, icon, children, onClick }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-border/30 bg-card/50 p-4',
        onClick && 'cursor-pointer transition-all duration-200 hover:border-primary/20 active:scale-[0.99]'
      )}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  )
}
