import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Task, FilterKey, SortKey } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const taskDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((taskDay.getTime() - today.getTime()) / 86400000)

  const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  if (diffDays === 0) return `今天 ${timeStr}`
  if (diffDays === 1) return `明天 ${timeStr}`
  if (diffDays === -1) return `昨天 ${timeStr}`
  if (diffDays > 0 && diffDays <= 6) return `${['周日','周一','周二','周三','周四','周五','周六'][date.getDay()]} ${timeStr}`

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' + timeStr
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.completed) return false
  return new Date(task.dueDate) < new Date()
}

export function isDueToday(task: Task): boolean {
  if (!task.dueDate) return false
  const now = new Date()
  const due = new Date(task.dueDate)
  return due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
}

export function isDueTomorrow(task: Task): boolean {
  if (!task.dueDate) return false
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const due = new Date(task.dueDate)
  return due.getFullYear() === tomorrow.getFullYear() &&
    due.getMonth() === tomorrow.getMonth() &&
    due.getDate() === tomorrow.getDate()
}

export function isDueThisWeek(task: Task): boolean {
  if (!task.dueDate) return false
  const now = new Date()
  const due = new Date(task.dueDate)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)
  return due >= startOfWeek && due < endOfWeek
}

export function filterTasks(tasks: Task[], filter: FilterKey): Task[] {
  switch (filter) {
    case 'pending': return tasks.filter(t => !t.completed)
    case 'completed': return tasks.filter(t => t.completed)
    case 'today': return tasks.filter(t => isDueToday(t) && !t.completed)
    case 'tomorrow': return tasks.filter(t => isDueTomorrow(t) && !t.completed)
    case 'week': return tasks.filter(t => isDueThisWeek(t) && !t.completed)
    case 'overdue': return tasks.filter(t => isOverdue(t))
    default: return tasks
  }
}

export function sortTasks(tasks: Task[], sortKey: SortKey): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1

    if (sortKey === 'priority') {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.priority] - order[b.priority]
    }
    if (sortKey === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    if (sortKey === 'title') {
      return a.title.localeCompare(b.title, 'zh-CN')
    }
    // createdAt
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export function shouldTriggerReminder(task: Task): boolean {
  if (!task.dueDate || task.completed) return false
  const now = new Date()
  const due = new Date(task.dueDate)
  const snoozedUntil = task.snoozedUntil ? new Date(task.snoozedUntil) : null

  if (snoozedUntil && now < snoozedUntil) return false
  if (task.reminderShown && !task.snoozedUntil) return false

  return due <= now
}
