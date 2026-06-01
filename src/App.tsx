import { useState, useEffect } from 'react'
import {
  Plus, CheckSquare, Calendar, LayoutList,
  Bell, BellOff, SortAsc, Search, X, ChevronDown,
  CheckCircle2, Circle, AlertTriangle, Clock
} from 'lucide-react'
import { cn, filterTasks, sortTasks } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TaskItem } from '@/components/TaskItem'
import { TaskForm } from '@/components/TaskForm'
import { CalendarView } from '@/components/CalendarView'
import { ReminderModal } from '@/components/ReminderModal'
import { useTasks } from '@/hooks/useTasks'
import { useNotification } from '@/hooks/useNotification'
import type { Task, FilterKey, SortKey, ViewMode } from '@/types'
import { FILTER_LABELS } from '@/types'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'priority', label: '优先级' },
  { value: 'dueDate', label: '截止时间' },
  { value: 'createdAt', label: '创建时间' },
  { value: 'title', label: '任务名称' },
]

const QUICK_FILTERS: FilterKey[] = ['all', 'pending', 'today', 'tomorrow', 'week', 'overdue', 'completed']

export default function App() {
  const {
    tasks, filter, setFilter, sortKey, setSortKey,
    addTask, updateTask, deleteTask, toggleTask,
    pendingReminders, dismissReminder, snoozeReminder, completeFromReminder,
    stats,
  } = useTasks()

  const { permission, requestPermission, sendNotification } = useNotification()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [currentReminderIdx, setCurrentReminderIdx] = useState(0)

  // Send desktop notification when reminder triggers
  useEffect(() => {
    if (pendingReminders.length > 0) {
      const task = pendingReminders[0]
      sendNotification('任务到期提醒', task.title)
    }
  }, [pendingReminders.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Advance to next reminder
  useEffect(() => {
    setCurrentReminderIdx(0)
  }, [pendingReminders.length])

  const handleAddTask = (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    addTask(data)
  }

  const handleEditTask = (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      updateTask(editingTask.id, data)
      setEditingTask(null)
    }
  }

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task)
  }

  // Filter + Search + Sort
  const filteredTasks = filterTasks(tasks, filter).filter(t =>
    searchQuery
      ? t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true
  )
  const sortedTasks = sortTasks(filteredTasks, sortKey)

  const currentReminder = pendingReminders[currentReminderIdx]

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, hsl(240 25% 95%) 0%, hsl(260 20% 94%) 50%, hsl(220 15% 93%) 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl btn-gradient flex items-center justify-center shadow-glow">
                <CheckSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-none gradient-text">待办清单</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {stats.pending} 待完成 · {stats.completed} 已完成
                  {stats.overdue > 0 && <span className="text-red-500"> · {stats.overdue} 已过期</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Notification permission */}
              <button
                onClick={async () => {
                  const granted = await requestPermission()
                  if (granted) sendNotification('通知已开启', '您将收到任务到期提醒')
                }}
                title={permission === 'granted' ? '通知已开启' : '开启桌面通知'}
                className={cn(
                  'p-2 rounded-xl border transition-all',
                  permission === 'granted'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-surface border-border text-muted-foreground hover:bg-surface-hover',
                  pendingReminders.length > 0 && 'notification-dot',
                )}
              >
                {permission === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>

              {/* View toggle */}
              <div className="flex rounded-xl border bg-muted/50 p-0.5">
                <button
                  className={cn('p-1.5 rounded-lg transition-all', viewMode === 'list' && 'tab-active')}
                  onClick={() => setViewMode('list')}
                  title="列表视图"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  className={cn('p-1.5 rounded-lg transition-all', viewMode === 'calendar' && 'tab-active')}
                  onClick={() => setViewMode('calendar')}
                  title="日历视图"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              {/* Add task */}
              <Button onClick={() => setShowForm(true)} size="sm" className="gap-1.5 shadow-glow">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">添加任务</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border bg-card p-3.5 shadow-card">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Circle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">全部任务</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-3.5 shadow-card">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">待完成</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-3.5 shadow-card">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">已完成</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overdue warning */}
        {stats.overdue > 0 && viewMode === 'list' && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-sm text-red-600 font-medium">
              有 {stats.overdue} 个任务已过期
            </span>
            <button
              className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium"
              onClick={() => setFilter('overdue')}
            >
              查看
            </button>
          </div>
        )}

        {viewMode === 'list' ? (
          <>
            {/* Filter + Search + Sort */}
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索任务..."
                  className="w-full rounded-xl border bg-card pl-9 pr-8 py-2.5 text-sm input-ring placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
                {QUICK_FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition-all',
                      filter === f
                        ? 'bg-primary text-primary-foreground border-primary shadow-glow'
                        : 'bg-card border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground',
                    )}
                  >
                    {FILTER_LABELS[f]}
                    {f === 'all' && ` (${stats.total})`}
                    {f === 'pending' && ` (${stats.pending})`}
                    {f === 'completed' && ` (${stats.completed})`}
                    {f === 'overdue' && stats.overdue > 0 && ` (${stats.overdue})`}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? `搜索到 ${sortedTasks.length} 个任务` : `共 ${sortedTasks.length} 个任务`}
                </p>
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu(p => !p)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border rounded-xl px-3 py-1.5 bg-card hover:bg-surface-hover transition-all"
                  >
                    <SortAsc className="w-3.5 h-3.5" />
                    {SORT_OPTIONS.find(o => o.value === sortKey)?.label}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showSortMenu && (
                    <div className="absolute right-0 top-full mt-1 z-30 w-36 rounded-xl border bg-card shadow-elevated py-1 animate-scale-in">
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors',
                            sortKey === opt.value && 'text-primary font-medium',
                          )}
                          onClick={() => { setSortKey(opt.value); setShowSortMenu(false) }}
                        >
                          {opt.value === sortKey && '✓ '}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Task List */}
            {sortedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-base font-medium text-muted-foreground">
                  {searchQuery ? '没有找到匹配的任务' : '暂无任务'}
                </p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  {!searchQuery && '点击「添加任务」开始规划你的一天'}
                </p>
                {!searchQuery && (
                  <Button className="mt-4 gap-2" onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4" />
                    添加第一个任务
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {sortedTasks.map(task => (
                  <div key={task.id} className="animate-fade-in">
                    <TaskItem
                      task={task}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onEdit={handleOpenEdit}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Floating add button for mobile */}
            <div className="fixed bottom-6 right-4 sm:hidden">
              <button
                onClick={() => setShowForm(true)}
                className="w-14 h-14 rounded-full btn-gradient shadow-glow flex items-center justify-center"
              >
                <Plus className="w-6 h-6 text-white" />
              </button>
            </div>
          </>
        ) : (
          /* Calendar View */
          <div className="rounded-2xl border bg-card p-4 shadow-card">
            <CalendarView
              tasks={tasks}
              onEditTask={handleOpenEdit}
              onToggleTask={toggleTask}
            />
          </div>
        )}
      </main>

      {/* Close sort menu on outside click */}
      {showSortMenu && (
        <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)} />
      )}

      {/* Task Form Modal */}
      {(showForm || editingTask) && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleEditTask : handleAddTask}
          onClose={() => { setShowForm(false); setEditingTask(null) }}
        />
      )}

      {/* Reminder Modal */}
      {currentReminder && (
        <ReminderModal
          task={currentReminder}
          onComplete={completeFromReminder}
          onSnooze={snoozeReminder}
          onDismiss={dismissReminder}
        />
      )}
    </div>
  )
}
