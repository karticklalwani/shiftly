'use client'
import React, { CSSProperties } from 'react'

export const C = {
  bg: '#0a0d14', surface: '#111827', hi: '#1a2235',
  border: '#1e2d45', accent: '#3b82f6', accentDim: '#1d3a6b',
  green: '#10b981', greenDim: '#064e3b',
  yellow: '#f59e0b', yellowDim: '#78350f',
  red: '#ef4444', redDim: '#7f1d1d',
  text: '#f1f5f9', muted: '#64748b', sub: '#94a3b8',
} as const

export const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  activo:     { bg: '#064e3b', color: '#34d399', dot: '#10b981' },
  completado: { bg: '#1e3a5f', color: '#60a5fa', dot: '#3b82f6' },
  pendiente:  { bg: '#78350f', color: '#fbbf24', dot: '#f59e0b' },
  cancelado:  { bg: '#7f1d1d', color: '#f87171', dot: '#ef4444' },
  aprobada:   { bg: '#064e3b', color: '#34d399', dot: '#10b981' },
  rechazada:  { bg: '#7f1d1d', color: '#f87171', dot: '#ef4444' },
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const p = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444']
  const bg = p[(name || '?').charCodeAt(0) % p.length]
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pendiente
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 20,
      fontSize: 10, fontWeight: 700, letterSpacing: .5, textTransform: 'uppercase',
      display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />{status}
    </span>
  )
}

export function Card({ children, style, onClick }: { children: React.ReactNode; style?: CSSProperties; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 20, cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color .2s', ...style }}>
      {children}
    </div>
  )
}

type V = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
export function Btn({ children, variant = 'primary', onClick, style, small = false, disabled = false, type = 'button' }: {
  children: React.ReactNode; variant?: V; onClick?: () => void;
  style?: CSSProperties; small?: boolean; disabled?: boolean; type?: 'button' | 'submit'
}) {
  const vs: Record<V, CSSProperties> = {
    primary:   { background: C.accent,   color: '#fff',    border: 'none' },
    secondary: { background: 'transparent', color: C.sub,  border: `1px solid ${C.border}` },
    danger:    { background: C.redDim,   color: '#f87171', border: '1px solid #991b1b' },
    success:   { background: C.greenDim, color: '#34d399', border: '1px solid #065f46' },
    ghost:     { background: 'transparent', color: C.sub,  border: 'none' },
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      style={{ ...vs[variant], padding: small ? '5px 12px' : '8px 18px', borderRadius: 8,
        fontWeight: 600, fontSize: small ? 12 : 13, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6, opacity: disabled ? .5 : 1,
        transition: 'opacity .15s', ...style }}>
      {children}
    </button>
  )
}

export function Input({ label, value, onChange, type = 'text', placeholder, style, required }: {
  label?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; style?: CSSProperties; required?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {label && <label style={{ fontSize: 11, color: C.sub, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>{label}{required && ' *'}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        style={{ background: C.hi, border: `1px solid ${C.border}`, color: C.text,
          borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none',
          width: '100%', boxSizing: 'border-box' }} />
    </div>
  )
}

export function Select({ label, value, onChange, options, style, required }: {
  label?: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[]; style?: CSSProperties; required?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {label && <label style={{ fontSize: 11, color: C.sub, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>{label}{required && ' *'}</label>}
      <select value={value} onChange={onChange} required={required}
        style={{ background: C.hi, border: `1px solid ${C.border}`, color: C.text,
          borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none',
          width: '100%', cursor: 'pointer' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function Modal({ open, onClose, title, children, width = 520 }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number
}) {
  if (!open) return null
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
        width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,.6)' }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h3>
          <button type="button" onClick={onClose}
            style={{ background: 'none', border: 'none', color: C.muted, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  )
}

export function StatCard({ label, value, sub, icon, color = '#3b82f6' }: {
  label: string; value: string; sub?: string; icon: string; color?: string
}) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: .5, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>{sub}</div>}
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: color + '22',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
      </div>
    </Card>
  )
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`,
        borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div style={{ background: C.redDim, border: '1px solid #991b1b', borderRadius: 8,
      padding: '10px 14px', color: '#f87171', fontSize: 13 }}>⚠️ {msg}</div>
  )
}
