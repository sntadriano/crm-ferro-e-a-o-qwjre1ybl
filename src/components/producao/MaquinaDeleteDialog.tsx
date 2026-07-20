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
import { Maquina, softDeleteMaquina } from '@/services/maquinas'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  maquina: Maquina | null
  onSuccess: () => void
}

export function MaquinaDeleteDialog({ open, onOpenChange, maquina, onSuccess }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!maquina) return
    setLoading(true)
    try {
      await softDeleteMaquina(maquina.id)
      toast({ title: 'Máquina/Processo inativado com sucesso' })
      onSuccess()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao inativar máquina/processo',
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
            Isso irá inativar a máquina/processo <strong>{maquina?.nome}</strong>. O registro não
            será excluído permanentemente, mas não estará mais disponível como opção ativa.
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
