import { Socket } from "phoenix"

let socket: Socket | null = null

export function getPhoenixSocket(
  userId: string,
  companyId: string
) {
  if (!socket) {
    socket = new Socket("http://localhost:4000/socket", {
      params: {
        user_id: userId,
        company_id: companyId
      }
    })

    socket.connect()
  }

  return socket
}