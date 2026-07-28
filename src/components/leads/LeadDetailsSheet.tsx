import { useEffect, useState } from 'react'
import { RecordModel } from 'pocketbase'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getContatosByCliente } from '@/services/contatos'
import { getLeadAuditLogs } from '@/services/audit_logs'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getClienteDisplayName, isPossivelCliente } from '@/lib/client-display'

export const statusColors: Record<string, string> = {
  novo: 'bg-[#4A90E2]/20 text-[#1A3A52] border-[#4A90E2]/30',
  proposta_enviada: 'bg-[#FFC107]/20 text-[#8B6914] border-[#FFC107]/30',
  fechado: 'bg-green-100 text-green-800 border-green-200',
  perdido: 'bg-red-100 text-red-800 border-red-200',
}

export const statusLabels: Record<string, string> = {
  novo: 'Novo',
  proposta_enviada: 'Proposta Enviada',
  fechado: 'Fechado',
  perdido: 'Perdido',
}

interface LeadDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: RecordModel | null
}

export function LeadDetailsSheet({ open, onOpenChange, lead }: LeadDetailsSheetProps) {
  const [contatos, setContatos] = useState<RecordModel[]>([])
  const [logs, setLogs] = useState<RecordModel[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && lead) {
      loadDetails()
    }
  }, [open, lead])

  const loadDetails = async () => {
    setLoading(true)
    try {
      const [contatosData, logsData] = await Promise.all([
        getContatosByCliente(lead!.cliente_id),
        getLeadAuditLogs(lead!.id),
      ])
      setContatos(contatosData)
      setLogs(logsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  if (!lead) return null

  const cliente = lead.expand?.cliente_id
  const usuario = lead.expand?.usuario_id
  const clienteNome = getClienteDisplayName(lead)
  const isPossivel = isPossivelCliente(lead)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Detalhes do Lead</SheetTitle>
          <SheetDescription>
            Criado em {format(new Date(lead.created), "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Cliente</h3>
            <div className="bg-secondary/50 p-3 rounded-md">
              <p className="font-semibold flex items-center gap-1.5">
                {isPossivel && <Star className="h-4 w-4 fill-emerald-500 text-emerald-500" />}
                {cliente ? (
                  <Link
                    to={`/clientes/${cliente.id}`}
                    className="hover:underline inline-flex items-center gap-1"
                  >
                    {clienteNome}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  <span>{clienteNome}</span>
                )}
              </p>
              {cliente?.cnpj_cpf && (
                <p className="text-sm text-muted-foreground">{cliente.cnpj_cpf}</p>
              )}
              {cliente?.fone && <p className="text-sm mt-1">{cliente.fone}</p>}
              {isPossivel && (
                <p className="text-xs text-emerald-700 mt-1 font-medium">
                  Possível Cliente (sem cadastro)
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
              <Badge className={statusColors[lead.status] || ''} variant="outline">
                {statusLabels[lead.status] || lead.status}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Possível Cliente</h3>
              {lead.possivel_cliente ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold">
                  <Star className="h-3 w-3 mr-1 fill-emerald-600 text-emerald-600" />
                  Sim
                </Badge>
              ) : (
                <p className="font-medium text-sm">Não</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Valor Estimado</h3>
              <p className="font-medium">{formatCurrency(lead.valor_estimado)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Próximo Follow-up</h3>
              <p className="text-sm">
                {lead.proximo_followup
                  ? format(new Date(lead.proximo_followup), "dd/MM/yyyy 'às' HH:mm")
                  : '-'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Responsável</h3>
              <p className="text-sm">{usuario?.name || 'Não atribuído'}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3">Histórico de Status</h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : logs.length > 0 ? (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="text-sm flex flex-col gap-1 bg-secondary/30 p-2 rounded"
                  >
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')} - {log.usuario_nome}
                    </span>
                    {log.acao === 'change_lead_status' ? (
                      <span>
                        Alterou de{' '}
                        <strong>{statusLabels[log.detalhes?.from] || log.detalhes?.from}</strong>{' '}
                        para <strong>{statusLabels[log.detalhes?.to] || log.detalhes?.to}</strong>
                      </span>
                    ) : (
                      <span>
                        Lead criado com status{' '}
                        <strong>
                          {statusLabels[log.detalhes?.status] || log.detalhes?.status}
                        </strong>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum histórico encontrado.</p>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3">Histórico de Contatos</h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : contatos.length > 0 ? (
              <div className="space-y-3">
                {contatos.map((contato) => (
                  <div key={contato.id} className="border p-3 rounded-md text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant="secondary" className="capitalize">
                        {contato.tipo}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(contato.data_contato), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <p className="mt-1">{contato.descricao}</p>
                    {contato.resultado && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Resultado: {contato.resultado}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum contato registrado com este cliente.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
