import { Socket, Channel } from 'phoenix'

let socket: Socket | null = null

export function createRealtimeSocket(userId: string, companyId: string) {
  if (socket) return socket

  socket = new Socket('ws://localhost:4000/socket', {
    params: {
      user_id: userId,
      company_id: companyId,
    },
  })

  socket.connect()

  return socket
}

export function joinConversationChannel(
  conversationId: string,
  userId: string,
  companyId: string
): Channel {
  const socket = createRealtimeSocket(userId, companyId)

  const channel = socket.channel(`chat:${conversationId}`, {
    user_id: userId,
    company_id: companyId,
  })

  channel.join()
    .receive('ok', (resp) => {
      console.log('Phoenix joined:', resp)
    })
    .receive('error', (resp) => {
      console.error('Phoenix join error:', resp)
    })

  return channel
}