import { useState, useEffect, useCallback, useRef } from 'react'
import type { Task, FilterKey, SortKey } from '@/types'
import { generateId } from '@/lib/utils'

const STORAGE_KEY = 'todo-app-tasks'

function readStorage(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Task[]) : []
  } catch {
    return []
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = readStorage()
    return stored.length > 0 ? stored : getDefaultTasks()
  })

  const [filter, setFilter] = useState<FilterKey>('all')
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [pendingReminders, setPendingReminders] = useState<Task[]>([])

  const tasksRef = useRef(tasks)
  tasksRef.current = tasks

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  // Called when the Service Worker fires a notification and posts MARK_SHOWN
  const markShown = useCallback((taskIds: string[]) => {
    const ids = new Set(taskIds)
    setTasks(prev =>
      prev.map(t =>
        ids.has(t.id)
          ? { ...t, reminderShown: true, snoozedUntil: undefined, updatedAt: new Date().toISOString() }
          : t
      )
    )
    setPendingReminders(prev => {
      const existingIds = new Set(prev.map(t => t.id))
      const freshTasks = tasksRef.current.filter(t => ids.has(t.id) && !existingIds.has(t.id))
      return freshTasks.length > 0 ? [...prev, ...freshTasks] : prev
    })
  }, [])

  const addTask = useCallback((data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const task: Task = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setTasks(prev => [task, ...prev])
    return task
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      )
    )
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    setPendingReminders(prev => prev.filter(t => t.id !== id))
  }, [])

  const toggleTask = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() }
          : t
      )
    )
  }, [])

  const dismissReminder = useCallback((taskId: string) => {
    updateTask(taskId, { reminderShown: true, snoozedUntil: undefined })
    setPendingReminders(prev => prev.filter(t => t.id !== taskId))
  }, [updateTask])

  const snoozeReminder = useCallback((taskId: string, minutes: number) => {
    const snoozedUntil = new Date(Date.now() + minutes * 60_000).toISOString()
    updateTask(taskId, { snoozedUntil, reminderShown: false })
    setPendingReminders(prev => prev.filter(t => t.id !== taskId))
  }, [updateTask])

  const completeFromReminder = useCallback((taskId: string) => {
    toggleTask(taskId)
    updateTask(taskId, { reminderShown: true })
    setPendingReminders(prev => prev.filter(t => t.id !== taskId))
  }, [toggleTask, updateTask])

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
    overdue: tasks.filter(t => {
      if (!t.dueDate || t.completed) return false
      return new Date(t.dueDate) < new Date()
    }).length,
  }

  return {
    tasks,
    filter, setFilter,
    sortKey, setSortKey,
    addTask, updateTask, deleteTask, toggleTask,
    pendingReminders,
    dismissReminder, snoozeReminder, completeFromReminder,
    markShown,
    stats,
  }
}

function getDefaultTasks(): Task[] {
  const now = new Date()
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1)
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const in3days = new Date(now); in3days.setDate(now.getDate() + 3)

  return [
    {
      id: generateId(),
      title: '完成季度报告初稿',
      description: '需要包含 Q1 数据分析和 Q2 目标规划',
      completed: false, priority: 'high',
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: generateId(),
      title: '团队周会 - 项目进度同步',
      description: '提前准备演示材料',
      completed: false, priority: 'medium',
      dueDate: tomorrow.toISOString(),
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: generateId(),
      title: '更新产品文档',
      completed: true, priority: 'low',
      dueDate: yesterday.toISOString(),
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date().toISOString(),
      reminderShown: true,
    },
    {
      id: generateId(),
      title: '评审设计稿并反馈',
      description: '主要关注移动端适配部分',
      completed: false, priority: 'medium',
      dueDate: in3days.toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: generateId(),
      title: '预约牙科检查',
      completed: false, priority: 'low',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date(Date.now() - 259200000).toISOString(),
    },
  ]
}
