'use client'
import { C, Card, Btn } from '../ui'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notifications.actions'
import type { Notification } from '@/types'

const NOTIF_ICONS: Record<string, string> = {
  shift_change:       '🔄',
  request_approved:   '✅',
  request_rejected:   '❌',
  new_message:        '💬',
  new_request:        '📋',
}

interface Props {
  notifs: Notification[]
  onRefresh: () => void
}

export default function NotificationsView({ notifs, onRefresh }: Props) {
  const unread = notifs.filter(n => !n.read_at)

  const handleMarkOne = async (id: string) => {
    await markNotificationRead(id)
    onRefresh()
  }

  const handleMarkAll = async () => {
    await markAllNotificationsRead()
    onRefresh()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>Notificaciones</h2>
          <p style={{ color: C.muted, marginTop: 4, fontSize: 13 }}>
            {unread.length > 0 ? `${unread.length} sin leer` : 'Todo leído ✓'}
          </p>
        </div>
        {unread.length > 0 && (
          <Btn variant="secondary" onClick={handleMarkAll}>Marcar todas como leídas</Btn>
        )}
      </div>

      {notifs.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
          <div style={{ color: C.muted, fontSize: 14 }}>No tienes notificaciones</div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifs.map(n => (
            <div key={n.id} onClick={() => !n.read_at && handleMarkOne(n.id)}
              style={{ background: n.read_at ? C.surface : C.hi,
                border: `1px solid ${n.read_at ? C.border : C.accent + '40'}`,
                borderLeft: `3px solid ${n.read_at ? C.border : C.accent}`,
                borderRadius: 10, padding: '14px 16px',
                display: 'flex', alignItems: 'flex-start', gap: 12,
                cursor: n.read_at ? 'default' : 'pointer',
                transition: 'background .15s' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10,
                background: n.read_at ? C.border + '40' : C.accentDim,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0 }}>
                {NOTIF_ICONS[n.type] ?? '🔔'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: n.read_at ? 400 : 700, color: C.text, marginBottom: 3 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: C.sub }}>{n.message}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>
                  {new Date(n.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {!n.read_at && (
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: C.accent, flexShrink: 0, marginTop: 4 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
