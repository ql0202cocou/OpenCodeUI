// ============================================
// Tool API Types
// 基于 @opencode-ai/sdk 类型
// ============================================

/**
 * 工具 ID 列表 — SDK 返回 string[]
 */
export type ToolIDs = string[]

/**
 * 工具列表项
 */
export interface ToolListItem {
  id: string
  description: string
  parameters?: unknown
}

/**
 * 工具列表 — SDK 返回 ToolListItem[]
 */
export type ToolList = ToolListItem[]
