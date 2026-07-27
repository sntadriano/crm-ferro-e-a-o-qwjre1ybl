import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useVendedorUsers } from '@/hooks/use-vendedor-users'
import { useVendedores } from '@/hooks/use-vendedores'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  Printer,
  Loader2,
  Users,
} from 'lucide-react'
import { getVendasResumo, type VendasResumo } from '@/services/vendas'
import { cn } from '@/lib/utils'

export default function VendasReportPage() {
  const { user, loading: authLoading } = useAuth()
  const { vendedorUsers } = useVendedorUsers()
  const { getVendedorName } = useVendedores()
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [vendedor, setVendedor] = useState('all')
  const [data, setData] = useState<VendasResumo | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getVendasResumo({
        dateStart: dateStart || undefined,
        dateEnd: dateEnd || undefined,
        vendedor: vendedor !== 'all' ? vendedor : undefined,
      })
      setData(res)
    } catch (e) {
      toast.error('Erro ao carregar dados do relatório.')
    } finally {
      setLoading(false)
    }
  }, [dateStart, dateEnd, vendedor])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (authLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  const handlePrint = () => window.print()

  return (
    <div className="p-6 max-w-6xl mx-auto w-full space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-[#1A3A52]">Relatório de Vendas</h1>
          <p className="text-muted-foreground mt-1">
            Análise de vendas baseada em pedidos importados
          </p>
        </div>
        <Button
          onClick={handlePrint}
          variant="outline"
          className="bg-[#4A90E2] text-white hover:bg-[#357ABD] border-none"
        >
          <Printer className="mr-2 h-4 w-4" /> Gerar PDF
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end print:hidden bg-card p-4 rounded-lg border shadow-sm">
        <div className="space-y-1 flex-1 w-full md:w-auto">
          <Label>Data Inicial</Label>
          <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
        </div>
        <div className="space-y-1 flex-1 w-full md:w-auto">
          <Label>Data Final</Label>
          <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
        </div>
        <div className="space-y-1 flex-1 w-full md:w-auto min-w-[200px]">
          <Label>Vendedor</Label>
          <Select value={vendedor} onValueChange={setVendedor}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {vendedorUsers
                .filter((u) => u.codigo)
                .map((u) => (
                  <SelectItem key={u.id} value={String(u.codigo)}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetchData} disabled={loading} className="w-full md:w-auto min-h-[44px]">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Filtrar
        </Button>
      </div>

      {loading && !data ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <div className="space-y-6 print:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Pedidos
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-[#4A90E2]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#1A3A52]">{data.totalPedidos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Valor Total Vendido
                </CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(data.valorTotal)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Itens Vendidos
                </CardTitle>
                <Package className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#1A3A52]">
                  {Math.round(data.quantidadeItens)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ticket Médio
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#1A3A52]">
                  {formatCurrency(data.ticketMedio)}
                </div>
              </CardContent>
            </Card>
          </div>

          {data.usuarioBreakdown && data.usuarioBreakdown.length > 0 && (
            <Card className="print:shadow-none print:border-none">
              <CardHeader className="print:hidden">
                <CardTitle className="text-[#1A3A52] flex items-center gap-2">
                  <Users className="h-5 w-5" /> Total por Vendedor
                </CardTitle>
                <CardDescription>
                  Consolidação por usuário somando todos os códigos de vendedor mapeados
                  (codigos_vendedor)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Vendedor</TableHead>
                        <TableHead className="text-center">Códigos</TableHead>
                        <TableHead className="text-center">Total de Pedidos</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead className="text-center">Itens</TableHead>
                        <TableHead className="text-right">Ticket Médio</TableHead>
                        <TableHead className="text-right">% do Total Geral</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.usuarioBreakdown.map((u) => (
                        <TableRow key={u.userId}>
                          <TableCell className="font-medium text-[#1A3A52]">{u.nome}</TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {u.codigos.join(', ')}
                          </TableCell>
                          <TableCell className="text-center">{u.totalPedidos}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(u.valorTotal)}
                          </TableCell>
                          <TableCell className="text-center">
                            {Math.round(u.quantidadeItens)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(u.ticketMedio)}
                          </TableCell>
                          <TableCell className="text-right">{u.percentual.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {data.vendedorBreakdown && data.vendedorBreakdown.length > 0 && (
            <Card className="print:shadow-none print:border-none">
              <CardHeader className="print:hidden">
                <CardTitle className="text-[#1A3A52]">Detalhamento por Vendedor</CardTitle>
                <CardDescription>
                  Performance de vendas por código de vendedor no período selecionado. Códigos não
                  mapeados a nenhum usuário aparecem como &quot;(não mapeado)&quot;.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead className="text-center">Total de Pedidos</TableHead>
                        <TableHead className="text-center">Itens</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead className="text-right">Ticket Médio</TableHead>
                        <TableHead className="text-right">% do Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.vendedorBreakdown.map((v, i) => (
                        <TableRow key={i} className={cn(!v.mapeado && 'bg-amber-50')}>
                          <TableCell className="font-mono text-[#1A3A52]">{v.vendedor}</TableCell>
                          <TableCell
                            className={cn(
                              'font-medium',
                              v.mapeado ? 'text-[#1A3A52]' : 'text-amber-700',
                            )}
                          >
                            {v.mapeado ? getVendedorName(v.vendedor) : v.label}
                          </TableCell>
                          <TableCell className="text-center">{v.totalPedidos}</TableCell>
                          <TableCell className="text-center">
                            {Math.round(v.quantidadeItens)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(v.valorTotal)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(v.ticketMedio)}
                          </TableCell>
                          <TableCell className="text-right">
                            {data.valorTotal > 0
                              ? ((v.valorTotal / data.valorTotal) * 100).toFixed(1) + '%'
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border">
          <p className="text-muted-foreground">Nenhum dado encontrado.</p>
        </div>
      )}
    </div>
  )
}
