import { getPhoenixSocket } from './socket'

export function joinChat(
  conversationId: string,
  userId: string,
  companyId: string
) {
  const socket = getPhoenixSocket(userId, companyId)

  const channel = socket.channel(`chat:${conversationId}`, {
    user_id: userId,
    company_id: companyId,
  })

  channel
    .join()
    .receive('ok', () => {
      console.log('connected to chat')
    })
    .receive('error', (err: unknown) => {
      console.error('join error', err)
    })

  return channel
}