'use client'

import { C, Avatar } from './ui'
import { logout } from '@/lib/actions/auth.actions'
import type { AppSession } from '@/types'

interface Props {
  session: AppSession
  unreadNotifs: number
  onOpenNotifs: () => void
  onOpenMenu: () => void
}

export default function TopBar({ session, unreadNotifs, onOpenNotifs, onOpenMenu }: Props) {
  return (
    <header className="topbar">
      <style>{`
        .topbar {
          height: 64px;
          background: rgba(17, 24, 39, .82);
          border-bottom: 1px solid ${C.border};
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 12px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .menu-btn {
          display: none;
        }

        .search-box {
          background: ${C.hi};
          border: 1px solid ${C.border};
          border-radius: 14px;
          padding: 9px 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: ${C.muted};
          font-size: 13px;
          max-width: 280px;
        }

        .role-pill {
          background: ${C.accentDim};
          border: 1px solid ${C.accent}55;
          border-radius: 999px;
          padding: 7px 13px;
          font-size: 11px;
          color: ${C.accent};
          font-weight: 800;
          letter-spacing: .8px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .notif-btn {
          position: relative;
          cursor: pointer;
          background: ${C.hi};
          border: 1px solid ${C.border};
          border-radius: 14px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${C.sub};
        }

        .user-block {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .logout-top {
          background: ${C.redDim};
          border: 1px solid #991b1b;
          border-radius: 12px;
          padding: 8px 14px;
          cursor: pointer;
          color: #f87171;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .topbar {
            height: 70px;
            padding: 0 14px;
            gap: 10px;
          }

          .menu-btn {
            display: flex;
            width: 42px;
            height: 42px;
            border-radius: 14px;
            border: 1px solid ${C.border};
            background: ${C.hi};
            color: ${C.text};
            align-items: center;
            justify-content: center;
            font-size: 18px;
            cursor: pointer;
            flex-shrink: 0;
          }

          .search-box {
            display: none;
          }

          .role-pill {
            font-size: 10px;
            padding: 7px 10px;
            max-width: 118px;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .user-name {
            display: none;
          }

          .company-name {
            display: none;
          }

          .logout-top {
            display: none;
          }
        }
      `}</style>

      <button type="button" className="menu-btn" onClick={onOpenMenu}>
        ☰
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="search-box">
          <span>🔍</span>
          <span>Buscar...</span>
        </div>
      </div>

      <div className="role-pill">
        {session.profile.role === 'owner'
          ? '👑 Owner'
          : session.profile.role === 'admin'
            ? '🛡 Admin'
            : session.profile.role === 'manager'
              ? '👔 Gerente'
              : '👤 Empleado'}
      </div>

      <button type="button" onClick={onOpenNotifs} className="notif-btn">
        🔔
        {unreadNotifs > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 17,
              height: 17,
              padding: '0 4px',
              background: C.red,
              borderRadius: 999,
              border: `2px solid ${C.surface}`,
              fontSize: 9,
              fontWeight: 800,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadNotifs > 9 ? '9+' : unreadNotifs}
          </span>
        )}
      </button>

      <div className="user-block">
        <Avatar name={session.profile.full_name} size={36} />

        <div style={{ lineHeight: 1.25, minWidth: 0 }}>
          <div className="user-name" style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
            {session.profile.full_name}
          </div>
          <div className="company-name" style={{ fontSize: 10, color: C.muted }}>
            {session.company.name}
          </div>
        </div>
      </div>

      <form action={logout}>
        <button type="submit" className="logout-top">
          🚪 Salir
        </button>
      </form>
    </header>
  )
}