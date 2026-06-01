import { useEffect, useCallback } from 'react'

export function useNotification() {
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  }, [])

  const sendNotification = useCallback((title: string, body: string) => {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const notification = new Notification(title, {
      body,
      icon: '/vite.svg',
      tag: 'todo-reminder',
      requireInteraction: true,
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }, [])

  useEffect(() => {
    // Auto-request permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      // Will request when user first interacts
    }
  }, [])

  return {
    permission: typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default' as NotificationPermission,
    requestPermission,
    sendNotification,
  }
}
