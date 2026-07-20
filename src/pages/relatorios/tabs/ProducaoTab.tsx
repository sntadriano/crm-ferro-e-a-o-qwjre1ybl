import { useState, useEffect } from 'react'
import { Package, CalendarDays, Search, XCircle } from 'lucide-react'
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
import { canExport, canUseFilters } from '@/lib/permissions'
import { ExportDropdown } from '@/components/shared/ExportDropdown'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export function ProducaoTab({ filters, refreshKey }: any) {
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [pagedData, setPagedData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [itemSearch, setItemSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const showFilters = canUseFilters(user?.role, 'producao', user?.email)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        let f = []
        if (filters.dateStart)
          f.push(`data_producao >= '${new Date(filters.dateStart + 'T00:00:00').toISOString()}'`)
        if (filters.dateEnd)
          f.push(`data_producao <= '${new Date(filters.dateEnd + 'T23:59:59').toISOString()}'`)
        if (filters.vendedorId && filters.vendedorId !== 'all')
          f.push(`usuario_id = '${filters.vendedorId}'`)
        if (itemSearch) f.push(`item ~ '${itemSearch.replace(/'/g, "\\'")}'`)
        if (statusFilter !== 'all') f.push(`status = '${statusFilter}'`)

        const fullRes = await pb
          .collection('producao')
          .getFullList({ filter: f.join(' && '), expand: 'maquina_id,item_id' })
        if (isMounted) setData(fullRes)

        const pagedRes = await pb
          .collection('producao')
          .getList(page, 20, { filter: f.join(' && '), expand: 'maquina_id,item_id' })
        if (isMounted) {
          setPagedData(pagedRes.items)
          setTotalPages(pagedRes.totalPages)
        }
      } catch (e) {
        if (isMounted) setError(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    const t = setTimeout(() => load(), 300)
    return () => {
      clearTimeout(t)
      isMounted = false
    }
  }, [filters, refreshKey, itemSearch, statusFilter, page])

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

      {showFilters && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E5E5] flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por item..."
              value={itemSearch}
              onChange={(e) => {
                setItemSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos (Status)</SelectItem>
              <SelectItem value="registrado">Registrado</SelectItem>
              <SelectItem value="conferido">Conferido</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setItemSearch('')
              setStatusFilter('all')
              setPage(1)
            }}
          >
            Limpar
          </Button>
        </div>
      )}

      {data.length === 0 && !loading && !error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-card shadow-sm mt-4">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-bold text-[#1A3A52]">Nenhum resultado encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Ajuste os filtros para tentar novamente.
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-red-50 rounded-lg border border-red-200 mt-4">
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-red-900">Ocorreu um erro ao carregar os dados</h3>
          <Button onClick={() => setPage(1)} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 mb-4">
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
              <CardTitle>Detalhamento de Produção</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Máquina/Processo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Produção</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.item}</TableCell>
                      <TableCell>{row.expand?.maquina_id?.nome || '-'}</TableCell>
                      <TableCell className="capitalize">{row.status || 'Registrado'}</TableCell>
                      <TableCell>{format(new Date(row.data_producao), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right">{row.quantidade}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-sm px-4">
                        Página {page} de {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </StateDisplay>
  )
}
