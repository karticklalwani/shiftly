'use client'

import { C } from './ui'
import { logout } from '@/lib/actions/auth.actions'
import { hasRole } from '@/lib/auth'
import type { AppSession } from '@/types'

const NAV_ALL = [
  { id: 'dashboard', icon: '⊞', label: 'Dashboard', minRole: 'employee' },
  { id: 'shifts', icon: '📅', label: 'Turnos', minRole: 'employee' },
  { id: 'employees', icon: '👥', label: 'Empleados', minRole: 'manager' },
  { id: 'requests', icon: '🔄', label: 'Solicitudes', minRole: 'employee', badge: true },
  { id: 'chat', icon: '💬', label: 'Chat', minRole: 'employee', badge: true },
  { id: 'departments', icon: '🏢', label: 'Departamentos', minRole: 'admin' },
  { id: 'stores', icon: '🏪', label: 'Tiendas', minRole: 'admin' },
  { id: 'notifications', icon: '🔔', label: 'Notificaciones', minRole: 'employee', badge: true },
  { id: 'pdf', icon: '📄', label: 'Exportar PDF', minRole: 'employee' },
  { id: 'settings', icon: '⚙️', label: 'Ajustes', minRole: 'admin' },
]

interface Props {
  session: AppSession
  active: string
  setActive: (id: string) => void
  unreadCounts?: Record<string, number>
}

export default function Sidebar({ session, active, setActive, unreadCounts = {} }: Props) {
  const nav = NAV_ALL.filter((item) => hasRole(session.profile.role, item.minRole))

  return (
    <aside className="sidebar-ios">
      <style>{`
        .sidebar-ios {
          width: 260px;
          background: rgba(17, 24, 39, .9);
          border-right: 1px solid ${C.border};
          height: 100vh;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .sidebar-logo {
          padding: 20px 18px;
          border-bottom: 1px solid ${C.border};
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-btn {
          width: 100%;
          border-radius: 16px;
          background: transparent;
          border: 1px solid transparent;
          padding: 13px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          color: ${C.sub};
          margin-bottom: 6px;
          text-align: left;
          transition: all .16s ease;
        }

        .nav-btn-active {
          background: rgba(59, 130, 246, .24);
          border-color: rgba(59, 130, 246, .45);
          color: ${C.accent};
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.02);
        }

        .nav-icon {
          width: 24px;
          text-align: center;
          font-size: 17px;
          flex-shrink: 0;
        }

        .nav-label {
          font-size: 14px;
          font-weight: 650;
        }

        .sidebar-bottom {
          padding: 12px;
          border-top: 1px solid ${C.border};
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .user-card-ios {
          padding: 12px 13px;
          border-radius: 16px;
          background: rgba(26,34,53,.78);
          border: 1px solid ${C.border};
        }

        .logout-ios {
          width: 100%;
          background: rgba(127, 29, 29, .92);
          border: 1px solid rgba(239,68,68,.42);
          border-radius: 16px;
          padding: 13px 14px;
          cursor: pointer;
          color: #fca5a5;
          font-size: 14px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: flex-start;
        }

        @media (max-width: 768px) {
          .sidebar-ios {
            width: 100%;
            height: 100vh;
            border-right: 1px solid ${C.border};
          }

          .nav-btn {
            padding: 15px 14px;
            border-radius: 18px;
          }

          .nav-label {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="sidebar-logo">
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 16,
            background: C.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          ⏰
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: C.text, letterSpacing: -0.5 }}>
            Shiftly
          </div>
          <div
            style={{
              fontSize: 12,
              color: C.muted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 170,
            }}
          >
            {session.company.name}
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
        {nav.map((item) => {
          const count = unreadCounts[item.id] ?? 0
          const isActive = active === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={`nav-btn ${isActive ? 'nav-btn-active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>

              {count > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    background: C.accent,
                    color: '#fff',
                    borderRadius: 999,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-card-ios">
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: C.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {session.profile.full_name}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 3, textTransform: 'capitalize' }}>
            {session.profile.role} · #{session.profile.login_code}
          </div>
        </div>

        <form action={logout}>
          <button type="submit" className="logout-ios">
            <span>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  )
}