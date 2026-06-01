import { cn } from '@/lib/utils'
import type { Priority } from '@/types'
import { PRIORITY_LABELS } from '@/types'

interface PriorityBadgeProps {
  priority: Priority
  size?: 'sm' | 'md'
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-lg font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      priority === 'high' && 'badge-high',
      priority === 'medium' && 'badge-medium',
      priority === 'low' && 'badge-low',
    )}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full mr-1.5',
        priority === 'high' && 'bg-red-500',
        priority === 'medium' && 'bg-amber-500',
        priority === 'low' && 'bg-emerald-500',
      )} />
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
