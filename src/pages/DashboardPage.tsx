import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pie, PieChart, Cell } from 'recharts'
import {
  Users,
  Target,
  Activity,
  Percent,
  AlertCircle,
  Database,
  Phone,
  Clock,
  ArrowRight,
  ShieldAlert,
  BellRing,
} from 'lucide-react'
import { ContatoFormDialog } from '@/components/contatos/ContatoFormDialog'
import { ACTIVE_CLIENT_FILTER, INACTIVE_CLIENT_FILTER } from '@/lib/client-metrics'
import { useCustomers } from '@/hooks/use-customers'
import { formatClientDisplayName } from '@/lib/entity-labels'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'

type DashboardData = {
  clients: { total: number; active: number; inactive: number }
  leads: {
    total: number
    novo: number
    proposta: number
    fechado: number
    perdido: number
    expirado: number
  }
  contacts: { recent: any[]; last24h: number; last7d: number; last30d: number }
  pendingFollowups: any[]
}

const chartConfig = {
  novo: { label: 'Novo', color: '#FFC107' },
  proposta: { label: 'Proposta', color: '#3b82f6' },
  fechado: { label: 'Fechado', color: '#10b981' },
  perdido: { label: 'Perdido', color: '#ef4444' },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { customers } = useCustomers()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)

  const [contatoOpen, setContatoOpen] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError(false)
    try {
      // General Summary (Clientes)
      const clientsAll = await pb.collection('clientes').getList(1, 1)
      const clientsActive = await pb
        .collection('clientes')
        .getList(1, 1, { filter: ACTIVE_CLIENT_FILTER })
      const clientsInactive = await pb
        .collection('clientes')
        .getList(1, 1, { filter: INACTIVE_CLIENT_FILTER })

      // Leads Summary
      const leadsAll = await pb.collection('leads').getList(1, 1)
      const leadsNovo = await pb.collection('leads').getList(1, 1, { filter: "status = 'novo'" })
      const leadsProp = await pb
        .collection('leads')
        .getList(1, 1, { filter: "status = 'proposta_enviada'" })
      const leadsFech = await pb.collection('leads').getList(1, 1, { filter: "status = 'fechado'" })
      const leadsPerd = await pb.collection('leads').getList(1, 1, { filter: "status = 'perdido'" })
      const leadsExp = await pb.collection('leads').getList(1, 1, { filter: "status = 'expirado'" })

      const now = new Date()
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ')
      let pendingFollowupsRes = { items: [] }
      try {
        pendingFollowupsRes = await pb.collection('leads').getList(1, 10, {
          filter: `status != 'fechado' && status != 'perdido' && proximo_followup != '' && proximo_followup <= '${in24h}'`,
          sort: 'proximo_followup',
          expand: 'cliente_id',
        })
      } catch {
        /* intentionally ignored */
      }

      // Contacts Summary
      let contatos = []
      let c24 = 0,
        c7 = 0,
        c30 = 0

      // Gerente has no access to contatos details, so we bypass fetching them
      if (user?.role !== 'gerente') {
        try {
          const cRecent = await pb
            .collection('contatos')
            .getList(1, 10, { sort: '-data_contato', expand: 'cliente_id' })
          contatos = cRecent.items

          const now = Date.now()
          const d24h = new Date(now - 86400000).toISOString().replace('T', ' ').substring(0, 19)
          const d7d = new Date(now - 7 * 86400000).toISOString().replace('T', ' ').substring(0, 19)
          const d30d = new Date(now - 30 * 86400000)
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19)

          const r24 = await pb
            .collection('contatos')
            .getList(1, 1, { filter: `data_contato >= '${d24h}'` })
          const r7 = await pb
            .collection('contatos')
            .getList(1, 1, { filter: `data_contato >= '${d7d}'` })
          const r30 = await pb
            .collection('contatos')
            .getList(1, 1, { filter: `data_contato >= '${d30d}'` })

          c24 = r24.totalItems
          c7 = r7.totalItems
          c30 = r30.totalItems
        } catch (e) {
          console.warn('Failed to fetch contatos, user might have restricted access.')
        }
      }

      setData({
        clients: {
          total: clientsAll.totalItems,
          active: clientsActive.totalItems,
          inactive: clientsInactive.totalItems,
        },
        leads: {
          total: leadsAll.totalItems,
          novo: leadsNovo.totalItems,
          proposta: leadsProp.totalItems,
          fechado: leadsFech.totalItems,
          perdido: leadsPerd.totalItems,
          expirado: leadsExp.totalItems,
        },
        contacts: { recent: contatos, last24h: c24, last7d: c7, last30d: c30 },
        pendingFollowups: pendingFollowupsRes.items,
      })
      setLoading(false)
    } catch (err) {
      console.error(err)
      setError(true)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role !== 'paulo') {
      fetchData()
    }
  }, [user])

  if (user?.role === 'paulo') {
    return (
      <div className="flex h-[80vh] items-center justify-center px-4">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="text-lg">Acesso Negado</AlertTitle>
          <AlertDescription className="mt-2">
            Seu perfil ({user.role}) não possui permissão para visualizar o dashboard operacional.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-4 grid-cols-2">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Alert variant="destructive" className="max-w-md bg-red-50 text-red-900 border-red-200">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription className="mb-4 mt-2">
            Não foi possível carregar as informações do dashboard no momento.
          </AlertDescription>
          <Button onClick={fetchData} className="w-full bg-[#FFC107] text-black hover:bg-[#e0a800]">
            Tentar novamente
          </Button>
        </Alert>
      </div>
    )
  }

  if (!data) return null

  const isEmpty = data.clients.total === 0 && data.leads.total === 0
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-gray-50 border-dashed">
        <Database className="h-16 w-16 text-gray-300 mb-6" />
        <h2 className="text-2xl font-bold text-[#1A3A52] mb-2">Nenhum dado disponível</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Seu CRM ainda não possui registros. Comece adicionando seu primeiro cliente para gerar as
          métricas.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-[#FFC107] text-black hover:bg-[#e0a800] font-medium"
        >
          <Link to="/clientes/novo">
            Registrar cliente <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  const healthRatio =
    data.clients.total > 0 ? Math.round((data.clients.active / data.clients.total) * 100) : 0
  const conversion =
    data.leads.total > 0 ? Math.round((data.leads.fechado / data.leads.total) * 100) : 0

  const pieData = [
    { id: 'novo', name: 'Novo', value: data.leads.novo, fill: 'var(--color-novo)' },
    { id: 'proposta', name: 'Proposta', value: data.leads.proposta, fill: 'var(--color-proposta)' },
    { id: 'fechado', name: 'Fechado', value: data.leads.fechado, fill: 'var(--color-fechado)' },
    { id: 'perdido', name: 'Perdido', value: data.leads.perdido, fill: 'var(--color-perdido)' },
  ].filter((item) => item.value > 0)

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1A3A52]">Visão Geral</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe as métricas e o desempenho do seu CRM.
        </p>
      </div>

      {/* General Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-t-4 border-t-[#1A3A52] shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A3A52]">{data.clients.total}</div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-green-500 shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{data.clients.active}</div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-red-400 shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Clientes Inativos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{data.clients.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* 2x2 Metrics + Chart */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Card className="shadow-subtle">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Saúde da Base</CardTitle>
              <Activity className="h-4 w-4 text-[#1A3A52]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthRatio}%</div>
              <p className="text-xs text-muted-foreground mt-1">Proporção de clientes ativos</p>
            </CardContent>
          </Card>

          <Card className="shadow-subtle">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Percent className="h-4 w-4 text-[#1A3A52]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversion}%</div>
              <p className="text-xs text-muted-foreground mt-1">Leads fechados sobre o total</p>
            </CardContent>
          </Card>

          <Card className="shadow-subtle">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Pipeline de Leads</CardTitle>
              <Target className="h-4 w-4 text-[#FFC107]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.leads.total - data.leads.expirado}</div>
              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                {' '}
                <span className="text-[#FFC107] font-semibold">N: {data.leads.novo}</span>
                <span className="text-blue-500 font-semibold">P: {data.leads.proposta}</span>
                <span className="text-green-500 font-semibold">F: {data.leads.fechado}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-subtle">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Frequência (Contatos)</CardTitle>
              <Phone className="h-4 w-4 text-[#1A3A52]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.contacts.last30d}</div>
              <p className="text-xs text-muted-foreground mt-1">
                24h: {data.contacts.last24h} | 7d: {data.contacts.last7d}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle className="text-[#1A3A52]">Distribuição de Leads</CardTitle>
            <CardDescription>Status atual de oportunidades no pipeline.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.leads.total === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Nenhum lead em andamento.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="mx-auto h-[220px]">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        className="stroke-background hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Follow-ups Table */}
      {data.pendingFollowups.length > 0 && (
        <Card className="shadow-subtle border-l-4 border-l-red-500 mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <BellRing className="h-5 w-5" /> Follow-ups Pendentes
              </CardTitle>
              <CardDescription>
                Oportunidades que exigem atenção imediata (vencem em ≤ 24h ou atrasadas).
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/leads">Ir para Leads</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.pendingFollowups.map((lead) => {
                    const isOverdue = new Date(lead.proximo_followup) < new Date()
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium text-[#1A3A52]">
                          {formatClientDisplayName(lead.expand?.cliente_id, customers)}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(lead.valor_estimado || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isOverdue ? 'destructive' : 'secondary'}
                            className={!isOverdue ? 'bg-yellow-100 text-yellow-800' : ''}
                          >
                            {isOverdue ? 'Atrasado' : 'Vence hoje'}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(lead.proximo_followup), 'dd/MM/yyyy HH:mm', {
                              locale: ptBR,
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedClienteId(lead.cliente_id)
                              setContatoOpen(true)
                            }}
                          >
                            Registrar Contato
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Contacts Table */}
      {user?.role !== 'gerente' && (
        <Card className="shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[#1A3A52]">Contatos Recentes</CardTitle>
              <CardDescription>Últimas 10 interações registradas no sistema.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/contatos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="min-w-[200px]">Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.contacts.recent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                        Nenhum contato recente encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.contacts.recent.map((c) => (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => navigate(`/clientes/${c.cliente_id}`)}
                      >
                        <TableCell className="font-medium text-[#1A3A52]">
                          {formatClientDisplayName(c.expand?.cliente_id, customers)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              c.tipo === 'whatsapp'
                                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                : c.tipo === 'visita'
                                  ? 'bg-[#1A3A52]/10 text-[#1A3A52] hover:bg-[#1A3A52]/10'
                                  : 'bg-orange-100 text-orange-800 hover:bg-orange-100'
                            }
                          >
                            {c.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {c.data_contato
                            ? format(new Date(c.data_contato), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                            : '-'}
                        </TableCell>
                        <TableCell
                          className="max-w-[300px] truncate text-muted-foreground"
                          title={c.descricao}
                        >
                          {c.descricao || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <ContatoFormDialog
        open={contatoOpen}
        onOpenChange={setContatoOpen}
        clienteId={selectedClienteId}
        onSuccess={fetchData}
      />
    </div>
  )
}
