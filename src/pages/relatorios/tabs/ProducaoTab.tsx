import { useState, useEffect } from 'react'
import { Package, CalendarDays } from 'lucide-react'
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import pb from '@/lib/pocketbase/client'
import { StateDisplay } from '../components/StateDisplay'
import { format, subDays } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { canExport } from '@/lib/permissions'
import { ExportDropdown } from '@/components/shared/ExportDropdown'

export function ProducaoTab({ filters, refreshKey }: any) {
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        let f = []
        if (filters.dateStart) f.push(`data_producao >= '${filters.dateStart} 00:00:00'`)
        if (filters.dateEnd) f.push(`data_producao <= '${filters.dateEnd} 23:59:59'`)
        if (filters.vendedorId) f.push(`usuario_id = '${filters.vendedorId}'`)

        const res = await pb.collection('producao').getFullList({ filter: f.join(' && ') })
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

  const totalUnits = data.reduce((acc, curr) => acc + (curr.quantidade || 0), 0)

  const endRef = filters.dateEnd ? new Date(filters.dateEnd + 'T00:00:00') : new Date()
  const sevenDaysAgo = subDays(endRef, 7)
  const recentProduction = data
    .filter((d) => new Date(d.data_producao) >= sevenDaysAgo)
    .reduce((acc, curr) => acc + (curr.quantidade || 0), 0)

  const itemCounts = data.reduce(
    (acc, curr) => {
      const t = curr.item || 'Indefinido'
      acc[t] = (acc[t] || 0) + curr.quantidade
      return acc
    },
    {} as Record<string, number>,
  )

  const barData = Object.entries(itemCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const last7Days = Array.from({ length: 7 }, (_, i) =>
    format(subDays(endRef, 6 - i), 'yyyy-MM-dd'),
  )

  const lineData = last7Days.map((date) => {
    const qty = data
      .filter((d) => d.data_producao.startsWith(date))
      .reduce((acc, curr) => acc + (curr.quantidade || 0), 0)
    return { date: format(new Date(date + 'T00:00:00'), 'dd/MM'), value: qty }
  })

  return (
    <StateDisplay
      loading={loading}
      error={error}
      empty={!loading && !error && data.length === 0}
      onRetry={() => {}}
    >
      {canExport(user?.role, 'producao', user?.email) && data.length > 0 && (
        <div className="flex justify-end mb-4">
          <ExportDropdown
            data={data.map((d) => ({
              ...d,
              data_producao_fmt: format(new Date(d.data_producao), 'dd/MM/yyyy'),
            }))}
            columns={[
              { header: 'Item', key: 'item' },
              { header: 'Quantidade', key: 'quantidade' },
              { header: 'Data Produção', key: 'data_producao_fmt' },
            ]}
            filename="relatorio_producao"
            title="Relatório Gerencial - Produção"
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unidades Produzidas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Produção (Últimos 7 dias ref. data final)
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentProduction}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produção por Item</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ value: { label: 'Unidades', color: 'hsl(var(--chart-1))' } }}
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
            <CardTitle>Produção Diária (Últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ value: { label: 'Unidades', color: 'hsl(var(--chart-5))' } }}
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Item</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Porcentagem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {barData.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right">{row.value}</TableCell>
                  <TableCell className="text-right">
                    {totalUnits > 0 ? ((row.value / totalUnits) * 100).toFixed(1) : 0}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </StateDisplay>
  )
}
