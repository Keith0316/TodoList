export type Priority = 'high' | 'medium' | 'low'
export type SortKey = 'priority' | 'dueDate' | 'createdAt' | 'title'
export type FilterKey = 'all' | 'pending' | 'completed' | 'today' | 'tomorrow' | 'week' | 'overdue'
export type ViewMode = 'list' | 'calendar'

export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: Priority
  dueDate?: string // ISO string
  createdAt: string
  updatedAt: string
  reminderShown?: boolean
  snoozedUntil?: string // ISO string, for snooze
}

export interface ReminderState {
  task: Task
  visible: boolean
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
}

export const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export const FILTER_LABELS: Record<FilterKey, string> = {
  all: '全部',
  pending: '待完成',
  completed: '已完成',
  today: '今天',
  tomorrow: '明天',
  week: '本周',
  overdue: '已过期',
}
