'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db, generateId, type CalendarEvent, type Evaluation } from '@/lib/db'
import { ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const DAY_LABELS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

const TYPE_COLORS: Record<string, string> = {
  class: 'bg-chart-1',
  evaluation: 'bg-chart-5',
  project: 'bg-chart-2',
  task: 'bg-chart-3',
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

export function CalendarView() {
  const { user } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    if (user) loadEvents()
  }, [user])

  async function loadEvents() {
    if (!user) return
    const all = await db.getAll<CalendarEvent>('calendarEvents', user)
    setEvents(all)
  }

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = new Date().toISOString().split('T')[0]

  function getEventsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  async function handleDeleteEvent(id: string) {
    await db.delete('calendarEvents', id)
    loadEvents()
  }

  function handleEditEvent(ev: CalendarEvent) {
    setEditingEvent(ev)
    setShowForm(true)
  }

  const selectedDateEvents = selectedDate
    ? events.filter(e => e.date === selectedDate).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    : []

  return (
    <div className="page-transition flex flex-col pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
        <h1 className="text-lg font-bold text-foreground">Calendario</h1>
        <button
          onClick={() => { setEditingEvent(null); setShowForm(true) }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform active:scale-90"
          aria-label="Agregar evento"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" aria-label="Mes anterior">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-base font-semibold text-foreground">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" aria-label="Mes siguiente">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 px-2">
        {DAY_LABELS.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px px-2">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="h-12" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayEvents = getEventsForDay(day)
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg py-1.5 transition-all duration-150',
                isToday && !isSelected && 'bg-primary/10',
                isSelected && 'bg-primary/20 ring-1 ring-primary/30',
                !isToday && !isSelected && 'hover:bg-secondary/30'
              )}
            >
              <span className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                isToday && 'bg-primary text-primary-foreground font-bold',
                !isToday && 'text-foreground'
              )}>
                {day}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((ev, j) => (
                    <span key={j} className={cn('h-1 w-1 rounded-full', TYPE_COLORS[ev.type] || 'bg-primary')} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected Day Events */}
      {selectedDate && (
        <div className="mx-4 mt-4 rounded-xl border border-border/30 bg-card/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <button
              onClick={() => { setEditingEvent(null); setShowForm(true) }}
              className="text-xs text-primary hover:underline"
            >
              Agregar
            </button>
          </div>
          {selectedDateEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin eventos para este dia</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedDateEvents.map(ev => (
                <div key={ev.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', TYPE_COLORS[ev.type])} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{ev.title}</p>
                      {ev.startTime && (
                        <p className="text-[11px] text-muted-foreground">
                          {ev.startTime}{ev.endTime ? ` - ${ev.endTime}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditEvent(ev)} className="rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label="Editar evento">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDeleteEvent(ev.id)} className="rounded-md p-1 text-muted-foreground hover:text-destructive" aria-label="Eliminar evento">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Event Form Modal */}
      {showForm && (
        <EventForm
          initial={editingEvent}
          defaultDate={selectedDate || today}
          userId={user!}
          onSave={async (ev) => {
            await db.put('calendarEvents', ev)
            // If evaluation type, also create evaluation record
            if (ev.type === 'evaluation' && !ev.linkedEvaluationId) {
              const evalId = generateId()
              const evaluation: Evaluation = {
                id: evalId,
                userId: user!,
                subject: ev.domain || ev.title,
                type: 'Evaluacion',
                date: ev.date,
                time: ev.startTime,
                weight: 0,
                maxGrade: 7,
              }
              await db.put('evaluations', evaluation)
              // Update event with linked evaluation
              ev.linkedEvaluationId = evalId
              await db.put('calendarEvents', ev)
            }
            setShowForm(false)
            setEditingEvent(null)
            loadEvents()
          }}
          onClose={() => { setShowForm(false); setEditingEvent(null) }}
        />
      )}
    </div>
  )
}

function EventForm({ initial, defaultDate, userId, onSave, onClose }: {
  initial: CalendarEvent | null
  defaultDate: string
  userId: string
  onSave: (ev: CalendarEvent) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(initial?.date ?? defaultDate)
  const [startTime, setStartTime] = useState(initial?.startTime ?? '')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '')
  const [type, setType] = useState<CalendarEvent['type']>(initial?.type ?? 'task')
  const [domain, setDomain] = useState(initial?.domain ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Titulo requerido'); return }
    if (!date) { setError('Fecha requerida'); return }

    onSave({
      id: initial?.id ?? generateId(),
      userId,
      title: title.trim(),
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      type,
      domain: domain.trim(),
      description: description.trim() || undefined,
      linkedEvaluationId: initial?.linkedEvaluationId,
      linkedProjectId: initial?.linkedProjectId,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="slide-up max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-border/30 bg-card p-5" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{initial ? 'Editar evento' : 'Nuevo evento'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Titulo</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo</label>
            <div className="grid grid-cols-4 gap-1">
              {(['class', 'evaluation', 'project', 'task'] as const).map(t => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={cn(
                    'rounded-md py-1.5 text-xs font-medium transition-all capitalize',
                    type === t ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground'
                  )}>
                  {t === 'class' ? 'Clase' : t === 'evaluation' ? 'Evaluacion' : t === 'project' ? 'Proyecto' : 'Tarea'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Hora inicio</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Hora termino</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Dominio (ramo, etc.)</label>
            <input value={domain} onChange={e => setDomain(e.target.value)}
              className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" placeholder="Ej: Calculo, Programacion..." />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Descripcion</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground resize-none" />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button type="submit" className="mt-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]">
            {initial ? 'Guardar cambios' : 'Crear evento'}
          </button>
        </form>
      </div>
    </div>
  )
}
