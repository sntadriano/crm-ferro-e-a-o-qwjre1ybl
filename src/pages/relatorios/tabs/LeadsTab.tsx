import { useState, useEffect } from 'react'
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import pb from '@/lib/pocketbase/client'
import { StateDisplay } from '../components/StateDisplay'
import { format, subDays } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { canExport } from '@/lib/permissions'
import { ExportDropdown } from '@/components/shared/ExportDropdown'

export function LeadsTab({ filters, refreshKey }: any) {
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
        if (filters.dateStart) f.push(`created >= '${filters.dateStart} 00:00:00'`)
        if (filters.dateEnd) f.push(`created <= '${filters.dateEnd} 23:59:59'`)
        if (filters.vendedorId) f.push(`usuario_id = '${filters.vendedorId}'`)

        const res = await pb.collection('leads').getFullList({ filter: f.join(' && ') })
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
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Last 7 days chart
  const endRef = filters.dateEnd ? new Date(filters.dateEnd + 'T00:00:00') : new Date()
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(endRef, 6 - i)
    return format(d, 'yyyy-MM-dd')
  })

  const lineData = last7Days.map((date) => {
    const count = data.filter((d) => d.created.startsWith(date)).length
    return { date: format(new Date(date + 'T00:00:00'), 'dd/MM'), value: count }
  })

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
              ...d,
              valor_estimado_fmt: new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(d.valor_estimado || 0),
              data_criacao_fmt: format(new Date(d.created), 'dd/MM/yyyy'),
            }))}
            columns={[
              { header: 'Status', key: 'status' },
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
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                totalValue,
              )}
            </div>
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
      </div>

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {barData.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium capitalize">
                    {row.name.replace('_', ' ')}
                  </TableCell>
                  <TableCell className="text-right">{row.value}</TableCell>
                  <TableCell className="text-right">
                    {((row.value / total) * 100).toFixed(1)}%
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
