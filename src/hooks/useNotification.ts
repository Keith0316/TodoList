import { useState, useEffect, useCallback } from 'react'

export type NotificationPermissionState = NotificationPermission | 'unsupported'

export function useNotification() {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window

  const [permission, setPermission] = useState<NotificationPermissionState>(
    isSupported ? Notification.permission : 'unsupported'
  )

  // Keep permission state in sync (user may change it in browser settings)
  useEffect(() => {
    if (!isSupported) return
    const sync = () => setPermission(Notification.permission)
    // Poll every 2s to catch external changes
    const id = setInterval(sync, 2000)
    return () => clearInterval(id)
  }, [isSupported])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false
    if (Notification.permission === 'granted') {
      setPermission('granted')
      return true
    }
    if (Notification.permission === 'denied') {
      setPermission('denied')
      return false
    }
    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }, [isSupported])

  /**
   * Send a desktop notification.
   * Works even when the page is in the background.
   * Returns the Notification instance (or null if unavailable).
   */
  const sendNotification = useCallback((
    title: string,
    body: string,
    tag?: string
  ): Notification | null => {
    if (!isSupported || Notification.permission !== 'granted') return null

    const notification = new Notification(title, {
      body,
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: tag ?? 'todo-reminder',
      requireInteraction: true,   // stays visible until user acts
      silent: false,
    })

    notification.onclick = () => {
      // Focus / restore the tab that owns this page
      window.focus()
      notification.close()
    }

    return notification
  }, [isSupported])

  /** Send a test notification so the user can verify it works */
  const sendTestNotification = useCallback(async (): Promise<'sent' | 'denied' | 'unsupported'> => {
    if (!isSupported) return 'unsupported'
    const granted = await requestPermission()
    if (!granted) return 'denied'
    sendNotification(
      '🔔 通知测试',
      '桌面通知工作正常！任务到期时你将收到此类提醒。',
      'todo-test'
    )
    return 'sent'
  }, [isSupported, requestPermission, sendNotification])

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    sendTestNotification,
  }
}
