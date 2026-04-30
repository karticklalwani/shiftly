'use client'
import { useState, useEffect, useCallback } from 'react'
import { C, Card, Btn, Modal, Input, Select, Avatar, Spinner, ErrorMsg } from '../ui'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/lib/actions/employees.actions'
import { getDepartments, getStores } from '@/lib/actions/settings.actions'
import type { AppSession, Profile, Department, Store, Role } from '@/types'
import { hasRole } from '@/lib/auth'

const ROLES: Role[] = ['employee', 'manager', 'admin', 'owner']

export default function EmployeesView({ session }: { session: AppSession }) {
  const canEdit = hasRole(session.profile.role, 'admin')
  const [employees, setEmployees] = useState<Profile[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', login_code: '', password: '', role: 'employee' as Role, department_id: '', store_id: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const [e, d, s] = await Promise.all([getEmployees(), getDepartments(), getStores()])
    setEmployees(e.data ?? [])
    setDepartments(d.data ?? [])
    setStores(s.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setForm({ full_name: '', login_code: '', password: '', role: 'employee', department_id: '', store_id: '' }); setError(''); setShowModal(true) }
  const openEdit = (emp: Profile) => { setEditing(emp); setForm({ full_name: emp.full_name, login_code: emp.login_code, password: '', role: emp.role, department_id: emp.department_id ?? '', store_id: emp.store_id ?? '' }); setError(''); setShowModal(true) }

  const handleSave = async () => {
    if (!form.full_name || !form.login_code) { setError('Nombre y código son obligatorios'); return }
    if (!editing && !form.password) { setError('La contraseña es obligatoria para nuevos empleados'); return }
    setSaving(true); setError('')
    const payload = { ...form, department_id: form.department_id || null, store_id: form.store_id || null }
    const result = editing
      ? await updateEmployee(editing.id, { full_name: payload.full_name, role: payload.role, department_id: payload.department_id, store_id: payload.store_id })
      : await createEmployee(payload)
    if (result.error) { setError(result.error); setSaving(false); return }
    setShowModal(false); await load(); setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este empleado? Esta acción no se puede deshacer.')) return
    const r = await deleteEmployee(id)
    if (r.error) alert(r.error)
    else await load()
  }

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>Empleados</h2>
          <p style={{ color: C.muted, marginTop: 4, fontSize: 13 }}>{employees.length} empleados en la empresa</p>
        </div>
        {canEdit && <Btn onClick={openCreate}>+ Añadir empleado</Btn>}
      </div>

      {loading ? <Spinner /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {employees.map(emp => (
            <Card key={emp.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Avatar name={emp.full_name} size={44} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{emp.full_name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2, textTransform: 'capitalize' }}>
                    {emp.role} · Código: {emp.login_code}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <div style={{ background: C.hi, borderRadius: 8, padding: '8px 10px', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2, textTransform: 'uppercase' }}>Rol</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, textTransform: 'capitalize' }}>{emp.role}</div>
                </div>
                <div style={{ background: C.hi, borderRadius: 8, padding: '8px 10px', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2, textTransform: 'uppercase' }}>Auth</div>
                  <div style={{ fontSize: 12, color: emp.user_id ? C.green : C.yellow }}>{emp.user_id ? '✓ Activo' : '⚠ Sin cuenta'}</div>
                </div>
              </div>

              {canEdit && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn small variant="secondary" style={{ flex: 1 }} onClick={() => openEdit(emp)}>✏️ Editar</Btn>
                  <Btn small variant="danger" onClick={() => handleDelete(emp.id)}>🗑</Btn>
                </div>
              )}
            </Card>
          ))}
          {employees.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: C.muted, padding: 40 }}>
              No hay empleados. Crea el primero.
            </div>
          )}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Empleado' : 'Nuevo Empleado'}>
        {error && <ErrorMsg msg={error} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: error ? 12 : 0 }}>
          <Input label="Nombre completo *" value={form.full_name} onChange={e => f('full_name', e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Código de acceso *" value={form.login_code} onChange={e => f('login_code', e.target.value)} placeholder="Ej: 936" disabled={!!editing} />
            {!editing && <Input label="Contraseña *" type="password" value={form.password} onChange={e => f('password', e.target.value)} />}
          </div>
          <Select label="Rol" value={form.role} onChange={e => f('role', e.target.value)}
            options={ROLES.filter(r => hasRole(session.profile.role, r)).map(r => ({ value: r, label: r }))} />
          <Select label="Departamento" value={form.department_id} onChange={e => f('department_id', e.target.value)}
            options={[{ value: '', label: 'Sin departamento' }, ...departments.map(d => ({ value: d.id, label: d.name }))]} />
          {stores.length > 0 && (
            <Select label="Tienda" value={form.store_id} onChange={e => f('store_id', e.target.value)}
              options={[{ value: '', label: 'Sin tienda' }, ...stores.map(s => ({ value: s.id, label: s.name }))]} />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
          <Btn onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : '✓ Guardar'}</Btn>
        </div>
      </Modal>
    </div>
  )
}
