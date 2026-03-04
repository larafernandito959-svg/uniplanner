'use client'

import { useState, useCallback } from 'react'
import { Home, Clock, CalendarDays, BookOpen, Timer, FolderKanban, User, ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const TUTORIAL_STEPS = [
  {
    icon: Sparkles,
    title: 'Bienvenido a UniPlanner Pro',
    description: 'Tu planificador academico inteligente. Te guiaremos por cada funcion para que aproveches al maximo la aplicacion.',
    color: 'oklch(0.65 0.18 250)',
    highlight: 'intro',
  },
  {
    icon: Home,
    title: 'Dashboard',
    description: 'Tu centro de control. Aqui veras un resumen de tus proximas clases, evaluaciones pendientes, y estadisticas de productividad semanal. Todo en un vistazo.',
    color: 'oklch(0.65 0.18 250)',
    highlight: 'home',
  },
  {
    icon: Clock,
    title: 'Horario Semanal',
    description: 'Organiza tu semana con precision. Agrega tus clases con horarios exactos (08:15 - 19:00), asigna colores, salas y profesores. Soporta semanas A y B para horarios alternados.',
    color: 'oklch(0.65 0.18 155)',
    highlight: 'schedule',
  },
  {
    icon: CalendarDays,
    title: 'Calendario',
    description: 'Vista mensual con todos tus eventos y evaluaciones marcados. Navega entre meses y ve rapidamente que dias tienen actividades importantes.',
    color: 'oklch(0.70 0.15 30)',
    highlight: 'calendar',
  },
  {
    icon: BookOpen,
    title: 'Evaluaciones y Notas',
    description: 'Registra todas tus evaluaciones, agrega notas cuando las recibas, y usa el simulador de promedios para saber que necesitas en tu proximo examen.',
    color: 'oklch(0.60 0.20 300)',
    highlight: 'evaluations',
  },
  {
    icon: Timer,
    title: 'Pomodoro',
    description: 'Tecnica de productividad: sesiones de estudio enfocado con descansos. Configura tiempos personalizados y lleva el registro de tus rachas de estudio.',
    color: 'oklch(0.70 0.15 170)',
    highlight: 'productivity',
  },
  {
    icon: FolderKanban,
    title: 'Proyectos',
    description: 'Gestiona tus trabajos y proyectos academicos. Divide en etapas, registra avances, y controla plazos de entrega. Perfecto para trabajos en grupo.',
    color: 'oklch(0.75 0.15 80)',
    highlight: 'projects',
  },
  {
    icon: User,
    title: 'Perfil',
    description: 'Configura tu cuenta, ajusta preferencias del horario, tiempos de Pomodoro, y personaliza la aplicacion a tu gusto.',
    color: 'oklch(0.65 0.22 350)',
    highlight: 'profile',
  },
]

interface OnboardingTutorialProps {
  onComplete: () => void
}

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [step, setStep] = useState(0)
  const currentStep = TUTORIAL_STEPS[step]
  const Icon = currentStep.icon
  const isLast = step === TUTORIAL_STEPS.length - 1
  const isFirst = step === 0

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete()
    } else {
      setStep(s => s + 1)
    }
  }, [isLast, onComplete])

  const handlePrev = useCallback(() => {
    if (!isFirst) setStep(s => s - 1)
  }, [isFirst])

  const handleSkip = useCallback(() => {
    onComplete()
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-secondary/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary/50 hover:text-foreground"
      >
        Saltar <X className="h-3 w-3" />
      </button>

      {/* Progress dots */}
      <div className="absolute top-8 flex gap-1.5">
        {TUTORIAL_STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === step ? 'w-6 bg-primary' : i < step ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-muted-foreground/30'
            )}
          />
        ))}
      </div>

      {/* Content card */}
      <div className="mx-6 flex max-w-sm flex-col items-center text-center">
        {/* Animated icon */}
        <div
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl transition-all duration-500"
          style={{ backgroundColor: `color-mix(in oklch, ${currentStep.color} 20%, transparent)` }}
        >
          <Icon
            className="h-12 w-12 transition-all duration-500"
            style={{ color: currentStep.color }}
          />
        </div>

        {/* Title */}
        <h2 className="mb-3 text-xl font-bold text-foreground">
          {currentStep.title}
        </h2>

        {/* Description */}
        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
          {currentStep.description}
        </p>

        {/* Bottom navigation bar mockup for non-intro steps */}
        {currentStep.highlight !== 'intro' && (
          <div className="mb-8 w-full max-w-xs rounded-2xl border border-border/30 bg-card/50 p-2">
            <div className="flex items-center justify-around">
              {[
                { id: 'home', icon: Home, label: 'Inicio' },
                { id: 'schedule', icon: Clock, label: 'Horario' },
                { id: 'calendar', icon: CalendarDays, label: 'Calendario' },
                { id: 'evaluations', icon: BookOpen, label: 'Notas' },
                { id: 'productivity', icon: Timer, label: 'Pomodoro' },
                { id: 'projects', icon: FolderKanban, label: 'Proyectos' },
                { id: 'profile', icon: User, label: 'Perfil' },
              ].map((item) => {
                const NavIcon = item.icon
                const isHighlighted = item.id === currentStep.highlight
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 transition-all duration-300',
                      isHighlighted ? 'scale-125' : 'opacity-20'
                    )}
                  >
                    <NavIcon
                      className="h-4 w-4"
                      style={{ color: isHighlighted ? currentStep.color : undefined }}
                    />
                    <span
                      className={cn('text-[8px] font-medium', isHighlighted ? 'font-bold' : 'text-muted-foreground')}
                      style={{ color: isHighlighted ? currentStep.color : undefined }}
                    >
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="absolute bottom-10 flex w-full max-w-sm items-center justify-between px-6">
        <button
          onClick={handlePrev}
          disabled={isFirst}
          className={cn(
            'flex items-center gap-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
            isFirst
              ? 'opacity-0 pointer-events-none'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>

        {/* Step counter */}
        <span className="text-xs text-muted-foreground/60 tabular-nums">
          {step + 1} / {TUTORIAL_STEPS.length}
        </span>

        <button
          onClick={handleNext}
          className="flex items-center gap-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.97]"
        >
          {isLast ? 'Comenzar' : 'Siguiente'} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
