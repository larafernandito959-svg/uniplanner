'use client'

import { useState, useEffect } from 'react'
import { getWelcomeMessage } from '@/lib/lissi-messages'

interface LissiWelcomeProps {
  onComplete: () => void
}

export function LissiWelcome({ onComplete }: LissiWelcomeProps) {
  const [message] = useState(() => getWelcomeMessage())
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 100)
    const exitTimer = setTimeout(() => {
      setExiting(true)
      setTimeout(onComplete, 500)
    }, 4000)
    return () => {
      clearTimeout(showTimer)
      clearTimeout(exitTimer)
    }
  }, [onComplete])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-8 transition-opacity duration-500"
      style={{
        background: 'linear-gradient(145deg, oklch(0.14 0.02 30), oklch(0.16 0.015 250), oklch(0.14 0.01 270))',
        opacity: exiting ? 0 : 1,
      }}
    >
      <div
        className="flex max-w-sm flex-col items-center text-center transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
        }}
      >
        {/* Decorative element */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-lissi-accent/15">
          <svg className="h-8 w-8 text-lissi-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            <path d="M19 3v4" />
            <path d="M21 5h-4" />
          </svg>
        </div>

        <h2 className="mb-2 text-xl font-bold tracking-tight text-foreground">
          Hola, Lissi
        </h2>

        <p className="text-sm leading-relaxed text-lissi-accent/90">
          {message}
        </p>

        <button
          onClick={() => {
            setExiting(true)
            setTimeout(onComplete, 500)
          }}
          className="mt-8 rounded-full bg-lissi-accent/10 px-6 py-2 text-xs font-medium text-lissi-accent transition-all duration-200 hover:bg-lissi-accent/20 active:scale-95"
        >
          Comenzar mi dia
        </button>
      </div>
    </div>
  )
}
