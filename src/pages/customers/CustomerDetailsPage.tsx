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
  Clock,
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
        <h2 className="text-2xl font-bold">Cliente não encontrado</h2>
        <Button onClick={() => navigate('/clientes')} variant="outline">
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
          <Button variant="outline" size="icon" onClick={() => navigate('/clientes')}>
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
              <h1 className="text-2xl font-bold tracking-tight">
                {customer.tradeName || customer.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>{customer.code}</span>
                <Separator orientation="vertical" className="h-3" />
                <span>{customer.document}</span>
                <Separator orientation="vertical" className="h-3" />
                <StatusBadge status={customer.status} />
              </div>
            </div>
          </div>
        </div>
        <Button variant="secondary" className="gap-2 w-full sm:w-auto">
          <Edit className="h-4 w-4" /> Editar Cliente
        </Button>
      </div>

      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:inline-flex mb-4">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6 animate-fade-in">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-muted-foreground" /> Identificação
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">
                    {isPJ ? 'Razão Social' : 'Nome Completo'}:
                  </div>
                  <div className="font-medium text-right sm:text-left">{customer.name}</div>

                  {isPJ && (
                    <>
                      <div className="text-muted-foreground">Nome Fantasia:</div>
                      <div className="font-medium text-right sm:text-left">
                        {customer.tradeName || '-'}
                      </div>
                    </>
                  )}

                  <div className="text-muted-foreground">{isPJ ? 'CNPJ' : 'CPF'}:</div>
                  <div className="font-medium text-right sm:text-left">{customer.document}</div>

                  <div className="text-muted-foreground">Inscrição Estadual:</div>
                  <div className="font-medium text-right sm:text-left">
                    {customer.stateRegistration || 'Isento'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-muted-foreground" /> Gestão Comercial
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Vendedor:</div>
                  <div className="font-medium text-right sm:text-left">{customer.seller}</div>

                  <div className="text-muted-foreground">Data de Cadastro:</div>
                  <div className="font-medium text-right sm:text-left">
                    {new Date(customer.registeredAt).toLocaleDateString('pt-BR')}
                  </div>

                  <div className="text-muted-foreground">Último Pedido:</div>
                  <div className="font-medium text-right sm:text-left">
                    {customer.lastOrderAt
                      ? new Date(customer.lastOrderAt).toLocaleDateString('pt-BR')
                      : 'Nenhum pedido'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" /> Contato e Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.mobile || customer.phone || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.email || 'Não informado'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {customer.address.street ? (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p>{customer.address.street}</p>
                          <p>
                            {customer.address.neighborhood} - {customer.address.city}/
                            {customer.address.state}
                          </p>
                          <p className="text-muted-foreground">CEP: {customer.address.zip}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Endereço não cadastrado
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <UserIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhum lead vinculado</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Este cliente ainda não possui contatos ou leads vinculados na plataforma.
              </p>
              <Button className="mt-6" variant="outline">
                Adicionar Lead
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
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center z-10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="w-px h-full bg-border absolute top-8 bottom-[-2rem] left-4"></div>
                  </div>
                  <div className="pb-2">
                    <div className="text-sm text-muted-foreground mb-1">Hoje, 14:30</div>
                    <div className="font-medium">Visualização do perfil</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      O perfil foi acessado por Sistema.
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
                    <div className="text-sm text-muted-foreground mb-1">
                      {new Date(customer.registeredAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="font-medium">Cliente Cadastrado</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Registro criado inicialmente.
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
