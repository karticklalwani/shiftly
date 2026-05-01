declare module 'phoenix' {
  export class Socket {
    constructor(endPoint: string, opts?: any)
    connect(): void
    disconnect(): void
    channel(topic: string, payload?: any): Channel
  }

  export class Channel {
    join(): Push
    leave(): Push
    push(event: string, payload?: any): Push
    on(event: string, callback: (payload: any) => void): number
    off(event: string, ref?: number): void
  }

  export class Push {
    receive(status: string, callback: (response: any) => void): Push
  }
}