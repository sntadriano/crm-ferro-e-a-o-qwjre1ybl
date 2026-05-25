import { AlertCircle, FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface StateDisplayProps {
  loading: boolean
  error: boolean
  empty: boolean
  onRetry: () => void
  children: React.ReactNode
}

export function StateDisplay({ loading, error, empty, onRetry, children }: StateDisplayProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card mt-6">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
        <p className="text-muted-foreground mb-4">
          Ocorreu um problema ao buscar as informações para o relatório.
        </p>
        <Button onClick={onRetry} variant="outline">
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card mt-6">
        <FileX className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum dado no período</h3>
        <p className="text-muted-foreground">Ajuste os filtros acima para ver resultados.</p>
      </div>
    )
  }

  return <div className="mt-6 space-y-6">{children}</div>
}
