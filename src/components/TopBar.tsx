'use client'
import { C, Avatar } from './ui'
import { logout } from '@/lib/actions/auth.actions'
import type { AppSession } from '@/types'

interface Props {
  session: AppSession
  unreadNotifs: number
  onOpenNotifs: () => void
}

export default function TopBar({ session, unreadNotifs, onOpenNotifs }: Props) {
  return (
    <header style={{ height: 56, background: C.surface, borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, flexShrink: 0 }}>

      <div style={{ flex: 1 }}>
        <div style={{ background: C.hi, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: 8,
          color: C.muted, fontSize: 13, maxWidth: 280 }}>
          <span>🔍</span><span>Buscar...</span>
        </div>
      </div>

      {/* Role pill */}
      <div style={{ background: C.accentDim, border: `1px solid ${C.accent}40`,
        borderRadius: 6, padding: '4px 10px', fontSize: 11, color: C.accent,
        fontWeight: 700, letterSpacing: .5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {session.profile.role === 'owner' ? '👑 Owner'
          : session.profile.role === 'admin' ? '🛡 Admin'
          : session.profile.role === 'manager' ? '👔 Gerente'
          : '👤 Empleado'}
      </div>

      {/* Notifications */}
      <button type="button" onClick={onOpenNotifs} style={{ position: 'relative', cursor: 'pointer',
        background: C.hi, border: `1px solid ${C.border}`, borderRadius: 8,
        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub }}>
        🔔
        {unreadNotifs > 0 && (
          <span style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16,
            background: C.red, borderRadius: '50%', border: `2px solid ${C.surface}`,
            fontSize: 9, fontWeight: 700, color: '#fff', display: 'flex',
            alignItems: 'center', justifyContent: 'center' }}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>
        )}
      </button>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name={session.profile.full_name} size={32} />
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{session.profile.full_name}</div>
          <div style={{ fontSize: 10, color: C.muted }}>{session.company.name}</div>
        </div>
      </div>

      {/* Logout */}
      <form action={logout}>
        <button type="submit"
          style={{ background: C.redDim, border: '1px solid #991b1b', borderRadius: 8,
            padding: '7px 14px', cursor: 'pointer', color: '#f87171', fontSize: 13,
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          🚪 Salir
        </button>
      </form>
    </header>
  )
}
