import { useState, useEffect } from 'react'
import { Users, UserCheck, UserX } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useVendedores } from '@/hooks/use-vendedores'
import { canExport } from '@/lib/permissions'
import { ExportDropdown } from '@/components/shared/ExportDropdown'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import pb from '@/lib/pocketbase/client'
import { StateDisplay } from '../components/StateDisplay'
import { countActiveClients } from '@/lib/client-metrics'

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
]

export function ClientesTab({ filters, refreshKey, usersMap }: any) {
  const { user } = useAuth()
  const { getVendedorName } = useVendedores()
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
        if (filters.dateStart)
          f.push(`created >= '${new Date(filters.dateStart + 'T00:00:00').toISOString()}'`)
        if (filters.dateEnd)
          f.push(`created <= '${new Date(filters.dateEnd + 'T23:59:59').toISOString()}'`)
        if (filters.vendedorCodigo) f.push(`vendedor = ${filters.vendedorCodigo}`)

        const res = await pb.collection('clientes').getFullList({ filter: f.join(' && ') })
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

  // Active/Inactive Distribution
  const statusCounts = data.reduce(
    (acc, curr) => {
      const s = curr.status || 'Indefinido'
      acc[s] = (acc[s] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  const activeCount = countActiveClients(data)
  const inactiveCount = total - activeCount

  // Vendedor Distribution — resolve vendor code -> human-readable name from
  // the `vendedores` collection (single source of truth). Falls back to the
  // raw code when no mapping exists.
  const vendedorCounts = data.reduce(
    (acc, curr) => {
      const vName = curr.vendedor ? getVendedorName(curr.vendedor) : 'Sem vendedor'
      acc[vName] = (acc[vName] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const barData = Object.entries(vendedorCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  return (
    <StateDisplay
      loading={loading}
      error={error}
      empty={!loading && !error && data.length === 0}
      onRetry={() => {}}
    >
      {canExport(user?.role, 'clientes', user?.email) && data.length > 0 && (
        <div className="flex justify-end mb-4">
          <ExportDropdown
            data={data.map((d) => ({
              ...d,
              vendedor_nome: getVendedorName(d.vendedor),
              data_cadastro_fmt: format(new Date(d.created), 'dd/MM/yyyy'),
            }))}
            columns={[
              { header: 'Código', key: 'codigo' },
              { header: 'Razão Social', key: 'descricao' },
              { header: 'CNPJ/CPF', key: 'cnpj_cpf' },
              { header: 'Cidade', key: 'cidade' },
              { header: 'UF', key: 'uf' },
              { header: 'Vendedor', key: 'vendedor_nome' },
              { header: 'Status', key: 'status' },
              { header: 'Data Cadastro', key: 'data_cadastro_fmt' },
            ]}
            filename="relatorio_clientes"
            title="Relatório Gerencial - Clientes"
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              {total > 0 ? ((activeCount / total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Inativos</CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveCount}</div>
            <p className="text-xs text-muted-foreground">
              {total > 0 ? ((inactiveCount / total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ value: { label: 'Clientes', color: 'hsl(var(--chart-1))' } }}
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
            <CardTitle>Status dos Clientes</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChartContainer config={{ value: { label: 'Status' } }} className="h-[300px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
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
