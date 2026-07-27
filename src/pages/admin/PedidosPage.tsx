import { useState, useEffect, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Upload, Search, Link2, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useAuth } from '@/hooks/use-auth'
import { useVendedores } from '@/hooks/use-vendedores'
import { getPedidos, type PedidoRecord } from '@/services/pedidos'
import { getAllProdutos, type ProdutoRecord } from '@/services/produtos'
import { PedidosImportDialog } from '@/components/pedidos/PedidosImportDialog'
import { ProdutosImportDialog } from '@/components/pedidos/ProdutosImportDialog'
import { BackfillReportDialog } from '@/components/pedidos/BackfillReportDialog'
import { NormalizeCodesDialog } from '@/components/pedidos/NormalizeCodesDialog'
import { backfillPedidosRelations, type BackfillReport } from '@/services/pedidos'

const PROD_PER_PAGE = 20

export default function PedidosPage() {
  const { user } = useAuth()
  const { getVendedorName } = useVendedores()
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pedidos, setPedidos] = useState<PedidoRecord[]>([])
  const [produtos, setProdutos] = useState<ProdutoRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const [prodImportOpen, setProdImportOpen] = useState(false)
  const [backfillOpen, setBackfillOpen] = useState(false)
  const [backfillLoading, setBackfillLoading] = useState(false)
  const [backfillReport, setBackfillReport] = useState<BackfillReport | null>(null)
  const [normalizeOpen, setNormalizeOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('pedidos')
  const [prodPage, setProdPage] = useState(1)

  const handleBackfill = async () => {
    setBackfillLoading(true)
    setBackfillOpen(true)
    try {
      const report = await backfillPedidosRelations()
      setBackfillReport(report)
      await loadData()
    } catch (e) {
      console.error('Backfill failed', e)
    } finally {
      setBackfillLoading(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'pedidos') {
        const res = await getPedidos(page, 20)
        setPedidos(res.items as any)
        setTotalPages(res.totalPages)
      } else {
        const res = await getAllProdutos()
        setProdutos(res)
      }
    } catch (e) {
      console.error('Failed to load data', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, activeTab])

  useEffect(() => {
    setProdPage(1)
  }, [search, activeTab])

  const filteredProdutos = useMemo(() => {
    if (!search) return produtos
    const q = search.toLowerCase()
    return produtos.filter(
      (p) =>
        (p.codigo || '').toLowerCase().includes(q) || (p.descricao || '').toLowerCase().includes(q),
    )
  }, [produtos, search])

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />

  const filteredPedidos = search
    ? pedidos.filter(
        (p) => String(p.numero).includes(search) || String(p.cp || '').includes(search),
      )
    : pedidos

  const prodTotalPages = Math.max(1, Math.ceil(filteredProdutos.length / PROD_PER_PAGE))
  const currentProdPage = Math.min(prodPage, prodTotalPages)
  const paginatedProdutos = filteredProdutos.slice(
    (currentProdPage - 1) * PROD_PER_PAGE,
    currentProdPage * PROD_PER_PAGE,
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1A3A52]">Pedidos & Produtos</h1>
        <p className="text-muted-foreground">Histórico de pedidos e produtos (somente leitura).</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v)
          setPage(1)
          setProdPage(1)
          setSearch('')
        }}
      >
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos" className="space-y-4 mt-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou CP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" /> Importar Pedidos
            </Button>
            <Button variant="outline" onClick={handleBackfill}>
              <Link2 className="mr-2 h-4 w-4" /> Corrigir Relações
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-16">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filteredPedidos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-16 text-muted-foreground">
                        Nenhum pedido encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPedidos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.numero}</TableCell>
                        <TableCell>
                          {p.data ? format(new Date(p.data), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                        </TableCell>
                        <TableCell>{getVendedorName(p.vendedor)}</TableCell>
                        <TableCell>
                          {(p as any).expand?.cliente_id?.descricao ||
                            (p as any).expand?.cliente_id?.fantasia ||
                            p.cliente_nome ||
                            (p.codigo_cliente ? String(p.codigo_cliente) : '-')}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(p.valor_pedido || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'cancelado' ? 'destructive' : 'secondary'}>
                            {p.status || 'normal'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <Pagination className="py-4">
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
        </TabsContent>

        <TabsContent value="produtos" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setProdImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" /> Importar Produtos
            </Button>
            <Button variant="outline" onClick={() => setNormalizeOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" /> Normalizar Códigos
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-16">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : paginatedProdutos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-16 text-muted-foreground">
                        Nenhum produto encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProdutos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium font-mono">{p.codigo}</TableCell>
                        <TableCell>{p.descricao || '-'}</TableCell>
                        <TableCell>{p.unidade || '-'}</TableCell>
                        <TableCell className="text-right">
                          {p.custo
                            ? new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(p.custo)
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {prodTotalPages > 1 && (
                <Pagination className="py-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setProdPage((p) => Math.max(1, p - 1))}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-sm px-4">
                        Página {currentProdPage} de {prodTotalPages} · {filteredProdutos.length}{' '}
                        produtos
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setProdPage((p) => Math.min(prodTotalPages, p + 1))}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PedidosImportDialog open={importOpen} onOpenChange={setImportOpen} onSuccess={loadData} />
      <ProdutosImportDialog
        open={prodImportOpen}
        onOpenChange={setProdImportOpen}
        onSuccess={loadData}
      />
      <BackfillReportDialog
        open={backfillOpen}
        onOpenChange={setBackfillOpen}
        report={backfillReport}
        loading={backfillLoading}
      />
      <NormalizeCodesDialog
        open={normalizeOpen}
        onOpenChange={setNormalizeOpen}
        onSuccess={loadData}
      />
    </div>
  )
}
