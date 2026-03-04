'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db, generateId, type Project, type ProjectStage } from '@/lib/db'
import { Plus, X, Pencil, Trash2, CheckCircle2, Circle, FolderKanban, Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  'planning': 'Planificacion',
  'in-progress': 'En progreso',
  'review': 'Revision',
  'completed': 'Completado',
}

const STATUS_COLORS: Record<string, string> = {
  'planning': 'bg-chart-3/10 text-chart-3',
  'in-progress': 'bg-primary/10 text-primary',
  'review': 'bg-chart-4/10 text-chart-4',
  'completed': 'bg-success/10 text-success',
}

export function ProjectsView() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    if (user) loadProjects()
  }, [user])

  async function loadProjects() {
    if (!user) return
    const all = await db.getAll<Project>('projects', user)
    setProjects(all.sort((a, b) => a.dueDate.localeCompare(b.dueDate)))
  }

  async function handleDelete(id: string) {
    await db.delete('projects', id)
    setSelectedProject(null)
    loadProjects()
  }

  async function toggleStage(project: Project, stageId: string) {
    const updated = {
      ...project,
      stages: project.stages.map(s => s.id === stageId ? { ...s, completed: !s.completed } : s)
    }
    // Auto-update status based on stages
    const completedCount = updated.stages.filter(s => s.completed).length
    if (completedCount === updated.stages.length && updated.stages.length > 0) {
      updated.status = 'completed'
    } else if (completedCount > 0) {
      updated.status = 'in-progress'
    }
    await db.put('projects', updated)
    setSelectedProject(updated)
    loadProjects()
  }

  async function logTime(project: Project, hours: number) {
    const updated = { ...project, loggedHours: project.loggedHours + hours }
    await db.put('projects', updated)
    setSelectedProject(updated)
    loadProjects()
  }

  function getProgress(project: Project): number {
    if (project.stages.length === 0) return 0
    return (project.stages.filter(s => s.completed).length / project.stages.length) * 100
  }

  function getDaysRemaining(dueDate: string): number {
    return Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="page-transition flex flex-col pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
        <h1 className="text-lg font-bold text-foreground">Proyectos</h1>
        <button
          onClick={() => { setEditingProject(null); setShowForm(true) }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform active:scale-90"
          aria-label="Nuevo proyecto"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3 px-4 pt-4">
        {projects.length === 0 ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <FolderKanban className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Sin proyectos aun</p>
            <p className="text-xs text-muted-foreground/60">Crea tu primer proyecto para organizarte</p>
          </div>
        ) : (
          projects.map(project => {
            const progress = getProgress(project)
            const daysLeft = getDaysRemaining(project.dueDate)

            return (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="w-full rounded-xl border border-border/30 bg-card/50 p-4 text-left transition-all duration-200 hover:border-primary/20 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{project.name}</h3>
                    {project.subject && <p className="text-xs text-muted-foreground">{project.subject}</p>}
                  </div>
                  <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-medium', STATUS_COLORS[project.status])}>
                    {STATUS_LABELS[project.status]}
                  </span>
                </div>

                <div className="mb-2 flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{project.dueDate}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />{project.loggedHours.toFixed(1)}h / {project.estimatedHours}h
                  </span>
                  {daysLeft >= 0 ? (
                    <span className={cn(daysLeft <= 3 ? 'text-destructive' : '')}>{daysLeft} dias restantes</span>
                  ) : (
                    <span className="text-destructive">Vencido</span>
                  )}
                </div>

                <div className="h-1.5 w-full rounded-full bg-secondary/50 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', project.status === 'completed' ? 'bg-success' : 'bg-primary')}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-[10px] text-muted-foreground">{progress.toFixed(0)}% completado</p>
              </button>
            )
          })
        )}
      </div>

      {/* Project Detail */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedProject(null)}>
          <div className="slide-up max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-border/30 bg-card p-5" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">{selectedProject.name}</h2>
                {selectedProject.subject && <p className="text-sm text-muted-foreground">{selectedProject.subject}</p>}
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedProject.description && (
              <p className="mb-4 text-sm text-muted-foreground">{selectedProject.description}</p>
            )}

            {/* Progress */}
            <div className="mb-4 rounded-lg bg-secondary/20 p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-semibold text-foreground">{getProgress(selectedProject).toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary/50 overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${getProgress(selectedProject)}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Tiempo: {selectedProject.loggedHours.toFixed(1)}h / {selectedProject.estimatedHours}h</span>
                <span>Eficiencia: {selectedProject.estimatedHours > 0 ? ((selectedProject.loggedHours / selectedProject.estimatedHours) * 100).toFixed(0) : 0}%</span>
              </div>
            </div>

            {/* Stages */}
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Etapas</h3>
              {selectedProject.stages.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin etapas definidas</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {selectedProject.stages.map(stage => (
                    <button
                      key={stage.id}
                      onClick={() => toggleStage(selectedProject, stage.id)}
                      className="flex items-center gap-2 rounded-lg bg-secondary/20 px-3 py-2 text-left transition-colors hover:bg-secondary/30"
                    >
                      {stage.completed ? (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
                      ) : (
                        <Circle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <span className={cn('text-sm', stage.completed && 'line-through text-muted-foreground')}>{stage.name}</span>
                        <p className="text-[10px] text-muted-foreground">Fecha limite: {stage.dueDate}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Log time */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Registrar tiempo:</span>
              {[0.5, 1, 2].map(h => (
                <button key={h} onClick={() => logTime(selectedProject, h)}
                  className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                  +{h}h
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingProject(selectedProject); setSelectedProject(null); setShowForm(true) }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
              >
                <Pencil className="h-4 w-4" /> Editar
              </button>
              <button
                onClick={() => handleDelete(selectedProject.id)}
                className="flex items-center justify-center gap-2 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-all hover:bg-destructive/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Form */}
      {showForm && (
        <ProjectForm
          initial={editingProject}
          userId={user!}
          onSave={async (p) => {
            await db.put('projects', p)
            setShowForm(false)
            setEditingProject(null)
            loadProjects()
          }}
          onClose={() => { setShowForm(false); setEditingProject(null) }}
        />
      )}
    </div>
  )
}

function ProjectForm({ initial, userId, onSave, onClose }: {
  initial: Project | null
  userId: string
  onSave: (p: Project) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [startDate, setStartDate] = useState(initial?.startDate ?? new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [estimatedHours, setEstimatedHours] = useState(initial?.estimatedHours ?? 10)
  const [stages, setStages] = useState<ProjectStage[]>(initial?.stages ?? [])
  const [newStageName, setNewStageName] = useState('')
  const [newStageDate, setNewStageDate] = useState('')
  const [error, setError] = useState('')

  function addStage() {
    if (!newStageName.trim()) return
    setStages([...stages, {
      id: generateId(),
      name: newStageName.trim(),
      dueDate: newStageDate || dueDate,
      completed: false,
    }])
    setNewStageName('')
    setNewStageDate('')
  }

  function removeStage(id: string) {
    setStages(stages.filter(s => s.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Nombre requerido'); return }
    if (!dueDate) { setError('Fecha limite requerida'); return }

    onSave({
      id: initial?.id ?? generateId(),
      userId,
      name: name.trim(),
      subject: subject.trim() || undefined,
      description: description.trim() || undefined,
      startDate,
      dueDate,
      status: initial?.status ?? 'planning',
      stages,
      estimatedHours,
      loggedHours: initial?.loggedHours ?? 0,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="slide-up max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-border/30 bg-card p-5" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{initial ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <FormInput label="Nombre" value={name} onChange={setName} required />
          <FormInput label="Ramo (opcional)" value={subject} onChange={setSubject} />

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Descripcion</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha inicio</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha limite</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required
                className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Horas estimadas</label>
            <input type="number" min={1} value={estimatedHours} onChange={e => setEstimatedHours(Number(e.target.value))}
              className="w-full rounded-lg border border-border/50 bg-input/50 px-3 py-2 text-sm text-foreground" />
          </div>

          {/* Stages */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Etapas</label>
            {stages.map(s => (
              <div key={s.id} className="mb-1 flex items-center gap-2 rounded-lg bg-secondary/20 px-3 py-1.5">
                <span className="flex-1 text-sm text-foreground">{s.name}</span>
                <span className="text-[10px] text-muted-foreground">{s.dueDate}</span>
                <button type="button" onClick={() => removeStage(s.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <input value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="Nombre de etapa"
                className="flex-1 rounded-lg border border-border/50 bg-input/50 px-3 py-1.5 text-sm text-foreground" />
              <input type="date" value={newStageDate} onChange={e => setNewStageDate(e.target.value)}
                className="rounded-lg border border-border/50 bg-input/50 px-2 py-1.5 text-sm text-foreground" />
              <button type="button" onClick={addStage} className="rounded-lg bg-secondary px-3 py-1.5 text-sm text-secondary-foreground hover:bg-secondary/80">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button type="submit" className="mt-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]">
            {initial ? 'Guardar' : 'Crear proyecto'}
          </button>
        </form>
      </div>
    </div>
  )
}

function FormInput({ label, value, onChange, required }: {
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
