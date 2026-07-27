import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { getAllPedidos } from '@/services/pedidos'
import { useVendedores } from '@/hooks/use-vendedores'

export function VendasPorVendedor() {
  const { getVendedorName } = useVendedores()
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [groupBy, setGroupBy] = useState<'day' | 'month' | 'year'>('month')
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getAllPedidos({
        dateStart: dateStart || undefined,
        dateEnd: dateEnd || undefined,
      })
      setPedidos(data.filter((p) => p.status !== 'cancelado'))
    } catch (e) {
      console.error('Failed to fetch pedidos', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const aggregated = useMemo(() => {
    const map: Record<string, { vendedor: number; periodo: string; count: number; total: number }> =
      {}
    for (const p of pedidos) {
      const vendedor = p.vendedor || 0
      let periodo = 'Sem data'
      if (p.data) {
        const d = new Date(p.data)
        if (groupBy === 'day') periodo = format(d, 'dd/MM/yyyy')
        else if (groupBy === 'month') periodo = format(d, 'MM/yyyy')
        else periodo = String(d.getFullYear())
      }
      const key = `${vendedor}-${periodo}`
      if (!map[key]) map[key] = { vendedor, periodo, count: 0, total: 0 }
      map[key].count++
      map[key].total += Number(p.valor_pedido) || 0
    }
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [pedidos, groupBy])

  const chartData = useMemo(
    () => aggregated.map((a) => ({ name: getVendedorName(a.vendedor), value: a.total })),
    [aggregated, getVendedorName],
  )

  return (
    <Card className="shadow-subtle animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-[#1A3A52] flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> Vendas por Vendedor
        </CardTitle>
        <CardDescription>
          Análise de vendas agregadas por vendedor e período (apenas pedidos normais).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-1 flex-1">
            <Label>Data Inicial</Label>
            <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
          </div>
          <div className="space-y-1 flex-1">
            <Label>Data Final</Label>
            <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Agrupar por</Label>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dia</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchData} disabled={loading}>
            {loading ? 'Carregando...' : 'Filtrar'}
          </Button>
        </div>

        {chartData.length > 0 && (
          <ChartContainer
            config={{ value: { label: 'Valor', color: 'hsl(var(--chart-1))' } }}
            className="h-[250px] w-full"
          >
            <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-center">Total de Pedidos</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aggregated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground h-16">
                    Nenhum dado encontrado para o período selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                aggregated.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-[#1A3A52]">
                      {getVendedorName(a.vendedor)}
                    </TableCell>
                    <TableCell>{a.periodo}</TableCell>
                    <TableCell className="text-center">{a.count}</TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(a.total)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
