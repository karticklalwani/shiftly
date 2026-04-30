'use client'
import { useState, useEffect, useCallback } from 'react'
import { C, Card, Btn, Modal, Input, Spinner, ErrorMsg } from '../ui'
import { getStores, createStore, deleteStore } from '@/lib/actions/settings.actions'
import type { AppSession, Store } from '@/types'

export default function StoresView({ session }: { session: AppSession }) {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await getStores()
    setStores(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError('')
    const r = await createStore(name.trim())
    if (r.error) { setError(r.error); setSaving(false); return }
    setShowModal(false); setName(''); await load(); setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tienda?')) return
    await deleteStore(id)
    await load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>Tiendas</h2>
          <p style={{ color: C.muted, marginTop: 4, fontSize: 13 }}>{stores.length} tiendas registradas</p>
        </div>
        <Btn onClick={() => { setError(''); setName(''); setShowModal(true) }}>+ Nueva tienda</Btn>
      </div>

      {loading ? <Spinner /> : stores.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏪</div>
          <div style={{ color: C.muted, fontSize: 14 }}>No hay tiendas. Crea la primera.</div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
          {stores.map(s => (
            <Card key={s.id} style={{ borderTop: '3px solid #3b82f6' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🏪</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>
                {new Date(s.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <Btn small variant="danger" onClick={() => handleDelete(s.id)}>🗑 Eliminar</Btn>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Tienda" width={380}>
        {error && <div style={{ marginBottom: 12 }}><ErrorMsg msg={error} /></div>}
        <Input label="Nombre de la tienda *" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Tienda Centro" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
          <Btn onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : '✓ Guardar'}</Btn>
        </div>
      </Modal>
    </div>
  )
}
