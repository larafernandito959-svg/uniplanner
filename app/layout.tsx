import "./globals.css"
import type { Metadata } from "next"
import RegisterSW from "@/components/RegisterSW"

export const metadata: Metadata = {
  title: "UniPlanner",
  description: "Organiza tu vida académica",
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