import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ItemProducao, softDeleteItemProducao } from '@/services/itens_producao'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ItemProducao | null
  onSuccess: () => void
}

export function ItemProducaoDeleteDialog({ open, onOpenChange, item, onSuccess }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!item) return
    setLoading(true)
    try {
      await softDeleteItemProducao(item.id)
      toast({ title: 'Item inativado com sucesso' })
      onSuccess()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao inativar item',
        description: getErrorMessage(error),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso irá inativar o item <strong>{item?.nome}</strong>. O item não será excluído
            permanentemente, mas não estará mais disponível como opção ativa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Inativando...' : 'Inativar'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
