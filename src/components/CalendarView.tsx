import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, formatDate, isOverdue } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PriorityBadge } from '@/components/PriorityBadge'
import type { Task } from '@/types'

interface CalendarViewProps {
  tasks: Task[]
  onEditTask: (task: Task) => void
  onToggleTask: (id: string) => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

export function CalendarView({ tasks, onEditTask, onToggleTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [listView, setListView] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => {
    setCurrentDate(new Date())
    const today = new Date()
    setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`)
  }

  // Group tasks by date
  const tasksByDate: Record<string, Task[]> = {}
  tasks.forEach(task => {
    if (!task.dueDate) return
    const d = new Date(task.dueDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!tasksByDate[key]) tasksByDate[key] = []
    tasksByDate[key].push(task)
  })

  const getDateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] ?? []) : []

  // List view: upcoming tasks
  const upcomingTasks = tasks
    .filter(t => t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">
            {year}年 {MONTHS[month]}
          </h2>
          <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs text-primary h-7 px-2">
            今天
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {/* View toggle */}
          <div className="flex rounded-xl border bg-muted/50 p-0.5 mr-2">
            <button
              className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all', !listView && 'tab-active')}
              onClick={() => setListView(false)}
            >月视图</button>
            <button
              className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all', listView && 'tab-active')}
              onClick={() => setListView(true)}
            >列表视图</button>
          </div>

          <Button variant="ghost" size="icon-sm" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {listView ? (
        /* List View */
        <div className="space-y-2">
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              暂无设置截止时间的任务
            </div>
          ) : (
            upcomingTasks.map(task => {
              const overdue = isOverdue(task)
              return (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-card transition-all cursor-pointer',
                    overdue && !task.completed && 'border-red-100 bg-red-50/30',
                    task.completed && 'opacity-60',
                  )}
                  onClick={() => onEditTask(task)}
                >
                  <button
                    className={cn('checkbox-custom shrink-0', task.completed && 'checked')}
                    onClick={e => { e.stopPropagation(); onToggleTask(task.id) }}
                  >
                    {task.completed && <span className="text-white text-xs">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', task.completed && 'line-through text-muted-foreground')}>
                      {task.title}
                    </p>
                    <p className={cn('text-xs mt-0.5', overdue && !task.completed ? 'text-red-500' : 'text-muted-foreground')}>
                      {task.dueDate && formatDate(task.dueDate)}
                    </p>
                  </div>
                  <PriorityBadge priority={task.priority} />
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* Month Calendar */
        <div className="rounded-2xl border bg-card overflow-hidden shadow-card">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b">
            {WEEKDAYS.map((day, i) => (
              <div key={day} className={cn(
                'py-2.5 text-center text-xs font-medium',
                i === 0 || i === 6 ? 'text-muted-foreground' : 'text-muted-foreground',
              )}>
                {day}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="h-20 border-b border-r" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const dateKey = getDateKey(day)
              const dayTasks = tasksByDate[dateKey] ?? []
              const isToday = dateKey === todayKey
              const isSelected = dateKey === selectedDate

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                  className={cn(
                    'cal-day relative h-20 border-b border-r p-1.5 cursor-pointer',
                    isSelected && 'bg-primary/5',
                    !isSelected && 'hover:bg-muted/40',
                    (i + firstDay) % 7 === 6 && 'border-r-0', // last column
                  )}
                >
                  <span className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mx-auto',
                    isToday && 'btn-gradient text-white text-xs',
                    !isToday && isSelected && 'bg-primary/10 text-primary',
                    !isToday && !isSelected && 'text-foreground',
                  )}>
                    {day}
                  </span>

                  {dayTasks.length > 0 && (
                    <div className="mt-1 space-y-0.5 overflow-hidden max-h-[36px]">
                      {dayTasks.slice(0, 2).map(t => (
                        <div key={t.id} className={cn(
                          'text-[10px] leading-none px-1.5 py-1 rounded-md font-medium truncate',
                          t.completed
                            ? 'bg-muted text-muted-foreground line-through'
                            : isOverdue(t)
                              ? 'bg-red-100 text-red-600'
                              : t.priority === 'high'
                                ? 'bg-red-50 text-red-500'
                                : t.priority === 'medium'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-emerald-50 text-emerald-600',
                        )}>
                          {t.title}
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <div className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - 2}</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected date tasks */}
      {selectedDate && selectedTasks.length > 0 && !listView && (
        <div className="animate-fade-in">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
            {selectedDate.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1年$2月$3日')} 的任务
          </h3>
          <div className="space-y-2">
            {selectedTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-card transition-all cursor-pointer"
                onClick={() => onEditTask(task)}
              >
                <button
                  className={cn('checkbox-custom shrink-0', task.completed && 'checked')}
                  onClick={e => { e.stopPropagation(); onToggleTask(task.id) }}
                >
                  {task.completed && <span className="text-white text-xs">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', task.completed && 'line-through text-muted-foreground')}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {task.dueDate && formatDate(task.dueDate)}
                  </p>
                </div>
                <PriorityBadge priority={task.priority} />
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedDate && selectedTasks.length === 0 && !listView && (
        <p className="text-sm text-muted-foreground text-center py-4">
          该日期没有任务
        </p>
      )}
    </div>
  )
}
