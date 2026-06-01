import { useState, useEffect } from 'react'
import { X, Calendar, AlignLeft, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Task, Priority } from '@/types'
import { PRIORITY_LABELS } from '@/types'

interface TaskFormProps {
  task?: Task | null
  onSubmit: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}

const PRIORITY_OPTIONS: { value: Priority; color: string }[] = [
  { value: 'high', color: 'text-red-500' },
  { value: 'medium', color: 'text-amber-500' },
  { value: 'low', color: 'text-emerald-500' },
]

// Format for datetime-local input (local time)
function toLocalDatetimeString(isoStr: string): string {
  const d = new Date(isoStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function TaskForm({ task, onSubmit, onClose }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(task?.dueDate ? toLocalDatetimeString(task.dueDate) : '')
  const [error, setError] = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('请输入任务内容')
      return
    }
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      completed: task?.completed ?? false,
      reminderShown: task?.reminderShown,
      snoozedUntil: task?.snoozedUntil,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div className="relative w-full max-w-lg animate-bounce-in">
        <div className="rounded-3xl border bg-card shadow-elevated overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-secondary/30">
            <h2 className="text-base font-semibold">
              {task ? '编辑任务' : '添加新任务'}
            </h2>
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="rounded-xl">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                任务内容 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => { setTitle(e.target.value); setError('') }}
                placeholder="输入任务标题..."
                autoFocus
                className={cn(
                  'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm',
                  'placeholder:text-muted-foreground input-ring',
                  error && 'border-destructive ring-2 ring-destructive/20',
                )}
              />
              {error && (
                <p className="mt-1 text-xs text-destructive">{error}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-muted-foreground" />
                备注说明
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="添加任务详情（可选）..."
                rows={2}
                className="w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm resize-none placeholder:text-muted-foreground input-ring"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Flag className="w-3.5 h-3.5 text-muted-foreground" />
                优先级
              </label>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={cn(
                      'flex-1 rounded-xl py-2 px-3 text-xs font-medium border transition-all',
                      priority === opt.value
                        ? opt.value === 'high'
                          ? 'bg-red-50 border-red-200 text-red-600'
                          : opt.value === 'medium'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-surface border-border text-muted-foreground hover:bg-surface-hover',
                    )}
                  >
                    <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1.5',
                      opt.value === 'high' && 'bg-red-500',
                      opt.value === 'medium' && 'bg-amber-500',
                      opt.value === 'low' && 'bg-emerald-500',
                    )} />
                    {PRIORITY_LABELS[opt.value]}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                截止时间
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm input-ring"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                取消
              </Button>
              <Button type="submit" className="flex-1">
                {task ? '保存修改' : '添加任务'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
