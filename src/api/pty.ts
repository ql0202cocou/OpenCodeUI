// ============================================
// PTY API - 终端管理
// ============================================

import { getSDKClient, unwrap } from './sdk'
import { getApiBaseUrl, buildQueryString } from './http'
import { formatPathForApi } from '../utils/directoryUtils'
import { serverStore } from '../store/serverStore'
import type { Pty, PtyCreateParams, PtyUpdateParams } from '../types/api/pty'

type LegacyPty = Pty & { running?: boolean; status?: Pty['status'] }
interface PtyConnectUrlOptions {
  includeAuthInUrl?: boolean
}

function normalizePty(pty: LegacyPty): Pty {
  if (pty.status) return pty as Pty
  return {
    ...pty,
    status: pty.running ? 'running' : 'exited',
  } as Pty
}

/**
 * 获取所有 PTY 会话列表
 */
export async function listPtySessions(directory?: string): Promise<Pty[]> {
  const sdk = getSDKClient()
  return unwrap(await sdk.pty.list({ directory: formatPathForApi(directory) })).map(pty => normalizePty(pty as LegacyPty))
}

/**
 * 创建新的 PTY 会话
 */
export async function createPtySession(params: PtyCreateParams, directory?: string): Promise<Pty> {
  const sdk = getSDKClient()
  return normalizePty(unwrap(await sdk.pty.create({ directory: formatPathForApi(directory), ...params })) as LegacyPty)
}

/**
 * 获取单个 PTY 会话信息
 */
export async function getPtySession(ptyId: string, directory?: string): Promise<Pty> {
  const sdk = getSDKClient()
  return normalizePty(unwrap(await sdk.pty.get({ ptyID: ptyId, directory: formatPathForApi(directory) })) as LegacyPty)
}

/**
 * 更新 PTY 会话
 */
export async function updatePtySession(ptyId: string, params: PtyUpdateParams, directory?: string): Promise<Pty> {
  const sdk = getSDKClient()
  return normalizePty(
    unwrap(await sdk.pty.update({ ptyID: ptyId, directory: formatPathForApi(directory), ...params })) as LegacyPty,
  )
}

/**
 * 删除 PTY 会话
 */
export async function removePtySession(ptyId: string, directory?: string): Promise<boolean> {
  const sdk = getSDKClient()
  unwrap(await sdk.pty.remove({ ptyID: ptyId, directory: formatPathForApi(directory) }))
  return true
}

/**
 * 获取 PTY 连接 WebSocket URL
 *
 * WebSocket 不支持自定义 header，认证通过 URL userinfo 传递
 * 这部分必须手动拼，SDK 不处理 WebSocket
 */
export function getPtyConnectUrl(ptyId: string, directory?: string, options?: PtyConnectUrlOptions): string {
  const httpBase = getApiBaseUrl()
  const wsBase = httpBase.replace(/^http/, 'ws')
  const includeAuthInUrl = options?.includeAuthInUrl ?? true

  const auth = serverStore.getActiveAuth()
  let wsUrl: string
  if (includeAuthInUrl && auth?.password) {
    const creds = `${encodeURIComponent(auth.username)}:${encodeURIComponent(auth.password)}@`
    wsUrl = wsBase.replace('://', `://${creds}`)
  } else {
    wsUrl = wsBase
  }

  const formatted = formatPathForApi(directory)
  const queryString = buildQueryString({ directory: formatted })

  return `${wsUrl}/pty/${ptyId}/connect${queryString}`
}
