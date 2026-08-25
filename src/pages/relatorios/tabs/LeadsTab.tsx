import { useState, useEffect, useMemo } from 'react'
import { Target, TrendingUp, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import pb from '@/lib/pocketbase/client'
import { StateDisplay } from '../components/StateDisplay'
import { format, subDays } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { canExport } from '@/lib/permissions'
import { ExportDropdown } from '@/components/shared/ExportDropdown'

const STATUS_COLORS: Record<string, string> = {
  novo: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  proposta_enviada: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  fechado: 'bg-green-100 text-green-800 hover:bg-green-100',
  perdido: 'bg-red-100 text-red-800 hover:bg-red-100',
  expirado: 'bg-gray-200 text-gray-700 hover:bg-gray-200',
}

const PIE_COLORS = ['#FFC107', '#3b82f6', '#10b981', '#ef4444', '#9ca3af']

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    novo: 'Novo',
    proposta_enviada: 'Proposta Enviada',
    fechado: 'Fechado',
    perdido: 'Perdido',
    expirado: 'Expirado',
  }
  return map[status] || status || 'Indefinido'
}

export function LeadsTab({ filters, refreshKey }: any) {
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sortField, setSortField] = useState<'date' | 'status'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        let f: string[] = []
        if (filters.dateStart)
          f.push(`created >= '${new Date(filters.dateStart + 'T00:00:00').toISOString()}'`)
        if (filters.dateEnd)
          f.push(`created <= '${new Date(filters.dateEnd + 'T23:59:59').toISOString()}'`)
        if (filters.vendedorId) f.push(`usuario_id = '${filters.vendedorId}'`)

        const res = await pb.collection('leads').getFullList({
          filter: f.join(' && '),
          expand: 'cliente_id,usuario_id',
          sort: '-created',
        })
        if (isMounted) setData(res)
      } catch (e) {
        if (isMounted) setError(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [filters, refreshKey])

  const total = data.length
  const fechados = data.filter((d) => d.status === 'fechado').length
  const conversionRate = total > 0 ? (fechados / total) * 100 : 0
  const totalValue = data.reduce((acc, curr) => acc + (curr.valor_estimado || 0), 0)

  const statusCounts = data.reduce(
    (acc, curr) => {
      const s = curr.status || 'Indefinido'
      acc[s] = (acc[s] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const barData = Object.entries(statusCounts)
    .map(([name, value]) => ({ name: formatStatus(name), rawName: name, value: Number(value) }))
    .sort((a, b) => Number(b.value) - Number(a.value))

  const pieData = Object.entries(statusCounts)
    .map(([name, value]) => ({ name: formatStatus(name), value: Number(value) }))
    .filter((item) => Number(item.value) > 0)

  const endRef = filters.dateEnd ? new Date(filters.dateEnd + 'T00:00:00') : new Date()
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(endRef, 6 - i)
    return format(d, 'yyyy-MM-dd')
  })

  const lineData = last7Days.map((date) => {
    const count = data.filter((d) => d.created.startsWith(date)).length
    return { date: format(new Date(date + 'T00:00:00'), 'dd/MM'), value: count }
  })

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy')
    } catch {
      return '-'
    }
  }

  const sortedData = useMemo(() => {
    if (!data.length) return []
    const sorted = [...data]
    if (sortField === 'date') {
      sorted.sort((a, b) => {
        const da = new Date(a.data_criacao || a.created).getTime()
        const db = new Date(b.data_criacao || b.created).getTime()
        return sortDirection === 'asc' ? da - db : db - da
      })
    } else {
      sorted.sort((a, b) => {
        const sa = a.status || ''
        const sb = b.status || ''
        return sortDirection === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
      })
    }
    return sorted
  }, [data, sortField, sortDirection])

  return (
    <StateDisplay
      loading={loading}
      error={error}
      empty={!loading && !error && data.length === 0}
      onRetry={() => {}}
    >
      {canExport(user?.role, 'leads', user?.email) && data.length > 0 && (
        <div className="flex justify-end mb-4">
          <ExportDropdown
            data={data.map((d) => ({
              cliente: d.expand?.cliente_id?.descricao || 'Desconhecido',
              status_fmt: formatStatus(d.status),
              valor_estimado_fmt: formatCurrency(d.valor_estimado),
              data_criacao_fmt: formatDate(d.data_criacao || d.created),
            }))}
            columns={[
              { header: 'Cliente', key: 'cliente' },
              { header: 'Status', key: 'status_fmt' },
              { header: 'Valor Estimado', key: 'valor_estimado_fmt' },
              { header: 'Data de Criação', key: 'data_criacao_fmt' },
            ]}
            filename="relatorio_leads"
            title="Relatório Gerencial - Leads"
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{fechados} leads fechados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Estimado Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leads por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ value: { label: 'Leads', color: 'hsl(var(--chart-2))' } }}
              className="h-[300px] w-full"
            >
              <BarChart data={barData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChartContainer config={{ value: { label: 'Leads' } }} className="h-[300px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }: any) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução (Últimos 7 dias ref. data final)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ value: { label: 'Novos Leads', color: 'hsl(var(--chart-3))' } }}
            className="h-[300px] w-full"
          >
            <LineChart data={lineData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Porcentagem</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {barData.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right">{Number(row.value)}</TableCell>
                  <TableCell className="text-right">
                    {total > 0 ? ((Number(row.value) / total) * 100).toFixed(1) : 0}%
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      data
                        .filter((d) => (d.status || 'Indefinido') === row.rawName)
                        .reduce((acc, curr) => acc + (curr.valor_estimado || 0), 0),
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle>Detalhamento de Leads</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>
                  <button
                    className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    onClick={() => {
                      if (sortField === 'status') {
                        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
                      } else {
                        setSortField('status')
                        setSortDirection('asc')
                      }
                    }}
                  >
                    Status
                    {sortField === 'status' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </TableHead>
                <TableHead className="text-right">Valor Estimado</TableHead>
                <TableHead>
                  <button
                    className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    onClick={() => {
                      if (sortField === 'date') {
                        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
                      } else {
                        setSortField('date')
                        setSortDirection('desc')
                      }
                    }}
                  >
                    Data de Criação
                    {sortField === 'date' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                    Nenhum lead encontrado no período.
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((lead) => (
                  <TableRow key={lead.id} className="transition-colors hover:bg-slate-50">
                    <TableCell
                      className="font-medium max-w-[250px] truncate"
                      title={lead.expand?.cliente_id?.descricao}
                    >
                      {lead.expand?.cliente_id?.descricao || 'Desconhecido'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          STATUS_COLORS[lead.status] ||
                          'bg-gray-100 text-gray-800 hover:bg-gray-100'
                        }
                      >
                        {formatStatus(lead.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(lead.valor_estimado)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(lead.data_criacao || lead.created)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </StateDisplay>
  )
}
