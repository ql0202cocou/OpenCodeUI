import { getAuthHeader } from './http'
import { getPtyConnectUrl } from './pty'

interface TauriPtyEvent {
  event: 'connected' | 'message' | 'disconnected' | 'error'
  data?: {
    chunk?: string
    code?: number
    reason?: string
    message?: string
  }
}

interface ConnectTauriPtyParams {
  ptyId: string
  directory?: string
  onConnected: () => void
  onMessage: (chunk: string) => void
  onDisconnected: (info: { code?: number; reason?: string }) => void
  onError: (message: string) => void
}

export interface TauriPtyConnection {
  send: (data: string) => void
  close: () => void
}

export async function connectTauriPty({
  ptyId,
  directory,
  onConnected,
  onMessage,
  onDisconnected,
  onError,
}: ConnectTauriPtyParams): Promise<TauriPtyConnection> {
  const { invoke, Channel } = await import('@tauri-apps/api/core')
  const url = getPtyConnectUrl(ptyId, directory, { includeAuthInUrl: false })
  const authHeader = getAuthHeader()['Authorization'] || null
  const onEvent = new Channel<TauriPtyEvent>()
  let closed = false

  onEvent.onmessage = msg => {
    if (closed) return

    switch (msg.event) {
      case 'connected':
        onConnected()
        break
      case 'message':
        if (msg.data?.chunk) {
          onMessage(msg.data.chunk)
        }
        break
      case 'disconnected':
        closed = true
        onDisconnected({ code: msg.data?.code, reason: msg.data?.reason })
        break
      case 'error':
        onError(msg.data?.message || 'Unknown PTY bridge error')
        break
    }
  }

  void invoke('pty_connect', {
    args: { ptyId, url, authHeader },
    onEvent,
  }).catch((error: unknown) => {
    if (closed) return
    closed = true
    const message = error instanceof Error ? error.message : String(error)
    onDisconnected({ reason: message })
  })

  return {
    send(data: string) {
      if (closed) return
      void invoke('pty_send', { args: { ptyId, data } }).catch((error: unknown) => {
        if (closed) return
        const message = error instanceof Error ? error.message : String(error)
        onError(message)
      })
    },
    close() {
      if (closed) return
      closed = true
      void invoke('pty_disconnect', { args: { ptyId } }).catch(() => {})
    },
  }
}
