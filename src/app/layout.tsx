import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shiftly — Gestión Horaria',
  description: 'Plataforma SaaS de gestión de turnos y horarios empresariales',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
