// ============================================
// Config API - 配置管理
// ============================================

import { getSDKClient, unwrap } from './sdk'
import { formatPathForApi } from '../utils/directoryUtils'
import type { Config } from '../types/api/config'

/**
 * 获取当前配置
 */
export async function getConfig(directory?: string): Promise<Config> {
  const sdk = getSDKClient()
  return unwrap(await sdk.config.get({ directory: formatPathForApi(directory) })) as Config
}

/**
 * 更新配置
 */
export async function updateConfig(config: Partial<Config>, directory?: string): Promise<Config> {
  const sdk = getSDKClient()
  return unwrap(
    await sdk.config.update({ directory: formatPathForApi(directory), config: config as Record<string, unknown> }),
  ) as Config
}

/**
 * 获取 provider 配置列表
 */
export async function getProviderConfigs(directory?: string): Promise<Record<string, unknown>> {
  const sdk = getSDKClient()
  return unwrap(await sdk.config.providers({ directory: formatPathForApi(directory) })) as Record<string, unknown>
}
