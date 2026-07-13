import { useState, useEffect } from 'react'
import { PhoneCall, CalendarDays, TrendingUp, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import pb from '@/lib/pocketbase/client'
import { StateDisplay } from '../components/StateDisplay'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { canExport } from '@/lib/permissions'
import { ExportDropdown } from '@/components/shared/ExportDropdown'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ContatosTab({ filters, refreshKey, usersList }: any) {
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reportType, setReportType] = useState('resumo')

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        let f = []
        if (filters.dateStart)
          f.push(`data_contato >= '${new Date(filters.dateStart + 'T00:00:00').toISOString()}'`)
        if (filters.dateEnd)
          f.push(`data_contato <= '${new Date(filters.dateEnd + 'T23:59:59').toISOString()}'`)
        if (filters.vendedorId) f.push(`usuario_id = '${filters.vendedorId}'`)

        f.push("status_validacao != 'rejeitado'") // Ignore rejected

        const res = await pb.collection('contatos').getFullList({
          filter: f.join(' && '),
          expand: 'usuario_id,cliente_id',
          sort: '-data_contato',
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

  const formatResultado = (res: string) => {
    const map: Record<string, string> = {
      visitado_com_sucesso: 'Sucesso',
      tentou_nao_encontrou: 'Não Encontrou',
      recusou_atendimento: 'Recusou',
      nao_estava: 'Ausente',
      outro: 'Outro',
    }
    return map[res] || res
  }

  const exportData = data.map((d) => ({
    ...d,
    cliente: d.expand?.cliente_id?.descricao || 'Desconhecido',
    vendedor: d.expand?.usuario_id?.name || 'Desconhecido',
    data_fmt: format(new Date(d.data_contato), 'dd/MM/yyyy'),
    hora_fmt: d.hora || format(new Date(d.data_contato), 'HH:mm'),
    resultado_fmt: formatResultado(d.resultado),
    pedido_fmt: d.teve_pedido ? 'Sim' : 'Não',
    valor_fmt: d.valor_pedido ? `R$ ${d.valor_pedido.toFixed(2)}` : '-',
  }))

  // KPIs for Resumo and Detalhado
  const total = data.length
  const totalVisitas = data.filter((d) => d.tipo === 'visita_presencial').length
  const totalPedidos = data.filter((d) => d.teve_pedido).length
  const totalValor = data.reduce((acc, curr) => acc + (curr.valor_pedido || 0), 0)
  const taxaConversao = totalVisitas > 0 ? ((totalPedidos / totalVisitas) * 100).toFixed(1) : '0.0'

  // Charts for Detalhado
  const resultsCount = data.reduce(
    (acc, curr) => {
      const r = formatResultado(curr.resultado) || 'Sem Resultado'
      acc[r] = (acc[r] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const resultsChartData = Object.entries(resultsCount).map(([name, value]) => ({ name, value }))
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  const hourlyCount = data.reduce(
    (acc, curr) => {
      const h = curr.hora ? curr.hora.split(':')[0] : format(new Date(curr.data_contato), 'HH')
      acc[h] = (acc[h] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const hourlyChartData = Object.entries(hourlyCount)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([name, value]) => ({ name: `${name}h`, value }))

  return (
    <StateDisplay
      loading={loading}
      error={error}
      empty={!loading && !error && data.length === 0}
      onRetry={() => {}}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-muted-foreground">Visão do Relatório:</span>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basico">Básico (Lista)</SelectItem>
              <SelectItem value="resumo">Resumo (KPIs)</SelectItem>
              <SelectItem value="detalhado">Detalhado (Gráficos)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {canExport(user?.role, 'contatos', user?.email) && data.length > 0 && (
          <ExportDropdown
            data={exportData}
            columns={[
              { header: 'Data', key: 'data_fmt' },
              { header: 'Hora', key: 'hora_fmt' },
              { header: 'Vendedor', key: 'vendedor' },
              { header: 'Cliente', key: 'cliente' },
              { header: 'Tipo', key: 'tipo' },
              { header: 'Resultado', key: 'resultado_fmt' },
              { header: 'Pedido', key: 'pedido_fmt' },
              { header: 'Valor (R$)', key: 'valor_pedido' },
              { header: 'Observações', key: 'descricao' },
            ]}
            filename="relatorio_atividades"
            title={`Relatório de Atividades - ${reportType.toUpperCase()}`}
          />
        )}
      </div>

      {(reportType === 'resumo' || reportType === 'detalhado') && (
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Atividades</CardTitle>
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Visitas Físicas</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVisitas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Fechados</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPedidos}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Conversão de {taxaConversao}% nas visitas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Valor em Pedidos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === 'detalhado' && (
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Resultados das Atividades</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ChartContainer config={{}} className="h-[300px] w-full">
                <PieChart>
                  <Pie
                    data={resultsChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {resultsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Atividades por Horário</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ value: { label: 'Qtd', color: 'hsl(var(--chart-1))' } }}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={hourlyChartData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {(reportType === 'basico' || reportType === 'detalhado') && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle>Detalhamento de Registros</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead className="text-right">Pedido (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      {row.data_fmt} {row.hora_fmt}
                    </TableCell>
                    <TableCell>{row.vendedor}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate" title={row.cliente}>
                      {row.cliente}
                    </TableCell>
                    <TableCell className="capitalize">{row.tipo.replace('_', ' ')}</TableCell>
                    <TableCell>{row.resultado_fmt}</TableCell>
                    <TableCell className="text-right font-medium">
                      {row.teve_pedido ? row.valor_fmt : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </StateDisplay>
  )
}
