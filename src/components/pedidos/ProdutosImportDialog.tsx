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
import { importProdutos } from '@/services/produtos'

interface ProdutosImportDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}

export function ProdutosImportDialog({ open, onOpenChange, onSuccess }: ProdutosImportDialogProps) {
  const [jsonText, setJsonText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    try {
      const data = JSON.parse(jsonText)
      setLoading(true)
      const result = await importProdutos(data.produtos || data || [])
      toast.success(
        `Importação concluída: ${result.created} criados, ${result.updated} atualizados.`,
      )
      setJsonText('')
      onOpenChange(false)
      onSuccess()
    } catch (e) {
      if (e instanceof SyntaxError) {
        toast.error('JSON inválido. Verifique o formato.')
      } else {
        toast.error('Erro ao importar produtos.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Produtos</DialogTitle>
          <DialogDescription>
            Cole o JSON no formato:{' '}
            {
              '{ "produtos": [{"codigo": "P001", "descricao": "Produto 1", "unidade": "UN", "custo": 10.50}] }'
            }
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='{ "produtos": [{"codigo": "P001", "descricao": "Armação 6mm", "unidade": "Unidades", "custo": 15.00}] }'
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
