'use client'

import { Home, CalendarDays, Clock, BookOpen, FolderKanban, Timer, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'schedule', label: 'Horario', icon: Clock },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays },
  { id: 'evaluations', label: 'Notas', icon: BookOpen },
  { id: 'productivity', label: 'Pomodoro', icon: Timer },
  { id: 'projects', label: 'Proyectos', icon: FolderKanban },
  { id: 'profile', label: 'Perfil', icon: User },
]

interface BottomNavProps {
  active: string
  onChange: (id: string) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn('h-5 w-5 transition-transform duration-200', isActive && 'scale-110')} />
              <span className={cn('text-[10px] font-medium leading-none', isActive && 'font-semibold')}>{item.label}</span>
              {isActive && (
                <span className="mt-0.5 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
