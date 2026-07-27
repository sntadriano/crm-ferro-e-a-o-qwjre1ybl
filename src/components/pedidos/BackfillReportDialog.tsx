import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { BackfillReport } from '@/services/pedidos'

interface BackfillReportDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  report: BackfillReport | null
  loading: boolean
}

export function BackfillReportDialog({
  open,
  onOpenChange,
  report,
  loading,
}: BackfillReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Relatório de Correção de Relações</DialogTitle>
          <DialogDescription>
            Resumo do backfill dos campos <code>cliente_id</code> (em pedidos) e{' '}
            <code>produto_id</code> (em itens).
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-3 text-sm text-muted-foreground">Processando registros...</span>
          </div>
        ) : report ? (
          <ScrollArea className="max-h-[55vh] pr-4">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <h3 className="font-semibold text-sm">Pedidos</h3>
                  </div>
                  <p className="text-2xl font-bold text-[#1A3A52]">
                    {report.pedidos.resolved}
                    <span className="text-sm font-normal text-muted-foreground">
                      {' '}
                      / {report.pedidos.total}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {report.pedidos.resolved} com cliente vinculado · {report.pedidos.stillEmpty}{' '}
                    sem match
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <h3 className="font-semibold text-sm">Itens</h3>
                  </div>
                  <p className="text-2xl font-bold text-[#1A3A52]">
                    {report.itens.resolved}
                    <span className="text-sm font-normal text-muted-foreground">
                      {' '}
                      / {report.itens.total}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {report.itens.resolved} com produto vinculado · {report.itens.stillEmpty} sem
                    match
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-sm">
                    Códigos de cliente sem match ({report.unmatchedCodigoCliente.length})
                  </h3>
                </div>
                {report.unmatchedCodigoCliente.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum código sem correspondência.
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código do Cliente</TableHead>
                          <TableHead className="text-right">Pedidos afetados</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.unmatchedCodigoCliente.map((item) => (
                          <TableRow key={`cli-${item.codigo}`}>
                            <TableCell className="font-mono">{item.codigo || '(vazio)'}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{item.count}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-sm">
                    Códigos de produto sem match ({report.unmatchedCodigoProduto.length})
                  </h3>
                </div>
                {report.unmatchedCodigoProduto.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum código sem correspondência.
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código do Produto</TableHead>
                          <TableHead className="text-right">Itens afetados</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.unmatchedCodigoProduto.slice(0, 200).map((item) => (
                          <TableRow key={`prod-${item.codigo}`}>
                            <TableCell className="font-mono">{item.codigo || '(vazio)'}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{item.count}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum dado disponível.</p>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
