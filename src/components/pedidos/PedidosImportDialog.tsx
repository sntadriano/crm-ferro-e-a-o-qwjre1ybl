import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { importPedidos } from '@/services/pedidos'

interface PedidosImportDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}

export function PedidosImportDialog({ open, onOpenChange, onSuccess }: PedidosImportDialogProps) {
  const [jsonText, setJsonText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    try {
      const data = JSON.parse(jsonText)
      setLoading(true)
      const result = await importPedidos(data.pedidos || [], data.itens || [])
      toast.success(
        `Importação concluída: ${result.created} criados, ${result.updated} atualizados, ${result.itemsInserted} itens inseridos.`,
      )
      if (result.errors?.length > 0) {
        toast.warning(`${result.errors.length} erro(s) durante a importação.`)
      }
      setJsonText('')
      onOpenChange(false)
      onSuccess()
    } catch (e) {
      if (e instanceof SyntaxError) {
        toast.error('JSON inválido. Verifique o formato.')
      } else {
        toast.error('Erro ao importar pedidos.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Pedidos</DialogTitle>
          <DialogDescription>
            Cole o JSON no formato: {'{ "pedidos": [...], "itens": [...] }'}. Os itens devem ter o
            campo "numero" para vincular ao pedido.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='{ "pedidos": [{"numero": 1, "data": "2024-01-15", "vendedor": 2, "valor_pedido": 1500.00}], "itens": [{"numero": 1, "codigo_produto": "P001", "quantidade": 10, "valor_unitario": 150.00, "valor_total": 1500.00}] }'
          className="min-h-[300px] font-mono text-sm"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={loading || !jsonText.trim()}>
            {loading ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
