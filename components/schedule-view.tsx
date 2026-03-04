'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db, generateId, type ScheduleClass } from '@/lib/db'
import { Plus, X, Pencil, Trash2, MapPin, User as UserIcon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const DAYS_FULL = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
const COLORS = [
  'oklch(0.65 0.18 250)', 'oklch(0.65 0.18 155)', 'oklch(0.70 0.15 30)',
  'oklch(0.60 0.20 300)', 'oklch(0.70 0.15 170)', 'oklch(0.75 0.15 80)',
  'oklch(0.65 0.22 350)', 'oklch(0.60 0.15 200)',
]

// Fixed schedule range: 08:15 to 19:00
const SCHEDULE_START = 8 * 60 + 15  // 08:15 in minutes
const SCHEDULE_END = 19 * 60         // 19:00 in minutes
const TOTAL_MINUTES = SCHEDULE_END - SCHEDULE_START // 645 minutes
const PX_PER_MINUTE = 1.8 // pixels per minute for grid height

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function formatDuration(start: string, end: string): string {
  const diff = timeToMinutes(end) - timeToMinutes(start)
  const h = Math.floor(diff / 60)
  const m = diff % 60
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h}h`
  return `${m}min`
}

// Generate time labels dynamically from class start/end times
function getTimeLabelsFromClasses(classes: ScheduleClass[]): { minutes: number; label: string }[] {
  const timesSet = new Set<number>()
  // Always include schedule boundaries
  timesSet.add(SCHEDULE_START)
  timesSet.add(SCHEDULE_END)
  // Add every class start and end time
  for (const c of classes) {
    timesSet.add(timeToMinutes(c.startTime))
    timesSet.add(timeToMinutes(c.endTime))
  }
  const sorted = Array.from(timesSet).sort((a, b) => a - b)
  return sorted.map(m => ({ minutes: m, label: minutesToTime(m) }))
}

export function ScheduleView() {
  const { user, settings } = useAuth()
  const [classes, setClasses] = useState<ScheduleClass[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingClass, setEditingClass] = useState<ScheduleClass | null>(null)
  const [selectedClass, setSelectedClass] = useState<ScheduleClass | null>(null)
  const [weekType, setWeekType] = useState<'A' | 'B'>('A')
  const scrollRef = useRef<HTMLDivElement>(null)

  const gridHeight = TOTAL_MINUTES * PX_PER_MINUTE

  useEffect(() => {
    if (user) loadClasses()
  }, [user])

  useEffect(() => {
    if (settings) setWeekType(settings.currentWeekType)
  }, [settings])

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      if (currentMinutes >= SCHEDULE_START && currentMinutes <= SCHEDULE_END) {
        const offset = (currentMinutes - SCHEDULE_START) * PX_PER_MINUTE
        scrollRef.current.scrollTop = Math.max(0, offset - 80)
      }
    }
  }, [classes])

  async function loadClasses() {
    if (!user) return
    const all = await db.getAll<ScheduleClass>('scheduleClasses', user)
    setClasses(all)
  }

  async function handleDelete(id: string) {
    await db.delete('scheduleClasses', id)
    setSelectedClass(null)
    loadClasses()
  }

  function handleEdit(c: ScheduleClass) {
    setEditingClass(c)
    setSelectedClass(null)
    setShowForm(true)
  }

  // Current time indicator
  const now = new Date()
  const currentDay = (now.getDay() + 6) % 7 // 0=Mon
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const showTimeLine = currentMinutes >= SCHEDULE_START && currentMinutes <= SCHEDULE_END

  const filteredClasses = classes.filter(c => c.weekType === 'both' || c.weekType === weekType)
  const timeLabels = getTimeLabelsFromClasses(filteredClasses)

  return (
    <div className="page-transition flex h-full flex-col pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-foreground">Horario</h1>
          <p className="text-xs text-muted-foreground">Semana {weekType} &middot; 08:15 - 19:00</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-secondary/50 p-0.5">
            <button
              onClick={() => setWeekType('A')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-all',
                weekType === 'A' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
            >A</button>
            <button
              onClick={() => setWeekType('B')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-all',
                weekType === 'B' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
            >B</button>
          </div>
          <button
            onClick={() => { setEditingClass(null); setShowForm(true) }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform active:scale-90"
            aria-label="Agregar clase"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Time column + Grid area share the same scroll */}
        <div ref={scrollRef} className="flex flex-1 overflow-y-auto overflow-x-hidden">
          {/* Time column */}
          <div className="relative w-14 flex-shrink-0 border-r border-border/20 pt-9">
            <div style={{ height: gridHeight }} className="relative">
              {timeLabels.map((tl) => {
                const top = (tl.minutes - SCHEDULE_START) * PX_PER_MINUTE
                return (
                  <div
                    key={tl.minutes}
                    className="absolute right-2 flex items-center"
                    style={{ top: top - 6 }}
                  >
                    <span className="text-[10px] font-medium text-muted-foreground/80 tabular-nums">
                      {tl.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Main grid */}
          <div className="relative flex-1">
            {/* Day headers - sticky */}
            <div className="sticky top-0 z-10 grid border-b border-border/20 bg-background/95 backdrop-blur-sm" style={{ gridTemplateColumns: `repeat(${DAYS.length}, 1fr)` }}>
              {DAYS.map((d, i) => (
                <div
                  key={d}
                  className={cn(
                    'py-2 text-center text-[11px] font-semibold',
                    i === currentDay ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grid body */}
            <div className="relative" style={{ height: gridHeight }}>
              {/* Horizontal hour lines */}
              {timeLabels.map((tl) => {
                const top = (tl.minutes - SCHEDULE_START) * PX_PER_MINUTE
                return (
                  <div
                    key={`line-${tl.minutes}`}
                    className="absolute left-0 right-0 border-t border-border/15"
                    style={{ top }}
                  />
                )
              })}

              {/* Full hour reference lines (subtle, for visual guidance) */}
              {Array.from({ length: 12 }, (_, i) => {
                const fullHour = (8 + i) * 60
                if (fullHour <= SCHEDULE_START || fullHour >= SCHEDULE_END) return null
                // Skip if a time label is very close (within 10 min) to avoid clutter
                const tooClose = timeLabels.some(tl => tl.minutes !== fullHour && Math.abs(tl.minutes - fullHour) < 10)
                if (tooClose) return null
                const top = (fullHour - SCHEDULE_START) * PX_PER_MINUTE
                return (
                  <div
                    key={`ref-${fullHour}`}
                    className="absolute left-0 right-0 border-t border-border/6 border-dashed"
                    style={{ top }}
                  />
                )
              })}

              {/* Day columns with vertical separators */}
              <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${DAYS.length}, 1fr)` }}>
                {DAYS.map((_, dayIndex) => (
                  <div key={dayIndex} className="relative border-r border-border/8">
                    {/* Classes for this day */}
                    {filteredClasses
                      .filter(c => c.dayOfWeek === dayIndex)
                      .map(c => {
                        const startMin = timeToMinutes(c.startTime)
                        const endMin = timeToMinutes(c.endTime)
                        const top = (startMin - SCHEDULE_START) * PX_PER_MINUTE
                        const height = (endMin - startMin) * PX_PER_MINUTE
                        const isShort = height < 50

                        return (
                          <button
                            key={c.id}
                            onClick={() => setSelectedClass(c)}
                            className="absolute left-0.5 right-0.5 overflow-hidden rounded-md border border-white/15 px-1.5 py-1 text-left transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                            style={{
                              top,
                              height: Math.max(height, 20),
                              backgroundColor: c.color || COLORS[0],
                            }}
                          >
                            <span className="block truncate text-[10px] font-bold leading-tight text-white drop-shadow-sm">
                              {c.name}
                            </span>
                            {!isShort && (
                              <>
                                <span className="block truncate text-[9px] font-medium text-white/90 leading-tight mt-0.5">
                                  {c.startTime} - {c.endTime}
                                </span>
                                {c.room && height > 70 && (
                                  <span className="block truncate text-[8px] text-white/70 leading-tight mt-0.5">
                                    {c.room}
                                  </span>
                                )}
                              </>
                            )}
                            {isShort && (
                              <span className="block truncate text-[8px] text-white/80 leading-tight">
                                {c.startTime}
                              </span>
                            )}
                          </button>
                        )
                      })}
                  </div>
                ))}
              </div>

              {/* Current time line */}
              {showTimeLine && (
                <div
                  className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                  style={{
                    top: (currentMinutes - SCHEDULE_START) * PX_PER_MINUTE,
                  }}
                >
                  <div className="h-2.5 w-2.5 -ml-1 rounded-full bg-destructive shadow-md shadow-destructive/40" />
                  <div className="h-[2px] flex-1 bg-destructive/70" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Class Detail Modal */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedClass(null)}>
          <div className="slide-up w-full max-w-lg rounded-t-2xl border-t border-border/30 bg-card p-5" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                <h2 className="text-lg font-bold text-foreground">{selectedClass.name}</h2>
              </div>
              <button onClick={() => setSelectedClass(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-3 text-sm">
              {selectedClass.professor && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="h-4 w-4" />
                  <span>{selectedClass.professor}</span>
                </div>
              )}
              {selectedClass.room && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedClass.room}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{selectedClass.startTime} - {selectedClass.endTime} ({formatDuration(selectedClass.startTime, selectedClass.endTime)})</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {DAYS_FULL[selectedClass.dayOfWeek]} | Semana {selectedClass.weekType === 'both' ? 'A y B' : selectedClass.weekType.toUpperCase()}
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => handleEdit(selectedClass)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
              >
                <Pencil className="h-4 w-4" /> Editar
              </button>
              <button
                onClick={() => handleDelete(selectedClass.id)}
                className="flex items-center justify-center gap-2 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-all hover:bg-destructive/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <ClassForm
          initial={editingClass}
          weekType={weekType}
          onSave={async (data) => {
            await db.put('scheduleClasses', data)
            setShowForm(false)
            setEditingClass(null)
            loadClasses()
          }}
          onClose={() => { setShowForm(false); setEditingClass(null) }}
          userId={user!}
        />
      )}
    </div>
  )
}

