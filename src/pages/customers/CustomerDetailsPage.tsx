import { useParams, useNavigate } from 'react-router-dom'
import {
  Building2,
  User as UserIcon,
  MapPin,
  Phone,
  Mail,
  Activity,
  Edit,
  MessageSquare,
  Briefcase,
  ArrowLeft,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/customers/StatusBadge'
import { Separator } from '@/components/ui/separator'
import { getContatosByCliente } from '@/services/contatos'
import { getLeads } from '@/services/leads'
import { useRealtime } from '@/hooks/use-realtime'
import { useVendedores } from '@/hooks/use-vendedores'
import { ContatoDetailsDialog } from '@/components/contatos/ContatoDetailsDialog'
import { ContatoFormDialog } from '@/components/contatos/ContatoFormDialog'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PhoneCall } from 'lucide-react'

export default function CustomerDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getVendedorName } = useVendedores()
  const [customer, setCustomer] = useState<any>(null)
  const [contatos, setContatos] = useState<RecordModel[]>([])
  const [leads, setLeads] = useState<RecordModel[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingLeads, setLoadingLeads] = useState(true)
  const [selectedContato, setSelectedContato] = useState<RecordModel | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  const loadContatos = () => {
    if (id) {
      getContatosByCliente(id).then((data) => setContatos(data || []))
    }
  }

  const loadLeads = () => {
    if (id) {
      getLeads(1, 50, { cliente_id: id })
        .then((data) => {
          setLeads(data.items || [])
          setLoadingLeads(false)
        })
        .catch(() => setLoadingLeads(false))
    }
  }

  useRealtime('contatos', () => {
    loadContatos()
  })

  useRealtime('leads', () => {
    loadLeads()
  })

  useEffect(() => {
    if (!id) return
    pb.collection('clientes')
      .getOne(id)
      .then((r) => {
        setCustomer({
          id: r.id,
          name: r.descricao,
          tradeName: r.fantasia,
          document: r.cnpj_cpf,
          code: r.codigo,
          status: r.status || 'Ativo',
          seller: r.vendedor?.toString(),
          registeredAt: r.cadastro || r.created,
          type: r.tipo === 'J' ? 'PJ' : 'PF',
          email: r.email,
          phone: r.fone,
          mobile: r.celular,
          stateRegistration: r.insc_estadual,
          address: {
            street: r.endereco,
            neighborhood: r.bairro,
            city: r.cidade,
            state: r.uf,
            zip: r.cep,
          },
        })
        loadContatos()
        loadLeads()
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-10 w-full max-w-sm rounded-md" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="md:col-span-2 h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-[#1A3A52]">Cliente não encontrado</h2>
        <Button onClick={() => navigate('/clientes')} variant="outline" className="min-h-[44px]">
          Voltar para lista
        </Button>
      </div>
    )
  }

  const isPJ = customer.type === 'PJ'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/clientes')}
            className="min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-[#1A3A52]/10 p-3 rounded-lg hidden sm:block">
              {isPJ ? (
                <Building2 className="h-6 w-6 text-[#1A3A52]" />
              ) : (
                <UserIcon className="h-6 w-6 text-[#1A3A52]" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1A3A52]">
                {customer.tradeName || customer.name}
              </h1>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mt-1">
                <span>{customer.code}</span>
                <Separator orientation="vertical" className="h-3" />
                <span>{customer.document}</span>
                <Separator orientation="vertical" className="h-3" />
                <StatusBadge status={customer.status} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <Button
            onClick={() => {
              setSelectedContato(null)
              setFormOpen(true)
            }}
            className="gap-2 flex-1 sm:flex-auto bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800] min-h-[44px] font-bold"
          >
            <MessageSquare className="h-4 w-4" /> Registrar Contato
          </Button>
          <Button className="gap-2 flex-1 sm:flex-auto bg-[#4A90E2] text-white hover:bg-[#3A7BC8] min-h-[44px]">
            <Edit className="h-4 w-4" /> Editar Cliente
          </Button>
        </div>
      </div>

      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:inline-flex mb-4 bg-muted">
          <TabsTrigger
            value="visao-geral"
            className="font-semibold data-[state=active]:bg-[#1A3A52] data-[state=active]:text-white"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger
            value="leads"
            className="font-semibold data-[state=active]:bg-[#1A3A52] data-[state=active]:text-white"
          >
            Leads Vinculados
          </TabsTrigger>
          <TabsTrigger
            value="historico"
            className="font-semibold data-[state=active]:bg-[#1A3A52] data-[state=active]:text-white"
          >
            Histórico de Contatos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6 animate-fade-in">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-subtle border-muted">
              <CardHeader className="pb-3 border-b border-muted/50 mb-3">
                <CardTitle className="text-lg font-bold text-[#1A3A52] flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-[#FFC107]" /> Identificação
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                  <div className="text-muted-foreground font-medium">Razão Social / Nome:</div>
                  <div className="font-semibold text-right sm:text-left">{customer.name}</div>
                  <div className="text-muted-foreground font-medium">Tipo de Cliente:</div>
                  <div className="font-semibold text-right sm:text-left">
                    {isPJ ? 'Pessoa Jurídica (PJ)' : 'Pessoa Física (PF)'}
                  </div>
                  <div className="text-muted-foreground font-medium">Nome Fantasia:</div>
                  <div className="font-semibold text-right sm:text-left">
                    {customer.tradeName || '-'}
                  </div>
                  <div className="text-muted-foreground font-medium">{isPJ ? 'CNPJ' : 'CPF'}:</div>
                  <div className="font-semibold text-right sm:text-left">{customer.document}</div>
                  <div className="text-muted-foreground font-medium">Inscrição Estadual:</div>
                  <div className="font-semibold text-right sm:text-left">
                    {customer.stateRegistration || 'Isento'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-subtle border-muted">
              <CardHeader className="pb-3 border-b border-muted/50 mb-3">
                <CardTitle className="text-lg font-bold text-[#1A3A52] flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#FFC107]" /> Gestão Comercial
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                  <div className="text-muted-foreground font-medium">Vendedor:</div>
                  <div className="font-semibold text-right sm:text-left">
                    {getVendedorName(customer.seller)}
                  </div>
                  <div className="text-muted-foreground font-medium">Data de Cadastro:</div>
                  <div className="font-semibold text-right sm:text-left">
                    {new Date(customer.registeredAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-subtle border-muted">
              <CardHeader className="pb-3 border-b border-muted/50 mb-3">
                <CardTitle className="text-lg font-bold text-[#1A3A52] flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#FFC107]" /> Endereços e Contato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8 text-sm">
                  <div className="space-y-4">
                    <div className="font-bold text-[#1A3A52] pb-2 border-b">
                      Informações de Contato
                    </div>
                    <div className="flex items-center gap-3 font-medium">
                      <Phone className="h-4 w-4 text-muted-foreground" />{' '}
                      <span>Telefone: {customer.phone || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-3 font-medium">
                      <Phone className="h-4 w-4 text-muted-foreground" />{' '}
                      <span>Celular: {customer.mobile || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-3 font-medium">
                      <Mail className="h-4 w-4 text-muted-foreground" />{' '}
                      <span>Email: {customer.email || 'Não informado'}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="font-bold text-[#1A3A52] pb-2 border-b">Endereço Principal</div>
                    <div className="space-y-3 bg-muted/20 p-4 rounded-lg border">
                      {customer.address.street ? (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-[#FFC107] mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold">{customer.address.street}</p>
                            <p className="text-muted-foreground mt-1 font-medium">
                              Bairro: {customer.address.neighborhood}
                            </p>
                            <p className="text-muted-foreground font-medium">
                              Cidade: {customer.address.city} / {customer.address.state}
                            </p>
                            <p className="text-muted-foreground font-medium">
                              CEP: {customer.address.zip}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Endereço principal não cadastrado
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads">
          <Card className="shadow-subtle border-muted">
            <CardContent className="p-6">
              <div className="space-y-4">
                {loadingLeads ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                  </div>
                ) : leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-bold text-[#1A3A52]">Nenhum lead vinculado</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1 max-w-md">
                      Este cliente ainda não possui leads comerciais ativos na plataforma.
                    </p>
                    <Button className="mt-6 min-h-[44px] font-bold bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800]">
                      Criar novo lead
                    </Button>
                  </div>
                ) : (
                  leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="border rounded-lg p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-bold text-[#1A3A52] flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Lead {lead.id.slice(0, 8).toUpperCase()}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 font-medium">
                          Criado em:{' '}
                          {format(new Date(lead.data_criacao || lead.created), 'dd/MM/yyyy')}
                        </div>
                        {lead.proximo_followup && (
                          <div className="text-sm text-muted-foreground font-medium">
                            Follow-up: {format(new Date(lead.proximo_followup), 'dd/MM/yyyy')}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        <Badge variant="outline" className="uppercase w-fit font-bold">
                          {lead.status.replace('_', ' ')}
                        </Badge>
                        <div className="font-bold text-lg text-emerald-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(lead.valor_estimado || 0)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card className="shadow-subtle border-muted">
            <CardContent className="p-6">
              <div className="space-y-8">
                {loading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-3 w-1/5" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : contatos.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center">
                    <PhoneCall className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-bold text-[#1A3A52]">Nenhum contato registrado</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
                      Não há histórico de interações para este cliente.
                    </p>
                    <Button
                      onClick={() => setFormOpen(true)}
                      className="mt-6 bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800] font-bold min-h-[44px]"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Registrar Contato
                    </Button>
                  </div>
                ) : (
                  contatos.map((contato, index) => {
                    const isLast = index === contatos.length - 1 && !customer.registeredAt
                    let icon = <Phone className="h-5 w-5 text-blue-600" />
                    let bg = 'bg-blue-100'
                    if (contato.tipo === 'email') {
                      icon = <Mail className="h-5 w-5 text-purple-600" />
                      bg = 'bg-purple-100'
                    }
                    if (contato.tipo === 'visita') {
                      icon = <MapPin className="h-5 w-5 text-green-600" />
                      bg = 'bg-green-100'
                    }
                    if (contato.tipo === 'whatsapp') {
                      icon = <MessageSquare className="h-5 w-5 text-blue-600" />
                      bg = 'bg-blue-100'
                    }

                    return (
                      <div
                        key={contato.id}
                        className="flex gap-4 relative cursor-pointer hover:bg-muted/30 p-2 rounded-lg transition-colors"
                        onClick={() => {
                          setSelectedContato(contato)
                          setDetailsOpen(true)
                        }}
                      >
                        <div className="flex flex-col items-center shrink-0">
                          <div
                            className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center z-10 shadow-sm border border-white`}
                          >
                            {icon}
                          </div>
                          {!isLast && (
                            <div className="w-[2px] h-full bg-border/60 absolute top-10 bottom-[-2rem] left-5"></div>
                          )}
                        </div>
                        <div className="pb-2 flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-[#1A3A52] capitalize">
                                {contato.tipo}
                              </div>
                              <div className="text-sm font-medium text-muted-foreground mb-1">
                                {format(new Date(contato.data_contato), 'dd/MM/yyyy HH:mm')}
                              </div>
                            </div>
                            {contato.resultado && (
                              <Badge variant="outline" className="capitalize">
                                {contato.resultado}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm font-medium text-muted-foreground mt-1 line-clamp-2">
                            {contato.descricao}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                {customer.registeredAt && (
                  <div className="flex gap-4 relative pl-[0.1rem]">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center z-10 shadow-sm border border-white">
                        <Activity className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-[#1A3A52]">Cliente Cadastrado</div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        {format(new Date(customer.registeredAt), 'dd/MM/yyyy HH:mm')}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground mt-1">
                        Registro inicial do cliente no sistema.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedContato && (
        <ContatoDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          contato={selectedContato}
          onEdit={() => {
            setDetailsOpen(false)
            setFormOpen(true)
          }}
        />
      )}

      <ContatoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        contato={selectedContato}
        initialClienteId={id}
      />
    </div>
  )
}
