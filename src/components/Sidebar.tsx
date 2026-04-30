'use client'
import { C } from './ui'
import { logout } from '@/lib/actions/auth.actions'
import { hasRole } from '@/lib/auth'
import type { AppSession } from '@/types'

const NAV_ALL = [
  { id: 'dashboard',      icon: '⊞',  label: 'Dashboard',        minRole: 'employee' },
  { id: 'shifts',         icon: '📅', label: 'Turnos',           minRole: 'employee' },
  { id: 'employees',      icon: '👥', label: 'Empleados',        minRole: 'manager'  },
  { id: 'requests',       icon: '🔄', label: 'Solicitudes',      minRole: 'employee', badge: true },
  { id: 'chat',           icon: '💬', label: 'Chat',             minRole: 'employee', badge: true },
  { id: 'departments',    icon: '🏢', label: 'Departamentos',    minRole: 'admin'    },
  { id: 'stores',         icon: '🏪', label: 'Tiendas',          minRole: 'admin'    },
  { id: 'notifications',  icon: '🔔', label: 'Notificaciones',   minRole: 'employee', badge: true },
  { id: 'pdf',            icon: '📄', label: 'Exportar PDF',     minRole: 'employee' },
  { id: 'settings',       icon: '⚙️', label: 'Ajustes',          minRole: 'admin'    },
]

interface Props {
  session: AppSession
  active: string
  setActive: (id: string) => void
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  unreadCounts?: Record<string, number>
}

export default function Sidebar({ session, active, setActive, collapsed, setCollapsed, unreadCounts = {} }: Props) {
  const nav = NAV_ALL.filter(item => hasRole(session.profile.role, item.minRole))

  return (
    <aside style={{ width: collapsed ? 64 : 220, background: C.surface,
      borderRight: `1px solid ${C.border}`, height: '100vh',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      transition: 'width .25s', overflow: 'hidden' }}>

      {/* Logo */}
      <div style={{ padding: collapsed ? '18px 0' : '18px 16px',
        borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10,
        justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⏰</div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>Shiftly</div>
            <div style={{ fontSize: 10, color: C.muted, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.company.name}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {nav.map(item => {
          const count = unreadCounts[item.id] ?? 0
          return (
            <button key={item.id} type="button" onClick={() => setActive(item.id)}
              style={{ width: '100%', borderRadius: 8,
                background: active === item.id ? C.accentDim : 'transparent',
                border: active === item.id ? `1px solid ${C.accent}30` : '1px solid transparent',
                padding: collapsed ? '10px 0' : '10px 12px',
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                color: active === item.id ? C.accent : C.sub,
                marginBottom: 2, justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative', transition: 'all .15s' }}>
              <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ fontSize: 13, fontWeight: active === item.id ? 600 : 400 }}>{item.label}</span>}
              {count > 0 && !collapsed && (
                <span style={{ marginLeft: 'auto', background: C.accent, color: '#fff',
                  borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{count}</span>
              )}
              {count > 0 && collapsed && (
                <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8,
                  background: C.accent, borderRadius: '50%' }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '10px 8px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {!collapsed && (
          <div style={{ padding: '8px 10px', borderRadius: 8, background: C.hi,
            border: `1px solid ${C.border}`, marginBottom: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.profile.full_name}
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1, textTransform: 'capitalize' }}>
              {session.profile.role} · #{session.profile.login_code}
            </div>
          </div>
        )}

        <form action={logout}>
          <button type="submit"
            style={{ width: '100%', background: C.redDim, border: '1px solid #991b1b',
              borderRadius: 8, padding: collapsed ? '9px 0' : '9px 12px', cursor: 'pointer',
              color: '#f87171', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 8 }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>🚪</span>
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </form>

        <button type="button" onClick={() => setCollapsed(!collapsed)}
          style={{ width: '100%', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '7px 0', cursor: 'pointer', color: C.muted, fontSize: 13 }}>
          {collapsed ? '→' : '← Colapsar'}
        </button>
      </div>
    </aside>
  )
}
