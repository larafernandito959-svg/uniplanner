import "./globals.css"
import type { Metadata } from "next"
import { useEffect } from "react"

export const metadata: Metadata = {
  title: "UniPlanner",
  description: "Organiza tu vida académica"
}

function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
    }
  }, [])

  return null
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <RegisterSW />
        {children}
      </body>
    </html>
  )
}