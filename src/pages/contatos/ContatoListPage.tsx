import { useEffect, useState } from 'react'
import {
  Search,
  Plus,
  MapPin,
  Mail,
  MoreHorizontal,
  CalendarIcon,
  MessageSquare,
  PhoneCall,
  RefreshCcw,
} from 'lucide-react'
import { RecordModel } from 'pocketbase'
import { format } from 'date-fns'
import { getContatos, deleteContato } from '@/services/contatos'
import { getClientes } from '@/services/clientes'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { ContatoFormDialog } from '@/components/contatos/ContatoFormDialog'
import { ContatoDetailsDialog } from '@/components/contatos/ContatoDetailsDialog'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ContatoListPage() {
  const [contatos, setContatos] = useState<RecordModel[]>([])
  const [clientes, setClientes] = useState<RecordModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Filters and Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('all')
  const [clienteFilter, setClienteFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortField, setSortField] = useState('-data_contato')

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedContato, setSelectedContato] = useState<RecordModel | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      let filterExp = []
      if (tipoFilter !== 'all') filterExp.push(`tipo = '${tipoFilter}'`)
      if (clienteFilter !== 'all') filterExp.push(`cliente_id = '${clienteFilter}'`)
      if (search) {
        const safeSearch = search.replace(/'/g, "\\'")
        filterExp.push(`cliente_id.descricao ~ '${safeSearch}'`)
      }
      if (dateFrom) filterExp.push(`data_contato >= '${dateFrom} 00:00:00'`)
      if (dateTo) filterExp.push(`data_contato <= '${dateTo} 23:59:59'`)

      const res = await getContatos(page, 20, filterExp.join(' && '), sortField)
      setContatos(res.items)
      setTotalPages(res.totalPages)

      if (clientes.length === 0) {
        const cliRes = await getClientes()
        setClientes(cliRes.items)
      }
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData()
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [page, search, tipoFilter, clienteFilter, dateFrom, dateTo, sortField])

  useRealtime('contatos', () => loadData())

  const handleEdit = (contato: RecordModel) => {
    setSelectedContato(contato)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este contato?')) {
      try {
        await deleteContato(id)
        toast.success('Contato excluído com sucesso')
      } catch (err) {
        toast.error('Erro ao excluir contato')
      }
    }
  }

  const handleOpenDetails = (contato: RecordModel) => {
    setSelectedContato(contato)
    setDetailsOpen(true)
  }

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'whatsapp') return <MessageSquare className="h-4 w-4 text-green-500" />
    if (tipo === 'visita') return <MapPin className="h-4 w-4 text-orange-500" />
    if (tipo === 'email') return <Mail className="h-4 w-4 text-purple-500" />
    return <PhoneCall className="h-4 w-4 text-blue-500" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1A3A52]">Contatos</h1>
          <p className="text-muted-foreground">Histórico de interações com clientes</p>
        </div>
        <Button
          onClick={() => {
            setSelectedContato(null)
            setFormOpen(true)
          }}
          className="bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800] min-h-[44px] font-bold w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Contato
        </Button>
      </div>

      <div className="bg-card p-4 rounded-lg shadow-subtle border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 min-h-[44px]"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="min-h-[44px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="visita">Visita</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 lg:col-span-2">
          <div className="flex-1">
            <Input
              type="date"
              className="min-h-[44px]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="Data Início"
            />
          </div>
          <div className="flex-1">
            <Input
              type="date"
              className="min-h-[44px]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="Data Fim"
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="text-center py-16 bg-white rounded-lg border shadow-subtle flex flex-col items-center justify-center space-y-4 animate-fade-in">
          <div className="bg-red-50 p-4 rounded-full">
            <RefreshCcw className="h-8 w-8 text-red-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#1A3A52]">Erro ao carregar contatos</h3>
            <p className="text-sm text-muted-foreground">
              Ocorreu um problema de conexão com o servidor.
            </p>
          </div>
          <Button onClick={loadData} variant="outline" className="min-h-[44px]">
            Tentar novamente
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          <div className="hidden md:block rounded-md border shadow-subtle bg-white overflow-hidden">
            <div className="p-4 space-y-4">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
          <div className="md:hidden space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-md border shadow-subtle bg-white overflow-hidden animate-fade-in">
            <Table>
              <TableHeader className="bg-[#1A3A52] hover:bg-[#1A3A52]">
                <TableRow>
                  <TableHead className="text-white font-semibold">Cliente</TableHead>
                  <TableHead
                    className="text-white font-semibold cursor-pointer select-none"
                    onClick={() => setSortField(sortField === 'tipo' ? '-tipo' : 'tipo')}
                  >
                    <div className="flex items-center gap-1">Tipo</div>
                  </TableHead>
                  <TableHead
                    className="text-white font-semibold cursor-pointer select-none"
                    onClick={() =>
                      setSortField(sortField === 'data_contato' ? '-data_contato' : 'data_contato')
                    }
                  >
                    <div className="flex items-center gap-1">Data</div>
                  </TableHead>
                  <TableHead className="text-white font-semibold">Descrição</TableHead>
                  <TableHead className="text-white font-semibold">Resultado</TableHead>
                  <TableHead className="text-white text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contatos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <PhoneCall className="h-12 w-12 text-muted-foreground/50" />
                        <h3 className="text-lg font-bold text-[#1A3A52]">
                          Nenhum contato registrado
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Tente limpar os filtros ou registre uma nova interação.
                        </p>
                        <Button
                          onClick={() => {
                            setSelectedContato(null)
                            setFormOpen(true)
                          }}
                          className="bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800] mt-2 font-bold"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Registrar Contato
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  contatos.map((contato, i) => (
                    <TableRow
                      key={contato.id}
                      className={
                        i % 2 === 0
                          ? 'bg-white hover:bg-[#4A90E2]/10 transition-colors'
                          : 'bg-[#F5F5F5] hover:bg-[#4A90E2]/10 transition-colors'
                      }
                    >
                      <TableCell className="font-medium">
                        {contato.expand?.cliente_id?.descricao || 'Desconhecido'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 capitalize">
                          {getTipoIcon(contato.tipo)} {contato.tipo}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(contato.data_contato), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="truncate text-muted-foreground" title={contato.descricao}>
                          {contato.descricao}
                        </p>
                      </TableCell>
                      <TableCell>
                        {contato.resultado && (
                          <Badge variant="outline" className="capitalize">
                            {contato.resultado}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Ações">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDetails(contato)}>
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(contato)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(contato.id)}
                              className="text-destructive"
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden animate-fade-in">
            {contatos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-subtle flex flex-col items-center">
                <PhoneCall className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <h3 className="font-bold text-[#1A3A52]">Nenhum contato</h3>
                <p className="text-sm text-muted-foreground mb-4">Mude os filtros para buscar</p>
                <Button
                  onClick={() => {
                    setSelectedContato(null)
                    setFormOpen(true)
                  }}
                  className="bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800] font-bold"
                >
                  Registrar Contato
                </Button>
              </div>
            ) : (
              contatos.map((contato) => (
                <Card
                  key={contato.id}
                  className="shadow-subtle hover:border-[#4A90E2] transition-colors overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-[#1A3A52] line-clamp-1 pr-2">
                          {contato.expand?.cliente_id?.descricao}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDetails(contato)}>
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(contato)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(contato.id)}
                              className="text-destructive"
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground capitalize bg-muted/50 px-2 py-1 rounded-md">
                          {getTipoIcon(contato.tipo)} {contato.tipo}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                          <CalendarIcon className="h-3.5 w-3.5" />{' '}
                          {format(new Date(contato.data_contato), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-2 mt-1">
                        {contato.descricao}
                      </p>
                      {contato.resultado && (
                        <div className="mt-1">
                          <Badge variant="outline" className="capitalize text-xs">
                            Resultado: {contato.resultado}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm font-medium text-muted-foreground px-4">
                    Página {page} de {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={
                      page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <ContatoFormDialog open={formOpen} onOpenChange={setFormOpen} contato={selectedContato} />

      {selectedContato && (
        <ContatoDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          contato={selectedContato}
          onEdit={() => {
            setDetailsOpen(false)
            setFormOpen(true)
          }}
        />
      )}
    </div>
  )
}
