'use client'
import { useFormState, useFormStatus } from 'react-dom'
import { loginWithCode } from '@/lib/actions/auth.actions'
import { C } from './ui'

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      style={{ width: '100%', background: pending ? C.accentDim : C.accent,
        color: '#fff', border: 'none', borderRadius: 10, padding: '13px',
        fontSize: 15, fontWeight: 700, cursor: pending ? 'not-allowed' : 'pointer',
        transition: 'all .2s' }}>
      {pending ? 'Verificando...' : 'Acceder →'}
    </button>
  )
}

export default function LoginForm() {
  const [state, formAction] = useFormState(loginWithCode, null)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, background: C.surface,
        border: `1px solid ${C.border}`, borderRadius: 20, padding: 40,
        boxShadow: '0 30px 80px rgba(0,0,0,.6)' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 14px' }}>⏰</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: -0.5 }}>Shiftly</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Gestión horaria empresarial</div>
        </div>

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: C.sub, fontWeight: 700,
              letterSpacing: .5, textTransform: 'uppercase', marginBottom: 6 }}>
              Código de acceso
            </label>
            <input name="code" type="text" inputMode="numeric" pattern="[0-9]*"
              placeholder="Introduce tu código" required autoFocus
              style={{ width: '100%', background: C.hi, border: `1px solid ${C.border}`,
                color: C.text, borderRadius: 8, padding: '11px 14px', fontSize: 15,
                outline: 'none', boxSizing: 'border-box', letterSpacing: 2,
                textAlign: 'center', fontWeight: 700 }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: C.sub, fontWeight: 700,
              letterSpacing: .5, textTransform: 'uppercase', marginBottom: 6 }}>
              Contraseña
            </label>
            <input name="password" type="password" placeholder="••••••••" required
              style={{ width: '100%', background: C.hi, border: `1px solid ${C.border}`,
                color: C.text, borderRadius: 8, padding: '11px 14px', fontSize: 14,
                outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {state?.error && (
            <div style={{ background: C.redDim, border: '1px solid #991b1b', borderRadius: 8,
              padding: '10px 14px', color: '#f87171', fontSize: 13 }}>
              ⚠️ {state.error}
            </div>
          )}

          <SubmitBtn />
        </form>
      </div>
    </div>
  )
}
