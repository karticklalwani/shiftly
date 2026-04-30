'use client'
import { useState } from 'react'
import { C, Card, Btn, Input, ErrorMsg } from '../ui'
import { updateCompany } from '@/lib/actions/settings.actions'
import type { AppSession } from '@/types'
import { hasRole } from '@/lib/auth'

export default function SettingsView({ session }: { session: AppSession }) {
  const isOwner = hasRole(session.profile.role, 'owner')
  const [companyName, setCompanyName] = useState(session.company.name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSaveCompany = async () => {
    if (!companyName.trim()) { setError('El nombre no puede estar vacío'); return }
    setSaving(true); setError(''); setSuccess(false)
    const r = await updateCompany({ name: companyName.trim() })
    if (r.error) { setError(r.error) } else { setSuccess(true) }
    setSaving(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>Ajustes</h2>
        <p style={{ color: C.muted, marginTop: 4, fontSize: 13 }}>Configuración de la empresa</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>

        {/* Empresa */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: C.text }}>Información de la empresa</h3>
          {error && <div style={{ marginBottom: 12 }}><ErrorMsg msg={error} /></div>}
          {success && (
            <div style={{ background: C.greenDim, border: '1px solid #065f46', borderRadius: 8, padding: '10px 14px', color: '#34d399', fontSize: 13, marginBottom: 12 }}>
              ✓ Cambios guardados correctamente
            </div>
          )}
          <Input label="Nombre de la empresa" value={companyName}
            onChange={e => { setCompanyName(e.target.value); setSuccess(false) }}
            style={{ marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={handleSaveCompany} disabled={saving || !isOwner}>
              {saving ? 'Guardando...' : '✓ Guardar cambios'}
            </Btn>
            {!isOwner && <span style={{ fontSize: 12, color: C.muted, alignSelf: 'center' }}>Solo el owner puede editar</span>}
          </div>
        </Card>

        {/* Mi perfil */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: C.text }}>Mi perfil</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: C.hi, borderRadius: 8, padding: '10px 14px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Nombre</div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{session.profile.full_name}</div>
            </div>
            <div style={{ background: C.hi, borderRadius: 8, padding: '10px 14px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Rol</div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 600, textTransform: 'capitalize' }}>{session.profile.role}</div>
            </div>
            <div style={{ background: C.hi, borderRadius: 8, padding: '10px 14px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Código de acceso</div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>#{session.profile.login_code}</div>
            </div>
            <div style={{ background: C.hi, borderRadius: 8, padding: '10px 14px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Empresa</div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{session.company.name}</div>
            </div>
          </div>
        </Card>

        {/* Info seguridad */}
        <Card style={{ borderLeft: `3px solid ${C.accent}` }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: C.text }}>ℹ️ Seguridad</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: C.sub, fontSize: 13, lineHeight: 1.8 }}>
            <li>Los datos están aislados por empresa (RLS en Supabase)</li>
            <li>El código de acceso no revela emails reales</li>
            <li>Las contraseñas se gestionan mediante Supabase Auth</li>
            <li>Para cambiar contraseña, contacta al administrador</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
