'use client'

import { C, Card } from '../ui'
import type { AppSession } from '@/types'

export default function ChatView({ session }: { session: AppSession }) {
  return (
    <Card>
      <h2 style={{ color: C.text, margin: 0, fontSize: 20 }}>
        Chat realtime
      </h2>

      <p style={{ color: C.muted, marginTop: 8 }}>
        Módulo de chat en migración a Phoenix WebSockets.
      </p>

      <p style={{ color: C.sub, marginTop: 16, fontSize: 13 }}>
        Usuario activo: {session.profile.full_name}
      </p>
    </Card>
  )
}