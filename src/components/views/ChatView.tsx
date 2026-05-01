'use client'

import { useEffect } from 'react'
import { C, Card } from '../ui'
import type { AppSession } from '@/types'
import { joinChat } from '@/lib/realtime/chat'

export default function ChatView({ session }: { session: AppSession }) {
  useEffect(() => {
    const channel = joinChat(
      'test-room',
      session.profile.id,
      session.profile.company_id
    )

    return () => {
      channel.leave()
    }
  }, [session.profile.id, session.profile.company_id])

  return (
    <Card>
      <h2 style={{ color: C.text, margin: 0, fontSize: 20 }}>
        Chat realtime
      </h2>

      <p style={{ color: C.muted, marginTop: 8 }}>
        Probando conexión Phoenix WebSockets.
      </p>

      <p style={{ color: C.sub, marginTop: 16, fontSize: 13 }}>
        Usuario activo: {session.profile.full_name}
      </p>
    </Card>
  )
}