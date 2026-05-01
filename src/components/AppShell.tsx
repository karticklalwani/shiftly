'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { C } from './ui'
import type { AppSession, Notification } from '@/types'
import { getNotifications, markAllNotificationsRead } from '@/lib/actions/notifications.actions'
import { hasRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'

import DashboardView from './views/DashboardView'
import ShiftsView from './views/ShiftsView'
import EmployeesView from './views/EmployeesView'
import RequestsView from './views/RequestsView'
import ChatView from './views/ChatView'
import NotificationsView from './views/NotificationsView'
import PDFView from './views/PDFView'
import SettingsView from './views/SettingsView'
import DepartmentsView from './views/DepartmentsView'
import StoresView from './views/StoresView'

interface Props {
  session: AppSession
}

export default function AppShell({ session }: Props) {
  const [active, setActive] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const supabase = useMemo(() => createClient(), [])

  const loadNotifs = useCallback(async () => {
    const { data } = await getNotifications()
    setNotifs(data ?? [])
  }, [])

  useEffect(() => {
    loadNotifs()

    const channel = supabase
      .channel(`notifications:${session.profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.profile.id}`,
        },
        () => loadNotifs()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadNotifs, session.profile.id, supabase])

  const unreadNotifs = notifs.filter((n) => !n.read_at).length

  const handleOpenNotifs = async () => {
    setActive('notifications')
    setMobileMenuOpen(false)
    await markAllNotificationsRead()
    setNotifs((prev) =>
      prev.map((n) => ({
        ...n,
        read_at: n.read_at ?? new Date().toISOString(),
      }))
    )
  }

  const go = (view: string) => {
    setActive(view)
    setMobileMenuOpen(false)
  }

  const renderView = () => {
    switch (active) {
      case 'dashboard':
        return <DashboardView session={session} onNav={go} />
      case 'shifts':
        return <ShiftsView session={session} />
      case 'employees':
        return hasRole(session.profile.role, 'manager') ? <EmployeesView session={session} /> : null
      case 'requests':
        return <RequestsView session={session} />
      case 'chat':
        return <ChatView session={session} />
      case 'notifications':
        return <NotificationsView notifs={notifs} onRefresh={loadNotifs} />
      case 'pdf':
        return <PDFView session={session} />
      case 'departments':
        return hasRole(session.profile.role, 'admin') ? <DepartmentsView session={session} /> : null
      case 'stores':
        return hasRole(session.profile.role, 'admin') ? <StoresView session={session} /> : null
      case 'settings':
        return hasRole(session.profile.role, 'admin') ? <SettingsView session={session} /> : null
      default:
        return <DashboardView session={session} onNav={go} />
    }
  }

  return (
    <div className="app-shell">
      <style>{`
        .app-shell {
          min-height: 100vh;
          background: ${C.bg};
          color: ${C.text};
          display: flex;
          overflow: hidden;
        }

        .desktop-sidebar {
          display: flex;
        }

        .mobile-overlay {
          display: none;
        }

        .main-shell {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .main-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 28px;
        }

        @media (max-width: 768px) {
          .app-shell {
            display: block;
            height: auto;
            min-height: 100vh;
            overflow: visible;
          }

          .desktop-sidebar {
            display: none;
          }

          .mobile-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,.55);
            backdrop-filter: blur(14px);
            z-index: 80;
          }

          .mobile-drawer {
            position: fixed;
            top: 0;
            left: 0;
            width: 82vw;
            max-width: 330px;
            height: 100vh;
            z-index: 90;
            transform: translateX(0);
            animation: slideIn .18s ease-out;
          }

          @keyframes slideIn {
            from { transform: translateX(-100%); opacity: .6; }
            to { transform: translateX(0); opacity: 1; }
          }

          .main-shell {
            height: auto;
            min-height: 100vh;
            overflow: visible;
          }

          .main-content {
            padding: 18px 14px 92px;
            overflow: visible;
          }
        }
      `}</style>

      <div className="desktop-sidebar">
        <Sidebar
          session={session}
          active={active}
          setActive={go}
          unreadCounts={{
            notifications: unreadNotifs,
            requests: 0,
            chat: 0,
          }}
        />
      </div>

      {mobileMenuOpen && (
        <>
          <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-drawer">
            <Sidebar
              session={session}
              active={active}
              setActive={go}
              unreadCounts={{
                notifications: unreadNotifs,
                requests: 0,
                chat: 0,
              }}
            />
          </div>
        </>
      )}

      <div className="main-shell">
        <TopBar
          session={session}
          unreadNotifs={unreadNotifs}
          onOpenNotifs={handleOpenNotifs}
          onOpenMenu={() => setMobileMenuOpen(true)}
        />

        <main className="main-content">{renderView()}</main>
      </div>
    </div>
  )
}