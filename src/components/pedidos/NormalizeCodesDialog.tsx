import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'
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
import { normalizeProdutoCodes, type NormalizeReport } from '@/services/produtos'

interface NormalizeCodesDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}

export function NormalizeCodesDialog({ open, onOpenChange, onSuccess }: NormalizeCodesDialogProps) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<NormalizeReport | null>(null)

  const handleNormalize = async () => {
    setLoading(true)
    try {
      const result = await normalizeProdutoCodes()
      setReport(result)
      if (result.success) {
        toast.success(result.message)
        onSuccess()
      } else {
        toast.warning(result.message)
      }
    } catch (e) {
      toast.error('Erro ao normalizar códigos.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = (v: boolean) => {
    if (!v) setReport(null)
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Normalizar Códigos de Produtos</DialogTitle>
          <DialogDescription>
            Remove hífens de códigos como <code>&quot;8-6&quot;</code> → <code>&quot;86&quot;</code>
            , <code>&quot;116-3&quot;</code> → <code>&quot;1163&quot;</code> em{' '}
            <code>produtos.codigo</code> e <code>pedido_itens.codigo_produto</code>. Verifica
            colisões antes de aplicar.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-3 text-sm text-muted-foreground">Processando registros...</span>
          </div>
        ) : report ? (
          <ScrollArea className="max-h-[55vh] pr-4">
            <div className="space-y-4">
              {report.success ? (
                <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800">{report.message}</p>
                    <p className="text-sm text-green-700 mt-1">
                      Produtos atualizados: <strong>{report.produtosUpdated}</strong> · Itens de
                      pedido atualizados: <strong>{report.itensUpdated}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">{report.message}</p>
                    <p className="text-sm text-amber-700 mt-1">
                      {report.collisions.length} colisão(ões) detectada(s). Nenhum registro foi
                      alterado.
                    </p>
                  </div>
                </div>
              )}

              {report.collisions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <h3 className="font-semibold text-sm">Colisões detectadas</h3>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código normalizado</TableHead>
                          <TableHead>Código original</TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Descrição</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.collisions.map((c) =>
                          c.items.map((item, idx) => (
                            <TableRow key={`${c.normalized}-${item.id}-${idx}`}>
                              <TableCell className="font-mono">
                                {idx === 0 ? c.normalized : ''}
                              </TableCell>
                              <TableCell className="font-mono">{item.original}</TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {item.id}
                              </TableCell>
                              <TableCell>{item.descricao || '-'}</TableCell>
                            </TableRow>
                          )),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Esta ação varre todos os produtos e itens de pedido, removendo hífens dos códigos no
              formato &quot;número-dígito&quot;.
            </p>
            <p className="text-sm text-muted-foreground">
              Antes de aplicar, o sistema verifica se a normalização causaria duplicidade de
              códigos. Se houver colisão, nenhum registro será alterado e o relatório será exibido.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Fechar
          </Button>
          {!report?.success && (
            <Button onClick={handleNormalize} disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {report?.collisions.length ? 'Tentar novamente' : 'Iniciar normalização'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
