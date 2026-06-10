import { useEffect, useRef, useCallback } from 'react'
import type { Task } from '@/types'

// 跟随 Vite base 路径，避免 404（如 base: '/TodoList/' 时路径为 '/TodoList/sw.js'）
const SW_PATH = `${import.meta.env.BASE_URL}sw.js`

/**
 * Registers and communicates with the background Service Worker.
 *
 * The SW runs in a separate thread — it keeps firing even when the tab is
 * hidden, minimised, or the user has switched to another tab.
 */
export function useServiceWorker(
  onMarkShown: (taskIds: string[]) => void
) {
  const swRegistered = useRef(false)
  const onMarkShownRef = useRef(onMarkShown)
  onMarkShownRef.current = onMarkShown

  // ── Register SW on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (swRegistered.current) return
    swRegistered.current = true

    navigator.serviceWorker
      .register(SW_PATH)
      .then((reg) => {
        console.log('[SW] Registered, scope:', reg.scope)
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err)
      })

    // Listen for messages from the SW (e.g. MARK_SHOWN)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'MARK_SHOWN') {
        onMarkShownRef.current(event.data.taskIds as string[])
      }
    }
    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  // ── Send task list to SW whenever it changes ──────────────────────────────
  const syncTasks = useCallback((tasks: Task[]) => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({ type: 'SYNC_TASKS', tasks })
    })
  }, [])

  return { syncTasks }
}
