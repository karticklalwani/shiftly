'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { C, Avatar, Btn, Spinner } from '../ui'
import {
  getConversations, getOrCreateConversation,
  getMessages, sendMessage, markMessagesRead
} from '@/lib/actions/chat.actions'
import { getEmployees } from '@/lib/actions/employees.actions'
import { createClient } from '@/lib/supabase/client'
import type { AppSession, Conversation, Message, Profile } from '@/types'
import { hasRole } from '@/lib/auth'

export default function ChatView({ session }: { session: AppSession }) {
  const isManager = hasRole(session.profile.role, 'manager')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [employees, setEmployees] = useState<Profile[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const loadConversations = useCallback(async () => {
    const { data } = await getConversations()
    setConversations(data ?? [])
    setLoadingConvs(false)
  }, [])

  const loadEmployees = useCallback(async () => {
    if (isManager) {
      const { data } = await getEmployees()
      setEmployees((data ?? []).filter(e => e.id !== session.profile.id))
    }
  }, [isManager, session.profile.id])

  useEffect(() => {
    loadConversations()
    loadEmployees()
  }, [loadConversations, loadEmployees])

  const openConversation = useCallback(async (convId: string) => {
    setActiveConvId(convId)
    setLoadingMsgs(true)
    const { data } = await getMessages(convId)
    setMessages(data ?? [])
    setLoadingMsgs(false)
    await markMessagesRead(convId)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Supabase Realtime para mensajes en tiempo real
  useEffect(() => {
    if (!activeConvId) return
    const channel = supabase
      .channel(`messages:${activeConvId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${activeConvId}`
      }, async () => {
        const { data } = await getMessages(activeConvId)
        setMessages(data ?? [])
        await markMessagesRead(activeConvId)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeConvId, supabase])

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [messages])

  const startConvWithEmployee = async (empId: string) => {
    const { conversationId, error } = await getOrCreateConversation(empId)
    if (error || !conversationId) return
    await loadConversations()
    await openConversation(conversationId)
  }

  const handleSend = async () => {
    if (!input.trim() || !activeConvId || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')
    await sendMessage(activeConvId, text)
    setSending(false)
  }

  const getOtherMember = (conv: Conversation) =>
    conv.members?.find(m => m.id !== session.profile.id)

  const activeConv = conversations.find(c => c.id === activeConvId)
  const otherMember = activeConv ? getOtherMember(activeConv) : null

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: 0, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}` }}>

      {/* Sidebar conversaciones */}
      <div style={{ width: 260, background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>
            {isManager ? 'Conversaciones' : 'Mi chat'}
          </h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {loadingConvs ? <Spinner /> : (
            <>
              {conversations.map(conv => {
                const other = getOtherMember(conv)
                if (!other) return null
                return (
                  <button key={conv.id} type="button" onClick={() => openConversation(conv.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                      background: activeConvId === conv.id ? C.accentDim : 'transparent',
                      border: activeConvId === conv.id ? `1px solid ${C.accent}30` : '1px solid transparent',
                      textAlign: 'left' }}>
                    <Avatar name={other.full_name} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other.full_name}</div>
                      <div style={{ fontSize: 11, color: C.muted, textTransform: 'capitalize' }}>{other.role}</div>
                    </div>
                  </button>
                )
              })}

              {/* Manager: iniciar conversación con empleado */}
              {isManager && employees.length > 0 && (
                <>
                  <div style={{ padding: '8px 10px 4px', fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, marginTop: 8 }}>
                    Iniciar chat con
                  </div>
                  {employees
                    .filter(e => !conversations.some(c => getOtherMember(c)?.id === e.id))
                    .map(emp => (
                      <button key={emp.id} type="button" onClick={() => startConvWithEmployee(emp.id)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                          background: 'transparent', border: `1px dashed ${C.border}`, textAlign: 'left' }}>
                        <Avatar name={emp.full_name} size={30} />
                        <div style={{ fontSize: 12, color: C.sub }}>{emp.full_name}</div>
                        <span style={{ marginLeft: 'auto', fontSize: 16, color: C.muted }}>+</span>
                      </button>
                    ))}
                </>
              )}

              {/* Empleado: botón para chatear con gerente si no hay conversación */}
              {!isManager && conversations.length === 0 && (
                <div style={{ padding: 16, textAlign: 'center' }}>
                  <div style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>No tienes conversaciones aún</div>
                  <Btn small onClick={async () => {
                    // buscar un manager de la empresa
                    const { data } = await getEmployees()
                    const manager = (data ?? []).find(e => hasRole(e.role, 'manager') && e.id !== session.profile.id)
                    if (manager) await startConvWithEmployee(manager.id)
                  }}>💬 Contactar gerente</Btn>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Panel de mensajes */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.surface }}>
        {!activeConvId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: C.muted }}>
            <div style={{ fontSize: 40 }}>💬</div>
            <div style={{ fontSize: 14 }}>Selecciona una conversación</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              {otherMember && <Avatar name={otherMember.full_name} size={36} />}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{otherMember?.full_name ?? '—'}</div>
                <div style={{ fontSize: 11, color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
                  {otherMember?.role}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loadingMsgs ? <Spinner /> : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: C.muted, marginTop: 40, fontSize: 13 }}>Aún no hay mensajes. ¡Escribe el primero!</div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_id === session.profile.id
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                      <Avatar name={msg.sender?.full_name ?? '?'} size={26} />
                      <div style={{ maxWidth: '68%' }}>
                        <div style={{
                          background: isMe ? C.accent : C.hi,
                          borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          padding: '10px 14px', fontSize: 13, color: C.text,
                          border: isMe ? 'none' : `1px solid ${C.border}`
                        }}>{msg.message}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                          {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          {isMe && <span style={{ marginLeft: 4 }}>{msg.read_at ? ' ✓✓' : ' ✓'}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Escribe un mensaje... (Enter para enviar)"
                style={{ flex: 1, background: C.hi, border: `1px solid ${C.border}`, color: C.text,
                  borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none' }}
              />
              <Btn onClick={handleSend} disabled={!input.trim() || sending} style={{ padding: '10px 18px' }}>
                {sending ? '...' : '➤'}
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