function ClassForm({ initial, weekType, onSave, onClose, userId }: {
  initial: ScheduleClass | null
  weekType: 'A' | 'B'
  onSave: (data: ScheduleClass) => void
  onClose: () => void
  userId: string
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [professor, setProfessor] = useState(initial?.professor ?? '')
  const [room, setRoom] = useState(initial?.room ?? '')
  const [day, setDay] = useState(initial?.dayOfWeek ?? 0)
  const [startTime, setStartTime] = useState(initial?.startTime ?? '08:15')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '09:45')
  const [color, setColor] = useState(initial?.color ?? COLORS[0])
  const [wType, setWType] = useState<'both' | 'A' | 'B'>(initial?.weekType ?? 'both')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Nombre requerido'); return }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) { setError('La hora de termino debe ser posterior'); return }
    if (timeToMinutes(startTime) < SCHEDULE_START) { setError('La hora de inicio minima es 08:15'); return }
    if (timeToMinutes(endTime) > SCHEDULE_END) { setError('La hora de termino maxima es 19:00'); return }

    onSave({
      id: initial?.id ?? generateId(),
      userId,
      name: name.trim(),
      professor: professor.trim(),
      room: room.trim(),
      dayOfWeek: day,
      startTime,
      endTime,
      color,
      weekType: wType,
      semester: '2026-1',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="slide-up max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-border/30 bg-card p-5" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{initial ? 'Editar clase' : 'Nueva clase'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <FormField label="Nombre del ramo" value={name} onChange={setName} required />
          <FormField label="Profesor" value={professor} onChange={setProfessor} />
          <FormField label="Sala" value={room} onChange={setRoom} />

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Dia</label>
            <div className="grid grid-cols-6 gap-1">
              {DAYS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDay(i)}
                  className={cn(
                    'rounded-md py-1.5 text-xs font-medium transition-all',
                    day === i ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  )}
                >{d}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Inicio</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} min="08:15" max="18:45"
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Termino</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} min="08:30" max="19:00"
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground/60">Horario permitido: 08:15 - 19:00</p>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Semana</label>
            <div className="flex gap-2">
              {(['both', 'A', 'B'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setWType(t)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                    wType === t ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground'
                  )}
                >{t === 'both' ? 'Ambas' : `Semana ${t}`}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn('h-7 w-7 rounded-full border-2 transition-transform', color === c ? 'border-foreground scale-110' : 'border-transparent')}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button type="submit" className="mt-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]">
            {initial ? 'Guardar cambios' : 'Crear clase'}
          </button>
        </form>
      </div>
    </div>
  )
}

function FormField({ label, value, onChange, required }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />
    </div>
  )
}
