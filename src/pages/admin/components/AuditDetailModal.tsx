import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import type { AuditLog } from '@/services/audit_logs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface Props {
  log: AuditLog
  onClose: () => void
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
}

export function AuditDetailModal({ log, onClose }: Props) {
  const renderValue = (val: any) => {
    if (val === null || val === undefined)
      return <span className="text-muted-foreground italic">nulo</span>
    if (typeof val === 'object')
      return (
        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(val, null, 2)}
        </pre>
      )
    return <span className="text-sm">{String(val)}</span>
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            Detalhes da Modificação
            <Badge variant="outline" className={actionColors[log.acao] || ''}>
              {log.acao}
            </Badge>
          </DialogTitle>
          <DialogDescription>Informações detalhadas sobre a ação realizada.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tabela</p>
                <p className="capitalize font-medium">{log.tabela}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registro ID</p>
                <p className="font-mono text-sm">{log.registro_id || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuário</p>
                <p className="font-medium">{log.usuario_nome}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data / Hora</p>
                <p className="font-medium">
                  {format(new Date(log.created), 'dd/MM/yyyy HH:mm:ss')}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Alterações</h3>
              <div className="space-y-4">
                {log.detalhes?.length > 0 ? (
                  log.detalhes.map((change, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-muted/30">
                      <p className="font-medium text-sm mb-2 text-foreground">
                        Campo: <span className="font-mono text-primary">{change.campo}</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Valor Anterior
                          </p>
                          <div className="bg-background rounded border p-2 min-h-[40px]">
                            {renderValue(change.valor_anterior)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Valor Novo
                          </p>
                          <div className="bg-background rounded border p-2 min-h-[40px]">
                            {renderValue(change.valor_novo)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum detalhe disponível para esta ação.
                  </p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
