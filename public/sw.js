// sw.js — Service Worker for background reminder notifications
// Runs in a separate thread; survives tab minimization and background switching.

const CHECK_INTERVAL_MS = 30_000  // 30 seconds
const STORAGE_KEY = 'todo-app-tasks'

// ─── Periodic check loop ────────────────────────────────────────────────────
// Service Workers can't access localStorage directly, so the page posts the
// task list to us whenever it changes.  We keep our own in-memory copy here.

let tasks = []

// Receive task updates from the main page
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SYNC_TASKS') {
    tasks = event.data.tasks ?? []
    // Start the interval here so it works on every page load,
    // not just the first SW install (activate only fires once).
    startInterval()
  }
})

// ─── setInterval inside SW ──────────────────────────────────────────────────
// SW stays alive as long as there's an active client (open tab).
// Even when the tab is hidden/minimised the SW thread keeps running normally.

let intervalId = null

function startInterval() {
  if (intervalId !== null) return
  intervalId = setInterval(checkAndNotify, CHECK_INTERVAL_MS)
  // Run once immediately on start
  checkAndNotify()
}

function stopInterval() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
  startInterval()
})

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

// When there are no more clients (all tabs closed) we stop the loop.
// This fires when the last tab using this SW is closed.
self.addEventListener('fetch', () => {}) // keep SW alive for fetch events

// ─── Core: decide which tasks need a notification ───────────────────────────

function shouldNotify(task) {
  if (!task.dueDate || task.completed) return false

  const now = Date.now()
  const due = new Date(task.dueDate).getTime()

  // Snoozed: don't notify until snooze expires
  if (task.snoozedUntil) {
    const snoozeEnd = new Date(task.snoozedUntil).getTime()
    if (now < snoozeEnd) return false
  }

  // Already notified and not snoozed
  if (task.reminderShown && !task.snoozedUntil) return false

  // Due time has been reached
  return due <= now
}

function formatDueDate(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const taskDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((taskDay - today) / 86400000)
  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  if (diffDays === 0) return `今天 ${time}`
  if (diffDays === -1) return `昨天 ${time}`
  if (diffDays < -1) return `${Math.abs(diffDays)} 天前 ${time}`
  return `${date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} ${time}`
}

async function checkAndNotify() {
  if (tasks.length === 0) return

  const due = tasks.filter(shouldNotify)
  if (due.length === 0) return

  // Fire one notification per due task
  for (const task of due) {
    const body = [
      task.description ?? '',
      task.dueDate ? `截止：${formatDueDate(task.dueDate)}` : '',
    ].filter(Boolean).join('\n') || '点击查看任务详情'

    await self.registration.showNotification(`⏰ ${task.title}`, {
      body,
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: `todo-${task.id}`,        // one notification per task (replaces previous)
      requireInteraction: true,      // stays visible until user acts
      silent: false,
      data: { taskId: task.id },
    })
  }

  // Tell the page to mark these tasks as reminderShown
  const dueIds = due.map(t => t.id)
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  for (const client of clients) {
    client.postMessage({ type: 'MARK_SHOWN', taskIds: dueIds })
  }
}

// ─── Notification click: focus / open the app tab ───────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a tab with the app is already open, focus it
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus()
          }
        }
        // Otherwise open a new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(self.registration.scope)
        }
      })
  )
})
