import { useState } from 'react'
import { Clock, Trash2, Edit3, Check, AlertTriangle } from 'lucide-react'
import { cn, formatDate, isOverdue } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PriorityBadge } from '@/components/PriorityBadge'
import type { Task } from '@/types'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}

export function TaskItem({ task, onToggle, onDelete, onEdit }: TaskItemProps) {
  const [deleting, setDeleting] = useState(false)
  const overdue = isOverdue(task)

  const handleDelete = () => {
    setDeleting(true)
    setTimeout(() => onDelete(task.id), 200)
  }

  return (
    <div className={cn(
      'task-item group relative flex items-start gap-3 rounded-2xl border bg-card p-4',
      'hover:shadow-elevated',
      overdue && 'task-overdue',
      task.completed && 'task-completed',
      deleting && 'opacity-0 scale-95 transition-all duration-200',
    )}>
      {/* Checkbox */}
      <button
        className={cn('checkbox-custom mt-0.5 shrink-0', task.completed && 'checked')}
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? '标记为未完成' : '标记为已完成'}
      >
        {task.completed && (
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className={cn(
            'text-sm font-medium leading-snug',
            task.completed && 'line-through text-muted-foreground',
            overdue && !task.completed && 'text-red-600',
          )}>
            {task.title}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(task)}
              className="h-7 w-7 rounded-lg"
              aria-label="编辑任务"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10"
              aria-label="删除任务"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {task.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <PriorityBadge priority={task.priority} />

          {task.dueDate && (
            <span className={cn(
              'inline-flex items-center gap-1 text-xs rounded-lg px-2 py-0.5',
              overdue && !task.completed
                ? 'text-red-600 bg-red-50 border border-red-100'
                : 'text-muted-foreground bg-muted/50 border border-border',
            )}>
              {overdue && !task.completed
                ? <AlertTriangle className="w-3 h-3" />
                : <Clock className="w-3 h-3" />
              }
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
