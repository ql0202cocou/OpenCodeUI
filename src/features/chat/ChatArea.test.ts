import { describe, expect, it } from 'vitest'
import { buildVisibleMessageEntries } from './chatAreaVisibility'
import type { Message, ToolPart } from '../../types/message'

function createAssistantMessage(id: string, parts: ToolPart[]): Message {
  return {
    info: {
      id,
      sessionID: 'session-1',
      role: 'assistant',
      parentID: 'user-1',
      modelID: 'model-1',
      providerID: 'provider-1',
      mode: 'chat',
      agent: 'build',
      path: { cwd: '/workspace', root: '/workspace' },
      cost: 0,
      tokens: {
        input: 0,
        output: 0,
        reasoning: 0,
        cache: { read: 0, write: 0 },
      },
      time: { created: 1 },
    },
    parts,
    isStreaming: false,
  }
}

function createToolPart(id: string, messageID: string): ToolPart {
  return {
    id,
    sessionID: 'session-1',
    messageID,
    type: 'tool',
    callID: `call-${id}`,
    tool: 'bash',
    state: {
      status: 'completed',
      input: { command: 'pwd' },
      output: '/workspace',
      title: 'pwd',
      metadata: {},
      time: { start: 1, end: 2 },
    },
  }
}

describe('buildVisibleMessageEntries', () => {
  it('keeps source ids for merged assistant tool messages', () => {
    const first = createAssistantMessage('assistant-1', [createToolPart('tool-1', 'assistant-1')])
    const second = createAssistantMessage('assistant-2', [createToolPart('tool-2', 'assistant-2')])

    const entries = buildVisibleMessageEntries([first, second])

    expect(entries).toHaveLength(1)
    expect(entries[0].sourceIds).toEqual(['assistant-1', 'assistant-2'])
    expect(entries[0].message.parts).toHaveLength(2)
  })
})
