import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { getContatosVendas } from '@/services/contatos'
import { format } from 'date-fns'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#3b82f6', '#8b5cf6']

export default function VendasReportPage() {
  const { user } = useAuth()
  const [reportType, setReportType] = useState('resumo')
  const [dateRange, setDateRange] = useState('30')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [dateRange, customStart, customEnd])

  const fetchData = async () => {
    if (dateRange === 'custom' && (!customStart || !customEnd)) return

    setLoading(true)
    try {
      let start = new Date()
      let end = new Date()

      if (dateRange === '7') {
        start.setDate(end.getDate() - 7)
      } else if (dateRange === '30') {
        start.setDate(end.getDate() - 30)
      } else if (dateRange === 'custom') {
        start = new Date(customStart)
        end = new Date(customEnd)
      }

      const records = await getContatosVendas(start.toISOString(), end.toISOString())
      setData(records)
    } catch (e) {
      toast.error('Erro ao carregar dados do relatório.')
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const totalVisitas = data.length
    const pedidos = data.filter((d) => d.teve_pedido)
    const totalPedidos = pedidos.length
    const taxaConversao = totalVisitas > 0 ? (totalPedidos / totalVisitas) * 100 : 0
    const valorTotal = pedidos.reduce((acc, curr) => acc + (curr.valor_pedido || 0), 0)

    return { totalVisitas, totalPedidos, taxaConversao, valorTotal }
  }, [data])

  const pieData = useMemo(() => {
    const resultCount: Record<string, number> = {}
    data.forEach((d) => {
      resultCount[d.resultado] = (resultCount[d.resultado] || 0) + 1
    })
    return Object.entries(resultCount).map(([name, value]) => ({ name, value }))
  }, [data])

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }).map((_, i) => ({
      hour: `${i}h`,
      Visitas: 0,
      Pedidos: 0,
    }))
    data.forEach((d) => {
      const h = new Date(d.data_contato).getHours()
      hours[h].Visitas += 1
      if (d.teve_pedido) hours[h].Pedidos += 1
    })
    return hours.filter((h) => h.Visitas > 0 || h.Pedidos > 0)
  }, [data])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="p-6 max-w-6xl mx-auto w-full space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Relatório de Vendas</h1>
        <Button
          onClick={handlePrint}
          variant="outline"
          className="bg-[#4A90E2] text-white hover:bg-[#357ABD] border-none transition-colors"
        >
          Gerar PDF
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 print:hidden bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border">
        <div className="space-y-1 w-full md:w-48">
          <label className="text-sm font-medium">Tipo de Relatório</label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basico">Básico</SelectItem>
              <SelectItem value="resumo">Resumo</SelectItem>
              <SelectItem value="detalhado">Detalhado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 w-full md:w-48">
          <label className="text-sm font-medium">Período</label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="custom">Customizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {dateRange === 'custom' && (
          <>
            <div className="space-y-1 w-full md:w-40 animate-fade-in-up">
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div className="space-y-1 w-full md:w-40 animate-fade-in-up">
              <label className="text-sm font-medium">Data Final</label>
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </div>
          </>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse flex space-x-4">
            <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-36"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
            </div>
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border">
          <p className="text-slate-500">Nenhum registro encontrado no período selecionado.</p>
        </div>
      ) : (
        <div className="space-y-6 print:space-y-4 print:text-black">
          {(reportType === 'resumo' || reportType === 'detalhado') && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    Total de Visitas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalVisitas}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    Total de Pedidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPedidos}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    Taxa de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.taxaConversao.toFixed(1)}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    Valor Total Vendido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    R$ {stats.valorTotal.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === 'detalhado' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:break-inside-avoid">
              <Card>
                <CardHeader>
                  <CardTitle>Resultados das Visitas</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Atividades por Hora</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="Visitas" fill="#3b82f6" />
                      <Bar dataKey="Pedidos" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="print:shadow-none print:border-none">
            <CardHeader className="print:hidden">
              <CardTitle>Registros Detalhados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Pedido</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      {reportType !== 'basico' && <TableHead>Status</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((d) => (
                      <TableRow
                        key={d.id}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(d.data_contato), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {d.expand?.cliente_id?.descricao || 'Desconhecido'}
                        </TableCell>
                        <TableCell>{d.resultado}</TableCell>
                        <TableCell>
                          {d.teve_pedido ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              Sim
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                              Não
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {d.teve_pedido ? `R$ ${d.valor_pedido.toFixed(2)}` : '-'}
                        </TableCell>
                        {reportType !== 'basico' && (
                          <TableCell>
                            {d.status_aprovacao === 'aprovado' ? (
                              <span className="text-emerald-600 text-xs font-medium">Aprovado</span>
                            ) : (
                              <span className="text-amber-600 text-xs font-medium">Pendente</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
