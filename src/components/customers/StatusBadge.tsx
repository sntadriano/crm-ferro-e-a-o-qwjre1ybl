import { Badge } from '@/components/ui/badge'
import { CustomerStatus } from '@/types/customer'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: CustomerStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isAtivo = status === 'Ativo'
  const isProspeccao = status === 'Prospecção'

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border-transparent',
        isAtivo
          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400'
          : isProspeccao
            ? 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400',
        className,
      )}
    >
      {status}
    </Badge>
  )
}
