import { RecordModel } from 'pocketbase'
import { format } from 'date-fns'
import {
  MessageSquare,
  MapPin,
  Mail,
  Calendar,
  User,
  Clock,
  Trash2,
  Edit2,
  Link as LinkIcon,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { deleteContato } from '@/services/contatos'
import { toast } from 'sonner'
import { LeadFormDialog } from '@/components/leads/LeadFormDialog'
import { useState } from 'react'

interface ContatoDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contato: RecordModel
  onEdit: () => void
}

export function ContatoDetailsDialog({
  open,
  onOpenChange,
  contato,
  onEdit,
}: ContatoDetailsDialogProps) {
  const [leadFormOpen, setLeadFormOpen] = useState(false)

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'whatsapp') return <MessageSquare className="h-5 w-5 text-green-500" />
    if (tipo === 'visita') return <MapPin className="h-5 w-5 text-orange-500" />
    if (tipo === 'email') return <Mail className="h-5 w-5 text-purple-500" />
    return null
  }

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este registro de contato?')) {
      try {
        await deleteContato(contato.id)
        toast.success('Contato excluído com sucesso')
        onOpenChange(false)
      } catch (err) {
        toast.error('Erro ao excluir contato')
      }
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[#1A3A52] flex items-center gap-2 capitalize">
              {getTipoIcon(contato.tipo)} Detalhes do Contato
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Cliente
              </h3>
              <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                <p className="font-bold text-[#1A3A52] text-lg">
                  {contato.expand?.cliente_id?.descricao || 'Desconhecido'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  CNPJ/CPF: {contato.expand?.cliente_id?.cnpj_cpf || 'Não informado'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Data do Contato
                </p>
                <p className="font-medium">
                  {format(new Date(contato.data_contato), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Resultado</p>
                <p className="font-medium">
                  {contato.resultado ? (
                    <Badge variant="outline" className="capitalize">
                      {contato.resultado}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Descrição</h3>
              <div className="bg-[#F5F5F5] p-4 rounded-lg text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                {contato.descricao}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" /> Registrado por:{' '}
                {contato.expand?.usuario_id?.name || 'Sistema'}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Criado em:{' '}
                {format(new Date(contato.created), 'dd/MM/yyyy')}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10 min-h-[44px]"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                className="flex-1 sm:flex-none min-h-[44px] bg-[#4A90E2] text-white hover:bg-[#3A7BC8]"
                onClick={onEdit}
              >
                <Edit2 className="mr-2 h-4 w-4" /> Editar
              </Button>
              <Button
                className="flex-1 sm:flex-none min-h-[44px] bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800] font-bold"
                onClick={() => {
                  onOpenChange(false)
                  setLeadFormOpen(true)
                }}
              >
                <LinkIcon className="mr-2 h-4 w-4" /> Criar Lead
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LeadFormDialog
        open={leadFormOpen}
        onOpenChange={setLeadFormOpen}
        initialClienteId={contato.cliente_id}
      />
    </>
  )
}
