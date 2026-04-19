import { useEffect, useMemo } from 'react'
import { useTheme } from '../hooks/useTheme'
import { isTauri, isTauriMobile } from '../utils/tauri'

type DesktopPlatform = 'windows' | 'macos' | 'other'

function detectDesktopPlatform(): DesktopPlatform {
  if (!isTauri() || isTauriMobile() || typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('windows')) return 'windows'
  if (ua.includes('mac os') || ua.includes('macintosh')) return 'macos'
  return 'other'
}

export function DesktopTitlebar() {
  const { mode, resolvedTheme } = useTheme()
  const platform = useMemo(() => detectDesktopPlatform(), [])
  const isDesktopChrome = platform === 'windows' || platform === 'macos'

  useEffect(() => {
    if (!isDesktopChrome) return

    let cancelled = false
    const theme = mode === 'system' ? null : resolvedTheme

    void import('@tauri-apps/api/window').then(async ({ getCurrentWindow }) => {
      if (cancelled) return
      try {
        await getCurrentWindow().setTheme(theme)
      } catch {
        // ignore - native theme sync is best effort only
      }
    })

    return () => {
      cancelled = true
    }
  }, [isDesktopChrome, mode, resolvedTheme])

  if (!isDesktopChrome) return null

  return (
    <header className="desktop-titlebar relative z-[220] grid h-10 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center bg-bg-100">
      {platform === 'macos' ? (
        <div className="h-full w-[76px] shrink-0" />
      ) : (
        <div data-tauri-drag-region className="h-full w-3 shrink-0" />
      )}

      <div data-tauri-drag-region className="min-w-0 h-full" />

      {platform === 'windows' ? (
        <div
          data-tauri-decorum-tb
          className="desktop-titlebar-controls flex h-full min-w-[138px] shrink-0 items-stretch justify-end"
        />
      ) : (
        <div data-tauri-drag-region className="h-full w-3 shrink-0" />
      )}
    </header>
  )
}
