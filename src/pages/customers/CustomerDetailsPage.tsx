import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  User as UserIcon,
  MapPin,
  Phone,
  Mail,
  Activity,
  Edit,
  MessageSquare,
  Briefcase,
} from 'lucide-react'
import { useCustomers } from '@/hooks/use-customers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/customers/StatusBadge'
import { Separator } from '@/components/ui/separator'

export default function CustomerDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getCustomer } = useCustomers()
  const customer = getCustomer(id || '')

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-primary">Cliente não encontrado</h2>
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
            <div className="bg-primary/10 p-3 rounded-lg hidden sm:block">
              {isPJ ? (
                <Building2 className="h-6 w-6 text-primary" />
              ) : (
                <UserIcon className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary">
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
          <Button variant="outline" className="gap-2 flex-1 sm:flex-auto min-h-[44px]">
            <MessageSquare className="h-4 w-4" /> Criar novo lead
          </Button>
          <Button className="gap-2 flex-1 sm:flex-auto bg-secondary text-secondary-foreground hover:bg-secondary/90 min-h-[44px]">
            <Edit className="h-4 w-4" /> Editar Cliente
          </Button>
        </div>
      </div>

      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:inline-flex mb-4">
          <TabsTrigger value="visao-geral" className="font-semibold">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="leads" className="font-semibold">
            Leads Vinculados
          </TabsTrigger>
          <TabsTrigger value="historico" className="font-semibold">
            Histórico de Contatos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6 animate-fade-in">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-subtle border-muted">
              <CardHeader className="pb-3 border-b border-muted/50 mb-3">
                <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-accent" /> Identificação
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
                  <div className="text-muted-foreground font-medium">Loja:</div>
                  <div className="font-semibold text-right sm:text-left">
                    {customer.store || '-'}
                  </div>
                  <div className="text-muted-foreground font-medium">Nome da Mãe:</div>
                  <div className="font-semibold text-right sm:text-left">
                    {customer.motherName || '-'}
                  </div>
                  <div className="text-muted-foreground font-medium">Data Nasc/Fundação:</div>
                  <div className="font-semibold text-right sm:text-left">
                    {customer.birthDate || '-'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-subtle border-muted">
              <CardHeader className="pb-3 border-b border-muted/50 mb-3">
                <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                  <Activity className="h-5 w-5 text-accent" /> Gestão Comercial
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                  <div className="text-muted-foreground font-medium">Vendedor:</div>
                  <div className="font-semibold text-right sm:text-left">{customer.seller}</div>
                  <div className="text-muted-foreground font-medium">Região:</div>
                  <div className="font-semibold text-right sm:text-left">
                    {customer.region || '-'}
                  </div>
                  <div className="text-muted-foreground font-medium">Atividade:</div>
                  <div className="font-semibold text-right sm:text-left">
                    {customer.activity || '-'}
                  </div>
                  <div className="text-muted-foreground font-medium">Categoria Econômica:</div>
                  <div className="font-semibold text-right sm:text-left">
                    {customer.economicCategory || '-'}
                  </div>
                  <div className="text-muted-foreground font-medium">Data de Cadastro:</div>
                  <div className="font-semibold text-right sm:text-left">
                    {new Date(customer.registeredAt).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-muted-foreground font-medium">Último Pedido:</div>
                  <div className="font-semibold text-right sm:text-left">
                    {customer.lastOrderAt
                      ? new Date(customer.lastOrderAt).toLocaleDateString('pt-BR')
                      : 'Nenhum pedido'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-subtle border-muted">
              <CardHeader className="pb-3 border-b border-muted/50 mb-3">
                <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent" /> Endereços e Contato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8 text-sm">
                  <div className="space-y-4">
                    <div className="font-bold text-primary pb-2 border-b">
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
                      <Phone className="h-4 w-4 text-muted-foreground" />{' '}
                      <span>Fone Cobrança: {customer.billingPhone || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-3 font-medium">
                      <Mail className="h-4 w-4 text-muted-foreground" />{' '}
                      <span>Email: {customer.email || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-3 font-medium">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />{' '}
                      <span>Pessoa de Contato: {customer.contact || 'Não informado'}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="font-bold text-primary pb-2 border-b">
                      Endereços Registrados
                    </div>
                    <div className="space-y-3 bg-muted/20 p-4 rounded-lg border">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider">
                        Principal
                      </p>
                      {customer.address.street ? (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-accent mt-0.5 shrink-0" />
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

                    <div className="space-y-3 bg-muted/20 p-4 rounded-lg border">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider">
                        Cobrança
                      </p>
                      {customer.billingAddress && customer.billingAddress.street ? (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold">{customer.billingAddress.street}</p>
                            <p className="text-muted-foreground mt-1 font-medium">
                              Bairro: {customer.billingAddress.neighborhood}
                            </p>
                            <p className="text-muted-foreground font-medium">
                              Cidade: {customer.billingAddress.city} /{' '}
                              {customer.billingAddress.state}
                            </p>
                            <p className="text-muted-foreground font-medium">
                              CEP: {customer.billingAddress.zip}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground font-medium flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4" /> Mesmo endereço principal ou não cadastrado
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-bold text-primary">Nenhum lead vinculado</h3>
              <p className="text-sm font-medium text-muted-foreground mt-1 max-w-md">
                Este cliente ainda não possui leads comerciais ativos na plataforma.
              </p>
              <Button className="mt-6 min-h-[44px] bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Criar novo lead
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-8">
                <div className="flex gap-4 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center z-10">
                      <MessageSquare className="h-4 w-4 text-accent" />
                    </div>
                    <div className="w-px h-full bg-border absolute top-8 bottom-[-2rem] left-4"></div>
                  </div>
                  <div className="pb-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Há 2 dias</div>
                    <div className="font-bold text-primary">Mensagem via WhatsApp</div>
                    <div className="text-sm font-medium text-muted-foreground mt-1">
                      Contato inicial para apresentação do novo portfólio.
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center z-10">
                      <Mail className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="w-px h-full bg-border absolute top-8 bottom-[-2rem] left-4"></div>
                  </div>
                  <div className="pb-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Há 1 semana
                    </div>
                    <div className="font-bold text-primary">E-mail enviado</div>
                    <div className="text-sm font-medium text-muted-foreground mt-1">
                      Envio de proposta comercial solicitada.
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center z-10">
                      <Activity className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {new Date(customer.registeredAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="font-bold text-primary">Cliente Cadastrado</div>
                    <div className="text-sm font-medium text-muted-foreground mt-1">
                      Registro criado no sistema.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
