'use client'
import { useState, useEffect, useCallback } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { C } from './ui'
import type { AppSession, Notification } from '@/types'
import { getNotifications, markAllNotificationsRead } from '@/lib/actions/notifications.actions'
import { hasRole } from '@/lib/auth'

// Views
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

interface Props { session: AppSession }

export default function AppShell({ session }: Props) {
  const [active, setActive] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])

  const loadNotifs = useCallback(async () => {
    const { data } = await getNotifications()
    if (data) setNotifs(data)
  }, [])

  useEffect(() => { loadNotifs() }, [loadNotifs])

  const unreadNotifs = notifs.filter(n => !n.read_at).length

  const handleOpenNotifs = async () => {
    setActive('notifications')
    await markAllNotificationsRead()
    setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
  }

  const renderView = () => {
    switch (active) {
      case 'dashboard':     return <DashboardView session={session} onNav={setActive} />
      case 'shifts':        return <ShiftsView session={session} />
      case 'employees':     return hasRole(session.profile.role, 'manager') ? <EmployeesView session={session} /> : null
      case 'requests':      return <RequestsView session={session} />
      case 'chat':          return <ChatView session={session} />
      case 'notifications': return <NotificationsView notifs={notifs} onRefresh={loadNotifs} />
      case 'pdf':           return <PDFView session={session} />
      case 'departments':   return hasRole(session.profile.role, 'admin') ? <DepartmentsView session={session} /> : null
      case 'stores':        return hasRole(session.profile.role, 'admin') ? <StoresView session={session} /> : null
      case 'settings':      return hasRole(session.profile.role, 'admin') ? <SettingsView session={session} /> : null
      default:              return <DashboardView session={session} onNav={setActive} />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar
        session={session} active={active} setActive={setActive}
        collapsed={collapsed} setCollapsed={setCollapsed}
        unreadCounts={{
          notifications: unreadNotifs,
          requests: 0,
          chat: 0,
        }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar session={session} unreadNotifs={unreadNotifs} onOpenNotifs={handleOpenNotifs} />
        <main style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          {renderView()}
        </main>
      </div>
    </div>
  )
}
