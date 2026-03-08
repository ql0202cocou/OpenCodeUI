import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiMessage, ApiMessageWithParts, ApiPart } from '../api/types'
import { messageCacheStore } from './messageCacheStore'
import { messageStore } from './messageStore'

function createAssistantMessage(id: string): ApiMessage {
  return {
    id,
    sessionID: 'session-1',
    role: 'assistant',
    parentID: 'user-1',
    modelID: 'model-1',
    providerID: 'provider-1',
    mode: 'chat',
    agent: 'build',
    path: {
      cwd: '/workspace',
      root: '/workspace',
    },
    cost: 0,
    tokens: {
      input: 0,
      output: 0,
      reasoning: 0,
      cache: { read: 0, write: 0 },
    },
    time: {
      created: 1,
      completed: 2,
    },
  }
}

function createTextPart(
  id: string,
  messageID: string,
  text: string,
): ApiPart & { sessionID: string; messageID: string } {
  return {
    id,
    sessionID: 'session-1',
    messageID,
    type: 'text',
    text,
  }
}

function createMessageWithParts(id: string, text: string): ApiMessageWithParts {
  return {
    info: createAssistantMessage(id),
    parts: [createTextPart(`part-${id}`, id, text)],
  }
}

describe('messageStore SSE ordering safeguards', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(messageCacheStore, 'setMessageParts').mockResolvedValue()
    messageStore.clearAll()
  })

  it('replays a queued part update after the message arrives', () => {
    messageStore.handlePartUpdated(createTextPart('part-1', 'message-1', 'hello'))
    messageStore.handleMessageUpdated(createAssistantMessage('message-1'))

    const state = messageStore.getSessionState('session-1')
    expect(state?.messages).toHaveLength(1)
    expect(state?.messages[0].parts).toHaveLength(1)
    expect(state?.messages[0].parts[0]).toMatchObject({ id: 'part-1', type: 'text', text: 'hello' })
  })

  it('treats a later full part snapshot as authoritative over older queued deltas', () => {
    messageStore.handlePartDelta({
      sessionID: 'session-1',
      messageID: 'message-1',
      partID: 'part-1',
      field: 'text',
      delta: ' world',
    })
    messageStore.handlePartUpdated(createTextPart('part-1', 'message-1', 'hello world'))
    messageStore.handleMessageUpdated(createAssistantMessage('message-1'))

    const state = messageStore.getSessionState('session-1')
    expect(state?.messages[0].parts[0]).toMatchObject({ text: 'hello world' })
  })

  it('marks cached sessions stale after reconnect and clears the flag after a fresh load', () => {
    messageStore.setMessages('session-1', [createMessageWithParts('message-1', 'hello')])

    expect(messageStore.isSessionStale('session-1')).toBe(false)

    messageStore.markAllSessionsStale()
    expect(messageStore.isSessionStale('session-1')).toBe(true)

    messageStore.setMessages('session-1', [createMessageWithParts('message-1', 'hello again')])
    expect(messageStore.isSessionStale('session-1')).toBe(false)
  })

  it('removes obsolete message cache entries when a fresh load replaces old messages', () => {
    const deleteBatchSpy = vi.spyOn(messageCacheStore, 'deleteMessagePartsBatch').mockResolvedValue()

    messageStore.setMessages('session-1', [createMessageWithParts('message-1', 'hello')])
    messageStore.setMessages('session-1', [createMessageWithParts('message-2', 'world')])

    expect(deleteBatchSpy).toHaveBeenCalledWith('session-1', ['message-1'])
  })

  it('cleans removed branch cache entries when truncating after revert', () => {
    const deleteBatchSpy = vi.spyOn(messageCacheStore, 'deleteMessagePartsBatch').mockResolvedValue()

    messageStore.setMessages('session-1', [
      createMessageWithParts('message-1', 'one'),
      createMessageWithParts('message-2', 'two'),
      createMessageWithParts('message-3', 'three'),
    ])
    messageStore.setRevertState('session-1', {
      messageId: 'message-2',
      history: [],
    })

    messageStore.truncateAfterRevert('session-1')

    expect(deleteBatchSpy).toHaveBeenCalledWith('session-1', ['message-2', 'message-3'])
  })

  it('deletes persisted cache when the last part of a message is removed', () => {
    const deleteBatchSpy = vi.spyOn(messageCacheStore, 'deleteMessagePartsBatch').mockResolvedValue()

    messageStore.setMessages('session-1', [createMessageWithParts('message-1', 'hello')])
    ;(
      messageStore as unknown as { markMessagePersisted: (sessionId: string, messageId: string) => void }
    ).markMessagePersisted('session-1', 'message-1')

    messageStore.handlePartRemoved({
      sessionID: 'session-1',
      messageID: 'message-1',
      id: 'part-message-1',
    })

    expect(deleteBatchSpy).toHaveBeenCalledWith('session-1', ['message-1'])
  })
})
