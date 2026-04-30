'use client'
import { useState, useEffect, useCallback } from 'react'
import { C, Card, Btn, Modal, Input, Select, StatusBadge, Avatar, Spinner, ErrorMsg } from '../ui'
import { getShifts, createShift, updateShift, deleteShift } from '@/lib/actions/shifts.actions'
import { getEmployees } from '@/lib/actions/employees.actions'
import { getDepartments, getStores } from '@/lib/actions/settings.actions'
import type { AppSession, ScheduleEvent, Profile, Department, Store } from '@/types'
import { hasRole } from '@/lib/auth'

const DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const STATUS_OPTIONS = ['activo','pendiente','completado','cancelado']

function getMonday(offset = 0) {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

const EMPTY_FORM = {
  employee_id: '', department_id: '', store_id: '', title: 'Turno',
  shift_date: new Date().toISOString().split('T')[0],
  start_time: '09:00', end_time: '17:00', break_minutes: 15, lunch_minutes: 60,
  notes: '', status: 'activo' as const
}

export default function ShiftsView({ session }: { session: AppSession }) {
  const isManager = hasRole(session.profile.role, 'manager')
  const [weekOffset, setWeekOffset] = useState(0)
  const [shifts, setShifts] = useState<ScheduleEvent[]>([])
  const [employees, setEmployees] = useState<Profile[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ScheduleEvent | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filterEmp, setFilterEmp] = useState('')
  const [filterDept, setFilterDept] = useState('')

  const weekStart = getMonday(weekOffset)
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const loadData = useCallback(async () => {
    setLoading(true)
    const [s, e, d, st] = await Promise.all([
      getShifts({ week_start: weekStart, employee_id: filterEmp || undefined, department_id: filterDept || undefined }),
      isManager ? getEmployees() : Promise.resolve({ data: [] }),
      getDepartments(),
      getStores(),
    ])
    setShifts(s.data ?? [])
    setEmployees((e.data ?? []) as Profile[])
    setDepartments(d.data ?? [])
    setStores(st.data ?? [])
    setLoading(false)
  }, [weekStart, filterEmp, filterDept, isManager])

  useEffect(() => { loadData() }, [loadData])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (s: ScheduleEvent) => {
    setEditing(s)
    setForm({
      employee_id: s.employee_id, department_id: s.department_id ?? '',
      store_id: s.store_id ?? '', title: s.title,
      shift_date: s.shift_date, start_time: s.start_time, end_time: s.end_time,
      break_minutes: s.break_minutes, lunch_minutes: s.lunch_minutes,
      notes: s.notes, status: s.status,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.employee_id || !form.shift_date) { setError('Empleado y fecha son obligatorios'); return }
    setSaving(true); setError('')
    const payload = {
      ...form,
      department_id: form.department_id || null,
      store_id: form.store_id || null,
    }
    const result = editing
      ? await updateShift(editing.id, payload)
      : await createShift(payload)
    if (result.error) { setError(result.error); setSaving(false); return }
    setShowModal(false)
    await loadData()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este turno?')) return
    await deleteShift(id)
    await loadData()
  }

  const f = (v: string | number, k: string) => setForm(p => ({ ...p, [k]: v }))

  // Empleados que se muestran en la grid
  const displayEmployees = isManager
    ? (filterEmp ? employees.filter(e => e.id === filterEmp) : employees)
    : [{ id: session.profile.id, full_name: session.profile.full_name } as Profile]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>
            {isManager ? 'Gestión de Turnos' : 'Mi Horario'}
          </h2>
          <p style={{ color: C.muted, marginTop: 4, fontSize: 13 }}>
            Semana del {new Date(weekStart).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" onClick={() => setWeekOffset(w => w - 1)}>← Anterior</Btn>
          <Btn variant="secondary" onClick={() => setWeekOffset(0)}>Hoy</Btn>
          <Btn variant="secondary" onClick={() => setWeekOffset(w => w + 1)}>Siguiente →</Btn>
          {isManager && <Btn onClick={openCreate}>+ Crear turno</Btn>}
        </div>
      </div>

      {/* Filtros */}
      {isManager && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <Select label="Empleado" value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
              options={[{ value: '', label: 'Todos' }, ...employees.map(e => ({ value: e.id, label: e.full_name }))]}
              style={{ minWidth: 180 }} />
            <Select label="Departamento" value={filterDept} onChange={e => setFilterDept(e.target.value)}
              options={[{ value: '', label: 'Todos' }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
              style={{ minWidth: 180 }} />
            <Btn variant="ghost" onClick={() => { setFilterEmp(''); setFilterDept('') }}>Limpiar</Btn>
          </div>
        </Card>
      )}

      {loading ? <Spinner /> : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <thead>
                <tr style={{ background: C.hi }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: C.muted, fontWeight: 700, width: 160, borderBottom: `1px solid ${C.border}` }}>EMPLEADO</th>
                  {weekDates.map((d, i) => (
                    <th key={d} style={{ padding: '10px 6px', textAlign: 'center', fontSize: 11, color: d === new Date().toISOString().split('T')[0] ? C.accent : C.muted, fontWeight: 700, borderBottom: `1px solid ${C.border}`, minWidth: 100 }}>
                      <div>{DAYS_ES[i === 6 ? 0 : i + 1]}</div>
                      <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2 }}>{new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</div>
                    </th>
                  ))}
                  {isManager && <th style={{ width: 50, borderBottom: `1px solid ${C.border}` }} />}
                </tr>
              </thead>
              <tbody>
                {displayEmployees.map((emp, ei) => {
                  const empShifts = shifts.filter(s => s.employee_id === emp.id)
                  return (
                    <tr key={emp.id} style={{ borderBottom: ei < displayEmployees.length - 1 ? `1px solid ${C.border}20` : 'none' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={emp.full_name} size={28} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{emp.full_name}</div>
                            <div style={{ fontSize: 10, color: C.muted }}>{empShifts.reduce((a, s) => a + s.total_hours, 0).toFixed(1)}h / sem</div>
                          </div>
                        </div>
                      </td>
                      {weekDates.map(date => {
                        const shift = empShifts.find(s => s.shift_date === date)
                        return (
                          <td key={date} style={{ padding: 6, textAlign: 'center', verticalAlign: 'middle' }}>
                            {shift ? (
                              <div onClick={() => isManager && openEdit(shift)}
                                style={{ background: C.accentDim, borderRadius: 8, padding: '6px 4px',
                                  border: `1px solid ${C.accent}40`, cursor: isManager ? 'pointer' : 'default' }}>
                                <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.accent, fontWeight: 700 }}>{shift.start_time}</div>
                                <div style={{ fontSize: 9, color: C.muted }}>–</div>
                                <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.accent, fontWeight: 700 }}>{shift.end_time}</div>
                                <div style={{ marginTop: 3 }}><StatusBadge status={shift.status} /></div>
                                {isManager && (
                                  <button type="button" onClick={e => { e.stopPropagation(); handleDelete(shift.id) }}
                                    style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 10, marginTop: 3 }}>🗑</button>
                                )}
                              </div>
                            ) : (
                              <div style={{ height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.border }}>
                                {isManager ? (
                                  <button type="button" onClick={() => { setForm(f => ({ ...f, employee_id: emp.id, shift_date: date })); setEditing(null); setShowModal(true) }}
                                    style={{ background: 'none', border: `1px dashed ${C.border}`, borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: C.muted, fontSize: 16 }}>+</button>
                                ) : '—'}
                              </div>
                            )}
                          </td>
                        )
                      })}
                      {isManager && <td />}
                    </tr>
                  )
                })}
                {displayEmployees.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: C.muted }}>No hay empleados que mostrar</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal crear/editar */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Turno' : 'Crear Turno'} width={560}>
        {error && <ErrorMsg msg={error} />}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: error ? 12 : 0 }}>
          {isManager && (
            <Select label="Empleado *" value={form.employee_id} onChange={e => f(e.target.value, 'employee_id')}
              options={[{ value: '', label: 'Seleccionar...' }, ...employees.map(e => ({ value: e.id, label: e.full_name }))]}
              style={{ gridColumn: 'span 2' }} />
          )}
          <Input label="Título" value={form.title} onChange={e => f(e.target.value, 'title')} />
          <Input label="Fecha *" type="date" value={form.shift_date} onChange={e => f(e.target.value, 'shift_date')} />
          <Input label="Hora entrada" type="time" value={form.start_time} onChange={e => f(e.target.value, 'start_time')} />
          <Input label="Hora salida" type="time" value={form.end_time} onChange={e => f(e.target.value, 'end_time')} />
          <Input label="Descanso (min)" type="number" value={String(form.break_minutes)} onChange={e => f(Number(e.target.value), 'break_minutes')} />
          <Input label="Almuerzo (min)" type="number" value={String(form.lunch_minutes)} onChange={e => f(Number(e.target.value), 'lunch_minutes')} />
          <Select label="Departamento" value={form.department_id} onChange={e => f(e.target.value, 'department_id')}
            options={[{ value: '', label: 'Sin departamento' }, ...departments.map(d => ({ value: d.id, label: d.name }))]} />
          <Select label="Estado" value={form.status} onChange={e => f(e.target.value, 'status')}
            options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))} />
          <Input label="Notas" value={form.notes} onChange={e => f(e.target.value, 'notes')}
            placeholder="Opcional..." style={{ gridColumn: 'span 2' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
          <Btn onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : '✓ Guardar'}</Btn>
        </div>
      </Modal>
    </div>
  )
}
