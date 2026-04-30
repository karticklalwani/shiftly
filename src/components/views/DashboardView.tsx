'use client'
import { useState, useEffect } from 'react'
import { C, Card, StatCard, Avatar, StatusBadge, Btn, Spinner } from '../ui'
import { getShifts } from '@/lib/actions/shifts.actions'
import { getRequests } from '@/lib/actions/requests.actions'
import type { AppSession, ScheduleEvent, ShiftChangeRequest } from '@/types'
import { hasRole } from '@/lib/auth'

function getMonday(d = new Date()) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}

export default function DashboardView({ session, onNav }: { session: AppSession; onNav: (p: string) => void }) {
  const [shifts, setShifts] = useState<ScheduleEvent[]>([])
  const [requests, setRequests] = useState<ShiftChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const [s, r] = await Promise.all([
        getShifts({ week_start: getMonday() }),
        getRequests(),
      ])
      setShifts(s.data ?? [])
      setRequests(r.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Spinner />

  const todayShifts = shifts.filter(s => s.shift_date === today)
  const pendingReqs = requests.filter(r => r.status === 'pendiente')
  const myShift = shifts.find(s => s.employee_id === session.profile.id && s.shift_date === today)

  const isManager = hasRole(session.profile.role, 'manager')

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>
          Buenos días, {session.profile.full_name.split(' ')[0]} 👋
        </h2>
        <p style={{ color: C.muted, marginTop: 4, fontSize: 14 }}>
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {isManager ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard label="Turnos hoy" value={String(todayShifts.length)} icon="⏱" color={C.accent} />
            <StatCard label="Pendientes" value={String(pendingReqs.length)} sub="solicitudes" icon="🔄" color={C.yellow} />
            <StatCard label="Esta semana" value={`${shifts.reduce((a, s) => a + s.total_hours, 0).toFixed(0)}h`} sub="horas totales" icon="📊" color="#8b5cf6" />
            <StatCard label="Activos hoy" value={String(new Set(todayShifts.map(s => s.employee_id)).size)} sub="empleados" icon="👥" color={C.green} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Turnos de Hoy</h3>
                <Btn small onClick={() => onNav('shifts')}>+ Crear turno</Btn>
              </div>
              {todayShifts.length === 0 ? (
                <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No hay turnos para hoy</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {['Empleado', 'Entrada', 'Salida', 'Estado'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {todayShifts.map((s, i) => (
                      <tr key={s.id} style={{ borderBottom: i < todayShifts.length - 1 ? `1px solid ${C.border}20` : 'none' }}>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar name={s.employee?.full_name ?? '?'} size={26} />
                            <span style={{ fontSize: 13, color: C.text }}>{s.employee?.full_name ?? '—'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px', fontSize: 13, color: C.text, fontFamily: 'monospace' }}>{s.start_time}</td>
                        <td style={{ padding: '10px', fontSize: 13, color: C.text, fontFamily: 'monospace' }}>{s.end_time}</td>
                        <td style={{ padding: '10px' }}><StatusBadge status={s.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Solicitudes pendientes</h3>
                {pendingReqs.length > 0 && (
                  <span style={{ background: C.yellowDim, color: C.yellow, borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                    {pendingReqs.length}
                  </span>
                )}
              </div>
              {pendingReqs.length === 0 ? (
                <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Sin solicitudes pendientes ✓</p>
              ) : pendingReqs.slice(0, 3).map(r => (
                <div key={r.id} style={{ background: C.hi, borderRadius: 10, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                    {r.requester?.full_name ?? '—'} → {r.target?.full_name ?? '—'}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>{r.reason}</div>
                </div>
              ))}
              <Btn variant="secondary" style={{ width: '100%', marginTop: 8 }} onClick={() => onNav('requests')}>Ver todas</Btn>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard label="Turno hoy" value={myShift ? `${myShift.start_time}–${myShift.end_time}` : 'Libre'} icon="⏰" color={C.accent} />
            <StatCard label="Horas semana" value={`${shifts.filter(s => s.employee_id === session.profile.id).reduce((a, s) => a + s.total_hours, 0).toFixed(2)}h`} icon="📊" color={C.green} />
            <StatCard label="Mis solicitudes" value={String(requests.length)} sub={`${pendingReqs.length} pendiente(s)`} icon="🔄" color={C.yellow} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
            <Card>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: C.text }}>Mi semana</h3>
              {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map((day, i) => {
                const date = new Date(getMonday())
                date.setDate(date.getDate() + i)
                const dateStr = date.toISOString().split('T')[0]
                const shift = shifts.find(s => s.employee_id === session.profile.id && s.shift_date === dateStr)
                return (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', padding: '9px 12px',
                    borderRadius: 8, marginBottom: 4,
                    background: shift ? C.hi : 'transparent',
                    border: `1px solid ${shift ? C.border : 'transparent'}` }}>
                    <div style={{ width: 96, fontSize: 13, fontWeight: 600, color: shift ? C.text : C.muted }}>{day}</div>
                    {shift ? (
                      <>
                        <div style={{ flex: 1, fontSize: 13, color: C.text, fontFamily: 'monospace' }}>{shift.start_time} – {shift.end_time}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginRight: 10 }}>{shift.total_hours}h</div>
                        <StatusBadge status={shift.status} />
                      </>
                    ) : <span style={{ fontSize: 12, color: C.muted }}>Sin turno</span>}
                  </div>
                )
              })}
            </Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Card>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.text }}>Mis solicitudes</h3>
                {requests.slice(0, 3).map(r => (
                  <div key={r.id} style={{ padding: '8px 10px', background: C.hi, borderRadius: 8, marginBottom: 6, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 12, color: C.text, marginBottom: 4 }}>{r.reason.slice(0, 40)}</div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
                <Btn style={{ width: '100%', marginTop: 8 }} onClick={() => onNav('requests')}>+ Solicitar cambio</Btn>
              </Card>
              <Card style={{ background: `linear-gradient(135deg,${C.accentDim},${C.hi})` }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: C.text }}>Chat</h3>
                <p style={{ fontSize: 12, color: C.sub, margin: '0 0 12px' }}>Comunícate con tu gerente</p>
                <Btn style={{ width: '100%' }} onClick={() => onNav('chat')}>💬 Abrir chat</Btn>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
