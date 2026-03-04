'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db, generateId, type Evaluation } from '@/lib/db'
import { Plus, X, Pencil, Trash2, Calculator, TrendingUp, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EvaluationsView() {
  const { user } = useAuth()
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingEval, setEditingEval] = useState<Evaluation | null>(null)
  const [showSimulator, setShowSimulator] = useState(false)
  const [simulatorSubject, setSimulatorSubject] = useState('')

  useEffect(() => {
    if (user) loadData()
  }, [user])

  async function loadData() {
    if (!user) return
    const all = await db.getAll<Evaluation>('evaluations', user)
    setEvaluations(all)
  }

  // Group by subject
  const subjects = useMemo(() => {
    const map = new Map<string, Evaluation[]>()
    evaluations.forEach(e => {
      const existing = map.get(e.subject) || []
      existing.push(e)
      map.set(e.subject, existing)
    })
    return map
  }, [evaluations])

  // Calculate average per subject
  function getSubjectAverage(evals: Evaluation[]): number | null {
    const graded = evals.filter(e => e.grade !== undefined && e.weight > 0)
    if (graded.length === 0) return null
    const totalWeight = graded.reduce((acc, e) => acc + e.weight, 0)
    if (totalWeight === 0) return null
    const weighted = graded.reduce((acc, e) => acc + (e.grade! * e.weight), 0)
    return weighted / totalWeight
  }

  // General average
  const generalAverage = useMemo(() => {
    const avgs: number[] = []
    subjects.forEach(evals => {
      const avg = getSubjectAverage(evals)
      if (avg !== null) avgs.push(avg)
    })
    if (avgs.length === 0) return null
    return avgs.reduce((a, b) => a + b, 0) / avgs.length
  }, [subjects])

  async function handleDelete(id: string) {
    await db.delete('evaluations', id)
    loadData()
  }

  return (
    <div className="page-transition flex flex-col pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-foreground">Evaluaciones y Notas</h1>
          {generalAverage !== null && (
            <p className="text-xs text-muted-foreground">Promedio general: <span className={cn('font-bold', generalAverage >= 4 ? 'text-success' : 'text-destructive')}>{generalAverage.toFixed(1)}</span></p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSimulator(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Simulador"
          >
            <Calculator className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setEditingEval(null); setShowForm(true) }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform active:scale-90"
            aria-label="Agregar evaluacion"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-4">
        {/* General average card */}
        {generalAverage !== null && (
          <div className="rounded-xl border border-border/30 bg-card/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Promedio General</h3>
            </div>
            <div className="flex items-end gap-2">
              <span className={cn('text-4xl font-bold', generalAverage >= 4 ? 'text-success' : 'text-destructive')}>
                {generalAverage.toFixed(2)}
              </span>
              <span className="mb-1 text-sm text-muted-foreground">/ 7.0</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-secondary/50 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', generalAverage >= 4 ? 'bg-success' : 'bg-destructive')}
                style={{ width: `${(generalAverage / 7) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Subjects */}
        {subjects.size === 0 ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <BookOpen className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Aun no tienes evaluaciones</p>
            <p className="text-xs text-muted-foreground/60">Agrega tu primera evaluacion para comenzar</p>
          </div>
        ) : (
          Array.from(subjects.entries()).map(([subject, evals]) => {
            const avg = getSubjectAverage(evals)
            const sortedEvals = [...evals].sort((a, b) => a.date.localeCompare(b.date))

            return (
              <div key={subject} className="rounded-xl border border-border/30 bg-card/50 overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/20 px-4 py-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{subject}</h3>
                    {avg !== null && (
                      <p className="text-xs text-muted-foreground">
                        Promedio: <span className={cn('font-bold', avg >= 4 ? 'text-success' : 'text-destructive')}>{avg.toFixed(1)}</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => { setSimulatorSubject(subject); setShowSimulator(true) }}
                    className="text-xs text-primary hover:underline"
                  >
                    Simular
                  </button>
                </div>
                <div className="divide-y divide-border/10">
                  {sortedEvals.map(ev => (
                    <div key={ev.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{ev.type}</p>
                          <span className="text-[10px] text-muted-foreground/60">({ev.weight}%)</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{ev.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {ev.grade !== undefined ? (
                          <span className={cn('rounded-md px-2 py-0.5 text-sm font-bold', ev.grade >= 4 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                            {ev.grade.toFixed(1)}
                          </span>
                        ) : (
                          <span className="rounded-md bg-secondary/50 px-2 py-0.5 text-xs text-muted-foreground">Pendiente</span>
                        )}
                        <button onClick={() => { setEditingEval(ev); setShowForm(true) }} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(ev.id)} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Eliminar">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Evaluation Form */}
      {showForm && (
        <EvalForm
          initial={editingEval}
          userId={user!}
          onSave={async (ev) => {
            await db.put('evaluations', ev)
            setShowForm(false)
            setEditingEval(null)
            loadData()
          }}
          onClose={() => { setShowForm(false); setEditingEval(null) }}
        />
      )}

      {/* Grade Simulator */}
      {showSimulator && (
        <GradeSimulator
          evaluations={evaluations}
          initialSubject={simulatorSubject}
          subjects={Array.from(subjects.keys())}
          onClose={() => { setShowSimulator(false); setSimulatorSubject('') }}
        />
      )}
    </div>
  )
}

function EvalForm({ initial, userId, onSave, onClose }: {
  initial: Evaluation | null
  userId: string
  onSave: (ev: Evaluation) => void
  onClose: () => void
}) {
  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [type, setType] = useState(initial?.type ?? 'Prueba')
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(initial?.time ?? '')
  const [weight, setWeight] = useState(initial?.weight ?? 0)
  const [grade, setGrade] = useState(initial?.grade !== undefined ? String(initial.grade) : '')
  const [maxGrade] = useState(initial?.maxGrade ?? 7)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim()) { setError('Ramo requerido'); return }
    if (!type.trim()) { setError('Tipo requerido'); return }
    if (weight < 0 || weight > 100) { setError('Ponderacion entre 0 y 100'); return }
    if (grade && (Number(grade) < 1 || Number(grade) > maxGrade)) { setError(`Nota entre 1.0 y ${maxGrade}.0`); return }

    onSave({
      id: initial?.id ?? generateId(),
      userId,
      subject: subject.trim(),
      type: type.trim(),
      date,
      time: time || undefined,
      weight,
      grade: grade ? Number(grade) : undefined,
      maxGrade,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="slide-up max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-border/30 bg-card p-5" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{initial ? 'Editar evaluacion' : 'Nueva evaluacion'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <InputField label="Ramo" value={subject} onChange={setSubject} required />
          <InputField label="Tipo (Prueba, Control, Tarea, etc.)" value={type} onChange={setType} required />
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Hora</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Ponderacion (%)</label>
              <input type="number" min={0} max={100} value={weight} onChange={e => setWeight(Number(e.target.value))}
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Nota (opcional)</label>
              <input type="number" step="0.1" min={1} max={maxGrade} value={grade} onChange={e => setGrade(e.target.value)} placeholder="Ej: 5.5"
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button type="submit" className="mt-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]">
            {initial ? 'Guardar' : 'Crear evaluacion'}
          </button>
        </form>
      </div>
    </div>
  )
}

function GradeSimulator({ evaluations, initialSubject, subjects, onClose }: {
  evaluations: Evaluation[]
  initialSubject: string
  subjects: string[]
  onClose: () => void
}) {
  const [subject, setSubject] = useState(initialSubject || subjects[0] || '')
  const [targetGrade, setTargetGrade] = useState('4.0')

  const subjectEvals = evaluations.filter(e => e.subject === subject)
  const graded = subjectEvals.filter(e => e.grade !== undefined && e.weight > 0)
  const ungraded = subjectEvals.filter(e => e.grade === undefined && e.weight > 0)

  const gradedWeight = graded.reduce((acc, e) => acc + e.weight, 0)
  const gradedWeightedSum = graded.reduce((acc, e) => acc + (e.grade! * e.weight), 0)
  const remainingWeight = 100 - gradedWeight
  const target = Number(targetGrade)

  // Calculate needed grade
  let neededGrade: number | null = null
  if (remainingWeight > 0 && target > 0) {
    neededGrade = (target * 100 - gradedWeightedSum) / remainingWeight
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="slide-up max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-border/30 bg-card p-5" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Simulador de Notas</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Ramo</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground">
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nota objetivo</label>
            <input type="number" step="0.1" min={1} max={7} value={targetGrade} onChange={e => setTargetGrade(e.target.value)}
              className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
          </div>

          <div className="rounded-xl bg-secondary/30 p-4">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notas registradas</span>
                <span className="font-medium text-foreground">{graded.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peso evaluado</span>
                <span className="font-medium text-foreground">{gradedWeight}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peso restante</span>
                <span className="font-medium text-foreground">{remainingWeight}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Evaluaciones pendientes</span>
                <span className="font-medium text-foreground">{ungraded.length}</span>
              </div>
              <div className="mt-2 border-t border-border/20 pt-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Necesitas obtener</span>
                  {neededGrade !== null ? (
                    <span className={cn('text-lg font-bold', neededGrade <= 7 && neededGrade >= 1 ? 'text-success' : 'text-destructive')}>
                      {neededGrade.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
                {neededGrade !== null && neededGrade > 7 && (
                  <p className="mt-1 text-xs text-destructive">No es posible alcanzar esta nota con las evaluaciones restantes</p>
                )}
                {neededGrade !== null && neededGrade < 1 && (
                  <p className="mt-1 text-xs text-success">Ya tienes suficiente para alcanzar tu objetivo</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, required }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
    </div>
  )
}
