'use client'

import { useState, useEffect, useCallback } from 'react'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { LoginScreen } from '@/components/login-screen'
import { BottomNav } from '@/components/bottom-nav'
import { Dashboard } from '@/components/dashboard'
import { ScheduleView } from '@/components/schedule-view'
import { CalendarView } from '@/components/calendar-view'
import { EvaluationsView } from '@/components/evaluations-view'
import { ProductivityView } from '@/components/productivity-view'
import { ProjectsView } from '@/components/projects-view'
import { ProfileView } from '@/components/profile-view'
import { LissiWelcome } from '@/components/lissi-welcome'
import { OnboardingTutorial } from '@/components/onboarding-tutorial'

function AppContent() {
  const { user, loading, isLissi } = useAuth()
  const [activePage, setActivePage] = useState('home')
  const [showLissiWelcome, setShowLissiWelcome] = useState(false)
  const [welcomeShown, setWelcomeShown] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  // Check if this is the very first time the app is opened (before first login)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasSeenTutorial = localStorage.getItem('uniplanner-tutorial-seen')
    if (!hasSeenTutorial && !user) {
      setShowOnboarding(true)
    }
    setOnboardingChecked(true)
  }, [user])

  // Show Lissi welcome on first login per day
  useEffect(() => {
    if (isLissi && user && !welcomeShown) {
      const sessionKey = `lissi-welcome-${new Date().toISOString().split('T')[0]}`
      const alreadyShown = localStorage.getItem(sessionKey)
      if (!alreadyShown) {
        setShowLissiWelcome(true)
        localStorage.setItem(sessionKey, 'true')
      }
      setWelcomeShown(true)
    }
  }, [isLissi, user, welcomeShown])

  const handleNavigate = useCallback((page: string) => {
    setActivePage(page)
  }, [])

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem('uniplanner-tutorial-seen', 'true')
    setShowOnboarding(false)
  }, [])

  if (loading || !onboardingChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Show onboarding tutorial before first login
  if (showOnboarding && !user) {
    return <OnboardingTutorial onComplete={handleOnboardingComplete} />
  }

  if (!user) {
    return <LoginScreen />
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Lissi Welcome Screen */}
      {showLissiWelcome && (
        <LissiWelcome onComplete={() => setShowLissiWelcome(false)} />
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-lg">
        {activePage === 'home' && <Dashboard onNavigate={handleNavigate} />}
        {activePage === 'schedule' && <ScheduleView />}
        {activePage === 'calendar' && <CalendarView />}
        {activePage === 'evaluations' && <EvaluationsView />}
        {activePage === 'productivity' && <ProductivityView />}
        {activePage === 'projects' && <ProjectsView />}
        {activePage === 'profile' && <ProfileView />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav active={activePage} onChange={setActivePage} />
    </div>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
