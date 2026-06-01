import { Bell, CheckCircle2, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { Task } from '@/types'

interface ReminderModalProps {
  task: Task
  onComplete: (id: string) => void
  onSnooze: (id: string, minutes: number) => void
  onDismiss: (id: string) => void
}

export function ReminderModal({ task, onComplete, onSnooze, onDismiss }: ReminderModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-sm animate-bounce-in">
        <div className="rounded-3xl border-2 border-primary/20 bg-card shadow-glow overflow-hidden">
          {/* Alert Header */}
          <div className="header-gradient px-6 pt-6 pb-4 relative">
            <button
              onClick={() => onDismiss(task.id)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-2xl border-2 border-white/50 animate-pulse-ring" />
              </div>
              <div>
                <p className="text-xs font-medium text-white/70 uppercase tracking-wider">任务提醒</p>
                <p className="text-lg font-bold text-white mt-0.5">到期提醒</p>
              </div>
            </div>
          </div>

          {/* Task Info */}
          <div className="px-6 py-4 border-b">
            <p className="text-base font-semibold text-foreground leading-snug">
              {task.title}
            </p>
            {task.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1.5 mt-3 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-100">
                <Clock className="w-4 h-4 shrink-0" />
                <span>截止时间：{formatDate(task.dueDate)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 space-y-2">
            <Button
              className="w-full gap-2"
              onClick={() => onComplete(task.id)}
            >
              <CheckCircle2 className="w-4 h-4" />
              标记为已完成
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="text-sm gap-1.5"
                onClick={() => onSnooze(task.id, 10)}
              >
                <Clock className="w-3.5 h-3.5" />
                10分钟后提醒
              </Button>
              <Button
                variant="outline"
                className="text-sm gap-1.5"
                onClick={() => onSnooze(task.id, 60)}
              >
                <Clock className="w-3.5 h-3.5" />
                1小时后提醒
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
