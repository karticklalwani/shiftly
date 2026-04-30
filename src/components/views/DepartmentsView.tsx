'use client'
import { useState, useEffect, useCallback } from 'react'
import { C, Card, Btn, Modal, Input, Select, Spinner, ErrorMsg } from '../ui'
import { getDepartments, createDepartment, deleteDepartment, getStores } from '@/lib/actions/settings.actions'
import type { AppSession, Department, Store } from '@/types'

export default function DepartmentsView({ session }: { session: AppSession }) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', store_id: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const [d, s] = await Promise.all([getDepartments(), getStores()])
    setDepartments(d.data ?? [])
    setStores(s.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError('')
    const r = await createDepartment(form.name.trim(), form.store_id || null)
    if (r.error) { setError(r.error); setSaving(false); return }
    setShowModal(false); setForm({ name: '', store_id: '' }); await load(); setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este departamento?')) return
    await deleteDepartment(id)
    await load()
  }

  const COLORS_PALETTE = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ec4899','#ef4444','#06b6d4','#84cc16']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>Departamentos</h2>
          <p style={{ color: C.muted, marginTop: 4, fontSize: 13 }}>{departments.length} departamentos</p>
        </div>
        <Btn onClick={() => { setError(''); setForm({ name: '', store_id: '' }); setShowModal(true) }}>+ Nuevo departamento</Btn>
      </div>

      {loading ? <Spinner /> : departments.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏢</div>
          <div style={{ color: C.muted, fontSize: 14 }}>No hay departamentos. Crea el primero.</div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
          {departments.map((d, i) => {
            const color = COLORS_PALETTE[i % COLORS_PALETTE.length]
            const store = stores.find(s => s.id === d.store_id)
            return (
              <Card key={d.id} style={{ borderTop: `3px solid ${color}` }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>🏢</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{d.name}</div>
                {store && <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>🏪 {store.name}</div>}
                {!store && <div style={{ marginBottom: 12 }} />}
                <Btn small variant="danger" onClick={() => handleDelete(d.id)}>🗑 Eliminar</Btn>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Departamento" width={400}>
        {error && <div style={{ marginBottom: 12 }}><ErrorMsg msg={error} /></div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Tecnología" />
          {stores.length > 0 && (
            <Select label="Tienda (opcional)" value={form.store_id} onChange={e => setForm(f => ({ ...f, store_id: e.target.value }))}
              options={[{ value: '', label: 'Sin tienda asignada' }, ...stores.map(s => ({ value: s.id, label: s.name }))]} />
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
