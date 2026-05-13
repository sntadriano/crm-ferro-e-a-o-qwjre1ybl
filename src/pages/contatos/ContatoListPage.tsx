import { useEffect, useState } from 'react'
import {
  Search,
  Plus,
  MapPin,
  Mail,
  MoreHorizontal,
  CalendarIcon,
  MessageSquare,
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

export default function ContatoListPage() {
  const [contatos, setContatos] = useState<RecordModel[]>([])
  const [clientes, setClientes] = useState<RecordModel[]>([])
  const [loading, setLoading] = useState(true)

  // Filters and Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('all')
  const [clienteFilter, setClienteFilter] = useState('all')
  const [sortField, setSortField] = useState('-data_contato')

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedContato, setSelectedContato] = useState<RecordModel | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      let filterExp = []
      if (tipoFilter !== 'all') filterExp.push(`tipo = '${tipoFilter}'`)
      if (clienteFilter !== 'all') filterExp.push(`cliente_id = '${clienteFilter}'`)
      if (search) filterExp.push(`cliente_id.descricao ~ '${search}'`)

      const res = await getContatos(page, 20, filterExp.join(' && '), sortField)
      setContatos(res.items)
      setTotalPages(res.totalPages)

      if (clientes.length === 0) {
        const cliRes = await getClientes()
        setClientes(cliRes.items)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, search, tipoFilter, clienteFilter, sortField])

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
    return null
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
          className="bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800] min-h-[44px] font-bold"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Contato
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg shadow-subtle border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 min-h-[44px]"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="visita">Visita</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
        <Select value={clienteFilter} onValueChange={setClienteFilter}>
          <SelectTrigger className="w-full sm:w-[220px] min-h-[44px]">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.descricao}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-10">Carregando contatos...</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-md border shadow-subtle bg-white overflow-hidden">
            <Table>
              <TableHeader className="bg-[#1A3A52] hover:bg-[#1A3A52]">
                <TableRow>
                  <TableHead className="text-white font-semibold">Cliente</TableHead>
                  <TableHead
                    className="text-white font-semibold cursor-pointer"
                    onClick={() => setSortField(sortField === 'tipo' ? '-tipo' : 'tipo')}
                  >
                    Tipo
                  </TableHead>
                  <TableHead
                    className="text-white font-semibold cursor-pointer"
                    onClick={() =>
                      setSortField(sortField === 'data_contato' ? '-data_contato' : 'data_contato')
                    }
                  >
                    Data
                  </TableHead>
                  <TableHead className="text-white font-semibold">Descrição</TableHead>
                  <TableHead className="text-white font-semibold">Resultado</TableHead>
                  <TableHead className="text-white text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contatos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum contato encontrado.
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
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {contatos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum contato encontrado.
              </div>
            ) : (
              contatos.map((contato) => (
                <Card
                  key={contato.id}
                  className="shadow-subtle hover:border-[#4A90E2] transition-colors"
                >
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-[#1A3A52]">
                        {contato.expand?.cliente_id?.descricao}
                      </div>
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
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground capitalize">
                        {getTipoIcon(contato.tipo)} {contato.tipo}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />{' '}
                        {format(new Date(contato.data_contato), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                    <p className="text-sm line-clamp-2">{contato.descricao}</p>
                    {contato.resultado && (
                      <div>
                        <Badge variant="outline" className="capitalize">
                          {contato.resultado}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm text-muted-foreground px-4">
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
