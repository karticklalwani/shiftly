'use client'
import { useState, useEffect, useCallback } from 'react'
import { C, Card, Btn, Modal, Input, Select, Avatar, StatusBadge, Spinner, ErrorMsg } from '../ui'
import { getRequests, createRequest, reviewRequest } from '@/lib/actions/requests.actions'
import { getShifts } from '@/lib/actions/shifts.actions'
import { getEmployees } from '@/lib/actions/employees.actions'
import type { AppSession, ShiftChangeRequest, ScheduleEvent, Profile } from '@/types'
import { hasRole } from '@/lib/auth'

const REASONS = [
  { value: 'medico',     label: 'Cita médica' },
  { value: 'familiar',   label: 'Asunto familiar' },
  { value: 'personal',   label: 'Asunto personal' },
  { value: 'transporte', label: 'Problemas de transporte' },
  { value: 'otro',       label: 'Otro' },
]

export default function RequestsView({ session }: { session: AppSession }) {
  const isManager = hasRole(session.profile.role, 'manager')
  const [requests, setRequests] = useState<ShiftChangeRequest[]>([])
  const [myShifts, setMyShifts] = useState<ScheduleEvent[]>([])
  const [employees, setEmployees] = useState<Profile[]>([])
  const [targetShifts, setTargetShifts] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [reviewId, setReviewId] = useState('')
  const [reviewResponse, setReviewResponse] = useState('')
  const [form, setForm] = useState({
    target_employee_id: '',
    current_shift_id: '',
    requested_shift_id: '',
    requested_change_date: '',
    reason: 'personal',
    additional_message: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    const [r, s] = await Promise.all([
      getRequests(),
      getShifts(),
    ])
    setRequests(r.data ?? [])
    setMyShifts((s.data ?? []).filter(sh => sh.employee_id === session.profile.id))
    setLoading(false)
  }, [session.profile.id])

  useEffect(() => { load() }, [load])

  // Cargar empleados y sus turnos cuando se abre modal (solo empleados)
  const openModal = async () => {
    setError('')
    setForm({ target_employee_id: '', current_shift_id: '', requested_shift_id: '', requested_change_date: '', reason: 'personal', additional_message: '' })
    if (!isManager) {
      const e = await getEmployees()
      setEmployees((e.data ?? []).filter(emp => emp.id !== session.profile.id))
    }
    setShowModal(true)
  }

  // Cuando cambia el empleado destino, carga sus turnos
  const handleTargetChange = async (targetId: string) => {
    setForm(f => ({ ...f, target_employee_id: targetId, requested_shift_id: '' }))
    if (targetId) {
      const s = await getShifts({ employee_id: targetId })
      setTargetShifts(s.data ?? [])
    } else {
      setTargetShifts([])
    }
  }

  const handleSave = async () => {
    const { target_employee_id, current_shift_id, requested_shift_id, requested_change_date, reason } = form
    if (!target_employee_id || !current_shift_id || !requested_shift_id || !requested_change_date || !reason) {
      setError('Todos los campos marcados son obligatorios'); return
    }
    setSaving(true); setError('')
    const result = await createRequest({ ...form, additional_message: form.additional_message || '' })
    if (result.error) { setError(result.error); setSaving(false); return }
    setShowModal(false); await load(); setSaving(false)
  }

  const handleReview = async (id: string, action: 'aprobada' | 'rechazada') => {
    await reviewRequest(id, action, reviewResponse || undefined)
    setReviewId(''); setReviewResponse('')
    await load()
  }

  const formatShift = (s: ScheduleEvent) =>
    `${new Date(s.shift_date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} ${s.start_time}–${s.end_time}`

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>
            {isManager ? 'Solicitudes de Cambio' : 'Mis Solicitudes'}
          </h2>
          <p style={{ color: C.muted, marginTop: 4, fontSize: 13 }}>{requests.length} solicitudes</p>
        </div>
        {!isManager && <Btn onClick={openModal}>+ Nueva solicitud</Btn>}
      </div>

      {loading ? <Spinner /> : requests.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
          <div style={{ color: C.muted, fontSize: 14 }}>No hay solicitudes</div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(r => {
            const borderColor = r.status === 'aprobada' ? C.green : r.status === 'rechazada' ? C.red : C.yellow
            const isReviewing = reviewId === r.id
            return (
              <Card key={r.id} style={{ borderLeft: `3px solid ${borderColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={r.requester?.full_name ?? '?'} size={36} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                        {r.requester?.full_name ?? '—'}
                        <span style={{ color: C.muted, fontWeight: 400, margin: '0 8px' }}>quiere cambiar con</span>
                        {r.target?.full_name ?? '—'}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        {new Date(r.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div style={{ background: C.hi, borderRadius: 8, padding: 10, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase' }}>Turno actual</div>
                    <div style={{ fontSize: 12, color: C.text, fontFamily: 'monospace' }}>
                      {r.current_shift ? formatShift(r.current_shift as ScheduleEvent) : r.current_shift_id}
                    </div>
                  </div>
                  <div style={{ background: C.hi, borderRadius: 8, padding: 10, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase' }}>Turno solicitado</div>
                    <div style={{ fontSize: 12, color: C.text, fontFamily: 'monospace' }}>
                      {r.requested_shift ? formatShift(r.requested_shift as ScheduleEvent) : r.requested_shift_id}
                    </div>
                  </div>
                </div>

                <div style={{ background: C.hi, borderRadius: 8, padding: '8px 12px', marginBottom: isManager && r.status === 'pendiente' ? 12 : 0, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Motivo: </span>
                  <span style={{ fontSize: 12, color: C.sub }}>{r.reason}</span>
                  {r.additional_message && <span style={{ fontSize: 12, color: C.muted }}> · {r.additional_message}</span>}
                </div>

                {r.manager_response && (
                  <div style={{ background: r.status === 'aprobada' ? C.greenDim : C.redDim, borderRadius: 8, padding: '8px 12px', marginTop: 8, border: `1px solid ${borderColor}40` }}>
                    <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Respuesta gerente: </span>
                    <span style={{ fontSize: 12, color: C.text }}>{r.manager_response}</span>
                  </div>
                )}

                {isManager && r.status === 'pendiente' && (
                  <div style={{ marginTop: 12 }}>
                    {isReviewing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Input label="Respuesta (opcional)" value={reviewResponse} onChange={e => setReviewResponse(e.target.value)} placeholder="Escribe un mensaje para el empleado..." />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Btn variant="success" onClick={() => handleReview(r.id, 'aprobada')}>✓ Confirmar aprobación</Btn>
                          <Btn variant="danger" onClick={() => handleReview(r.id, 'rechazada')}>✗ Confirmar rechazo</Btn>
                          <Btn variant="ghost" onClick={() => setReviewId('')}>Cancelar</Btn>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn variant="success" onClick={() => { setReviewId(r.id); setReviewResponse('') }}>✓ Aprobar</Btn>
                        <Btn variant="danger" onClick={() => { setReviewId(r.id); setReviewResponse('') }}>✗ Rechazar</Btn>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal nueva solicitud */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Solicitar Cambio de Turno" width={540}>
        {error && <div style={{ marginBottom: 14 }}><ErrorMsg msg={error} /></div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select label="Compañero con quien cambiar *" value={form.target_employee_id}
            onChange={e => handleTargetChange(e.target.value)}
            options={[{ value: '', label: 'Seleccionar compañero...' }, ...employees.map(e => ({ value: e.id, label: e.full_name }))]} />

          <Select label="Mi turno a ceder *" value={form.current_shift_id}
            onChange={e => setForm(f => ({ ...f, current_shift_id: e.target.value }))}
            options={[{ value: '', label: 'Seleccionar mi turno...' }, ...myShifts.map(s => ({ value: s.id, label: formatShift(s) }))]} />

          {form.target_employee_id && (
            <Select label="Turno que quiero recibir *" value={form.requested_shift_id}
              onChange={e => setForm(f => ({ ...f, requested_shift_id: e.target.value }))}
              options={[{ value: '', label: 'Seleccionar turno del compañero...' }, ...targetShifts.map(s => ({ value: s.id, label: formatShift(s) }))]} />
          )}

          <Input label="Fecha del cambio *" type="date" value={form.requested_change_date}
            onChange={e => setForm(f => ({ ...f, requested_change_date: e.target.value }))} />

          <Select label="Motivo *" value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            options={REASONS} />

          <Input label="Comentario adicional" value={form.additional_message}
            onChange={e => setForm(f => ({ ...f, additional_message: e.target.value }))}
            placeholder="Información adicional (opcional)" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
          <Btn onClick={handleSave} disabled={saving}>{saving ? 'Enviando...' : '📨 Enviar solicitud'}</Btn>
        </div>
      </Modal>
    </div>
  )
}
