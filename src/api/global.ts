// ============================================
// Global API - 全局管理
// ============================================

import { getSDKClient, unwrap } from './sdk'

export interface HealthInfo {
  healthy: boolean
  version: string
}

/**
 * 获取服务器健康状态
 */
export async function getHealth(): Promise<HealthInfo> {
  const sdk = getSDKClient()
  return unwrap(await sdk.global.health()) as HealthInfo
}

/**
 * 释放所有资源
 */
export async function disposeGlobal(): Promise<boolean> {
  const sdk = getSDKClient()
  unwrap(await sdk.global.dispose())
  return true
}

/**
 * 释放当前实例
 * 注意：SDK 没有 /instance/dispose 端点，用 global.dispose 代替
 */
export async function disposeInstance(_directory?: string): Promise<boolean> {
  return disposeGlobal()
}
