import { useSyncExternalStore } from 'react'
import type { NotificationType } from './notificationStore'

export interface NotificationEventConfig {
  systemEnabled: boolean
}

export interface NotificationEventSettings {
  events: Record<NotificationType, NotificationEventConfig>
}

type Subscriber = () => void

const STORAGE_KEY = 'opencode:notification-event-settings'

function createDefaultSettings(): NotificationEventSettings {
  return {
    events: {
      completed: { systemEnabled: true },
      permission: { systemEnabled: true },
      question: { systemEnabled: true },
      error: { systemEnabled: true },
    },
  }
}

function loadSettings(): NotificationEventSettings {
  const defaults = createDefaultSettings()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults

    const parsed = JSON.parse(raw)
    return {
      events: {
        completed: {
          systemEnabled:
            typeof parsed?.events?.completed?.systemEnabled === 'boolean'
              ? parsed.events.completed.systemEnabled
              : defaults.events.completed.systemEnabled,
        },
        permission: {
          systemEnabled:
            typeof parsed?.events?.permission?.systemEnabled === 'boolean'
              ? parsed.events.permission.systemEnabled
              : defaults.events.permission.systemEnabled,
        },
        question: {
          systemEnabled:
            typeof parsed?.events?.question?.systemEnabled === 'boolean'
              ? parsed.events.question.systemEnabled
              : defaults.events.question.systemEnabled,
        },
        error: {
          systemEnabled:
            typeof parsed?.events?.error?.systemEnabled === 'boolean'
              ? parsed.events.error.systemEnabled
              : defaults.events.error.systemEnabled,
        },
      },
    }
  } catch {
    return defaults
  }
}

function saveSettings(settings: NotificationEventSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Ignore storage write failures.
  }
}

class NotificationEventSettingsStore {
  private state: NotificationEventSettings = loadSettings()
  private subscribers = new Set<Subscriber>()

  subscribe = (callback: Subscriber): (() => void) => {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  getSnapshot = (): NotificationEventSettings => this.state

  private notify() {
    this.subscribers.forEach(cb => cb())
  }

  private persist() {
    saveSettings(this.state)
  }

  isSystemEnabled(type: NotificationType): boolean {
    return this.state.events[type]?.systemEnabled !== false
  }

  setSystemEnabled(type: NotificationType, systemEnabled: boolean) {
    this.state = {
      ...this.state,
      events: {
        ...this.state.events,
        [type]: { systemEnabled },
      },
    }
    this.persist()
    this.notify()
  }
}

export const notificationEventSettingsStore = new NotificationEventSettingsStore()

export function useNotificationEventSettings(): NotificationEventSettings {
  return useSyncExternalStore(notificationEventSettingsStore.subscribe, notificationEventSettingsStore.getSnapshot)
}
