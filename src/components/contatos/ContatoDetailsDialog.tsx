import { RecordModel } from 'pocketbase'
import { format } from 'date-fns'
import {
  MessageSquare,
  MapPin,
  Mail,
  Calendar,
  Phone,
  Home,
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
    if (tipo === 'visita_presencial') return <Home className="h-5 w-5 text-blue-600" />
    if (tipo === 'telefone') return <Phone className="h-5 w-5 text-green-600" />
    if (tipo === 'whatsapp') return <MessageSquare className="h-5 w-5 text-blue-400" />
    if (tipo === 'visita') return <MapPin className="h-5 w-5 text-purple-500" />
    if (tipo === 'email') return <Mail className="h-5 w-5 text-purple-500" />
    return <Phone className="h-5 w-5 text-blue-500" />
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
                  <Calendar className="h-4 w-4" /> Data / Hora
                </p>
                <p className="font-medium">
                  {format(new Date(contato.data_contato), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status de Validação</p>
                <p className="font-medium">
                  {contato.status_validacao ? (
                    <Badge variant="outline" className="capitalize">
                      {contato.status_validacao}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Resultado</p>
                <p className="font-medium">
                  {contato.resultado ? (
                    <Badge variant="outline" className="capitalize">
                      {contato.resultado.replace(/_/g, ' ')}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Teve Pedido?</p>
                <p className="font-medium">
                  {contato.teve_pedido ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      Sim
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Não</Badge>
                  )}
                </p>
              </div>
              {contato.teve_pedido && contato.valor_pedido ? (
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <p className="text-sm text-muted-foreground">Valor do Pedido</p>
                  <p className="font-medium text-emerald-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      contato.valor_pedido,
                    )}
                  </p>
                </div>
              ) : null}
            </div>

            {contato.observacoes_resultado && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Observações do Resultado
                </h3>
                <div className="bg-muted/30 p-3 rounded-lg text-sm whitespace-pre-wrap leading-relaxed border border-border/50">
                  {contato.observacoes_resultado}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Observações Gerais</h3>
              <div className="bg-[#F5F5F5] p-4 rounded-lg text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                {contato.descricao || 'Nenhuma observação geral.'}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground bg-muted/20 p-3 rounded-md">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                <span className="font-medium">Registrado por:</span>{' '}
                {contato.expand?.usuario_id?.name || 'Sistema'}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-medium">Criado em:</span>{' '}
                {format(new Date(contato.created), 'dd/MM/yyyy HH:mm')}
              </div>
              {contato.updated && contato.updated !== contato.created && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Edit2 className="h-3.5 w-3.5" />
                  <span className="font-medium">Última edição em:</span>{' '}
                  {format(new Date(contato.updated), 'dd/MM/yyyy HH:mm')}
                </div>
              )}
              {contato.status_validacao &&
                contato.status_validacao !== 'pendente' &&
                contato.validado_por && (
                  <div className="flex items-center gap-2 sm:col-span-2 text-blue-600 mt-2 border-t pt-2">
                    <User className="h-3.5 w-3.5" />
                    <span className="font-medium">Validado por:</span>{' '}
                    {contato.expand?.validado_por?.name || 'Sistema'} em{' '}
                    {contato.data_validacao
                      ? format(new Date(contato.data_validacao), 'dd/MM/yyyy HH:mm')
                      : ''}
                  </div>
                )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive hover:text-white min-h-[44px]"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Deletar Contato
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                className="flex-1 sm:flex-none min-h-[44px] bg-[#4A90E2] text-white hover:bg-[#3A7BC8]"
                onClick={onEdit}
              >
                <Edit2 className="mr-2 h-4 w-4" /> Editar Contato
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
