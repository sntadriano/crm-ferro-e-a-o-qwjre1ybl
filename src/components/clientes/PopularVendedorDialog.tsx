import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, CheckCircle2, Wand2 } from 'lucide-react'
import {
  popularVendedorReport,
  popularVendedorApply,
  type PopularVendedorResult,
} from '@/services/clientes-vendedor'
import { toast } from 'sonner'

interface PopularVendedorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplied?: () => void
}

export function PopularVendedorDialog({
  open,
  onOpenChange,
  onApplied,
}: PopularVendedorDialogProps) {
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [report, setReport] = useState<PopularVendedorResult | null>(null)

  const loadReport = async () => {
    setLoading(true)
    try {
      const res = await popularVendedorReport()
      setReport(res)
    } catch (e) {
      toast.error('Erro ao gerar relatório de vendedores')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    setApplying(true)
    try {
      const res = await popularVendedorApply()
      toast.success(res.updated + ' clientes atualizados com sucesso')
      setReport(res)
      if (onApplied) onApplied()
    } catch (e) {
      toast.error('Erro ao aplicar atualização de vendedores')
    } finally {
      setApplying(false)
    }
  }

  const handleClose = (v: boolean) => {
    onOpenChange(v)
    if (!v) setReport(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A3A52]">
            <Wand2 className="h-5 w-5" /> Popular Vendedor nos Clientes
          </DialogTitle>
        </DialogHeader>

        {!report && !loading && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Esta ferramenta analisa os pedidos de cada cliente e preenche o campo{' '}
              <strong>vendedor</strong> com o vendedor mais frequente nos pedidos daquele cliente.
            </p>
            <p className="text-sm text-muted-foreground">
              Primeiro será gerado um relatório. Após revisão, você poderá confirmar e aplicar as
              alterações.
            </p>
            <Button onClick={loadReport} className="w-full min-h-[44px]">
              <Wand2 className="mr-2 h-4 w-4" /> Gerar Relatório
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {report && !loading && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/30 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-[#1A3A52]">{report.totalClientes}</p>
                <p className="text-xs text-muted-foreground">Total Clientes</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-emerald-600">{report.resolved}</p>
                <p className="text-xs text-muted-foreground">Com Vendedor</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-amber-600">{report.unresolved}</p>
                <p className="text-xs text-muted-foreground">Sem Pedidos</p>
              </div>
            </div>

            {!report.apply && report.wouldUpdate > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {report.wouldUpdate} clientes terão o vendedor atualizado
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Revise os detalhes abaixo antes de confirmar.
                  </p>
                </div>
              </div>
            )}

            {report.apply && report.updated > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-emerald-800">
                  {report.updated} clientes foram atualizados com sucesso!
                </p>
              </div>
            )}

            {report.details.length > 0 && (
              <div className="max-h-[200px] overflow-y-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2">Cliente</th>
                      <th className="text-right p-2">Anterior</th>
                      <th className="text-right p-2">Novo</th>
                      <th className="text-right p-2">Pedidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.details.map((d) => (
                      <tr key={d.cliente_id} className="border-t">
                        <td className="p-2 truncate max-w-[200px]">{d.descricao}</td>
                        <td className="text-right p-2">{d.vendedor_anterior || '-'}</td>
                        <td className="text-right p-2 font-medium">{d.vendedor_novo}</td>
                        <td className="text-right p-2">{d.total_pedidos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!report.apply && report.wouldUpdate > 0 && (
              <DialogFooter>
                <Button variant="outline" onClick={() => handleClose(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={applying}
                  className="bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800] font-bold"
                >
                  {applying ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Confirmar e Aplicar
                </Button>
              </DialogFooter>
            )}

            {!report.apply && report.wouldUpdate === 0 && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => handleClose(false)}>
                  Fechar
                </Button>
              </div>
            )}

            {report.apply && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => handleClose(false)}>
                  Fechar
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
