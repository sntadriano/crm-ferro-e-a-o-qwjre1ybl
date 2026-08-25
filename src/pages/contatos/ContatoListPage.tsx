import React, { useEffect, useState } from 'react'
import {
  Search,
  Plus,
  MapPin,
  Mail,
  MoreHorizontal,
  CalendarIcon,
  MessageSquare,
  PhoneCall,
  Phone,
  Home,
  RefreshCcw,
  Check,
  Star,
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
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useVendedorUsers } from '@/hooks/use-vendedor-users'
import { canExport, canUseFilters } from '@/lib/permissions'
import { ExportDropdown } from '@/components/shared/ExportDropdown'
import { getClienteDisplayName, isPossivelCliente } from '@/lib/client-display'

export default function ContatoListPage() {
  const { user } = useAuth()
  const [contatos, setContatos] = useState<RecordModel[]>([])
  const [clientes, setClientes] = useState<RecordModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Filters and Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('all')
  const [vendedorFilter, setVendedorFilter] = useState('all')
  const [resultadoFilter, setResultadoFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortField, setSortField] = useState('-data_contato')
  const [possivelClienteFilter, setPossivelClienteFilter] = useState('all')
  const { vendedorUsers: vendedores } = useVendedorUsers()

  const showFilters = canUseFilters(user?.role, 'contatos', user?.email)

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
      if (resultadoFilter !== 'all') filterExp.push(`resultado = '${resultadoFilter}'`)
      if (vendedorFilter !== 'all') filterExp.push(`usuario_id = '${vendedorFilter}'`)
      if (possivelClienteFilter === 'sim') filterExp.push('possivel_cliente = true')
      if (possivelClienteFilter === 'nao') filterExp.push('possivel_cliente = false')
      if (search) {
        const safeSearch = search.replace(/'/g, "\\'")
        filterExp.push(
          `(cliente_id.descricao ~ '${safeSearch}' || nome_possivel_cliente ~ '${safeSearch}')`,
        )
      }
      if (dateFrom) filterExp.push(`data_contato >= '${dateFrom} 00:00:00'`)
      if (dateTo) filterExp.push(`data_contato <= '${dateTo} 23:59:59'`)

      const res = await getContatos(page, 20, filterExp.join(' && '), sortField)
      setContatos(res.items)
      setTotalPages(res.totalPages)

      if (clientes.length === 0) {
        const cliRes = await getClientes(1, 500)
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
  }, [
    page,
    search,
    tipoFilter,
    vendedorFilter,
    resultadoFilter,
    dateFrom,
    dateTo,
    sortField,
    possivelClienteFilter,
  ])

  useRealtime('contatos', () => loadData())

  const handleEdit = (contato: RecordModel) => {
    setSelectedContato(contato)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este contato?')) {
      try {
        await deleteContato(id)
        toast.success('Contato excluído com sucesso', {
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: <Check className="h-4 w-4 text-green-600" />,
        })
      } catch (err) {
        toast.error('Erro ao excluir contato', {
          className: 'bg-red-100 text-red-800 border-red-200',
        })
      }
    }
  }

  const handleOpenDetails = (contato: RecordModel) => {
    setSelectedContato(contato)
    setDetailsOpen(true)
  }

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'visita_presencial') return <Home className="h-4 w-4" />
    if (tipo === 'telefone') return <Phone className="h-4 w-4" />
    if (tipo === 'whatsapp') return <MessageSquare className="h-4 w-4" />
    if (tipo === 'visita') return <MapPin className="h-4 w-4" />
    if (tipo === 'email') return <Mail className="h-4 w-4" />
    return <PhoneCall className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    if (status === 'aprovado') return 'bg-green-100 text-green-800 border-green-200'
    if (status === 'rejeitado') return 'bg-red-100 text-red-800 border-red-200'
    return 'bg-amber-100 text-amber-800 border-amber-200'
  }

  const formatResultado = (res: string) => {
    const map: Record<string, string> = {
      visitado_com_sucesso: 'Sucesso',
      tentou_nao_encontrou: 'Não Encontrou',
      recusou_atendimento: 'Recusou',
      nao_estava: 'Ausente',
      outro: 'Outro',
    }
    return map[res] || res
  }

  const ContatoRow = React.memo(({ contato, i, onOpenDetails, onEdit, onDelete }: any) => (
    <TableRow
      className={cn(
        i % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]',
        'hover:bg-[#4A90E2] hover:text-white transition-colors group',
      )}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-1.5">
          {isPossivelCliente(contato) && (
            <Star className="h-4 w-4 fill-emerald-500 text-emerald-500 shrink-0" />
          )}
          {getClienteDisplayName(contato)}
        </div>
      </TableCell>
      <TableCell>
        {contato.possivel_cliente ? (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold">
            <Star className="h-3 w-3 mr-1 fill-emerald-600 text-emerald-600" />
            Sim
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell>{contato.expand?.usuario_id?.name || 'Sistema'}</TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            'capitalize flex items-center gap-1.5 w-fit bg-white group-hover:bg-white/20 group-hover:border-white group-hover:text-white',
            contato.tipo === 'visita_presencial'
              ? 'border-blue-600 text-blue-700'
              : contato.tipo === 'telefone'
                ? 'border-green-600 text-green-700'
                : contato.tipo === 'whatsapp'
                  ? 'border-blue-400 text-blue-600'
                  : 'border-purple-500 text-purple-700',
          )}
        >
          {getTipoIcon(contato.tipo)} {contato.tipo}
        </Badge>
      </TableCell>
      <TableCell>{format(new Date(contato.data_contato), 'dd/MM/yyyy HH:mm')}</TableCell>
      <TableCell className="max-w-[300px]">
        <p
          className="truncate text-muted-foreground group-hover:text-white"
          title={contato.descricao}
        >
          {contato.descricao}
        </p>
      </TableCell>
      <TableCell>
        {contato.resultado && (
          <Badge
            variant="outline"
            className="capitalize bg-white text-foreground group-hover:bg-white/20 group-hover:border-white group-hover:text-white"
          >
            {formatResultado(contato.resultado)}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {contato.status_validacao && (
          <Badge
            variant="outline"
            className={cn('capitalize', getStatusColor(contato.status_validacao))}
          >
            {contato.status_validacao}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 group-hover:text-white group-hover:hover:bg-white/20"
              aria-label="Ações"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onOpenDetails(contato)}>Visualizar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(contato)}>Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(contato.id)} className="text-destructive">
              Deletar Contato
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  ))
  ContatoRow.displayName = 'ContatoRow'

  const ContatoCard = React.memo(({ contato, onOpenDetails, onEdit, onDelete }: any) => (
    <Card className="shadow-subtle hover:border-[#4A90E2] border-border/60 transition-colors overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-bold text-[#1A3A52] line-clamp-1 text-base flex items-center gap-1.5">
                {isPossivelCliente(contato) && (
                  <Star className="h-4 w-4 fill-emerald-500 text-emerald-500 shrink-0" />
                )}
                {getClienteDisplayName(contato)}
              </div>
              <div className="text-sm text-muted-foreground font-medium mt-1">
                Usuário: {contato.expand?.usuario_id?.name || 'Sistema'}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 shrink-0 min-h-[44px] min-w-[44px]">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpenDetails(contato)}>
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(contato)}>Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(contato.id)} className="text-destructive">
                  Deletar Contato
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-wrap gap-3 text-sm mt-1">
            <Badge
              variant="outline"
              className={cn(
                'capitalize flex items-center gap-1.5 w-fit',
                contato.tipo === 'visita_presencial'
                  ? 'border-blue-600 text-blue-700 bg-blue-50'
                  : contato.tipo === 'telefone'
                    ? 'border-green-600 text-green-700 bg-green-50'
                    : contato.tipo === 'whatsapp'
                      ? 'border-blue-400 text-blue-600 bg-blue-50'
                      : 'border-purple-500 text-purple-700 bg-purple-50',
              )}
            >
              {getTipoIcon(contato.tipo)} {contato.tipo}
            </Badge>
            <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2 py-1 rounded-md font-medium">
              <CalendarIcon className="h-3.5 w-3.5" />{' '}
              {format(new Date(contato.data_contato), 'dd/MM/yyyy HH:mm')}
            </div>
          </div>
          <p className="text-sm text-foreground/90 line-clamp-2 mt-1">{contato.descricao}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {contato.possivel_cliente && (
              <Badge className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold">
                <Star className="h-3 w-3 mr-1 fill-emerald-600 text-emerald-600" />
                Possível Cliente
              </Badge>
            )}
            {contato.resultado && (
              <Badge
                variant="outline"
                className="capitalize text-xs bg-white text-foreground border-border"
              >
                Resultado: {formatResultado(contato.resultado)}
              </Badge>
            )}
            {contato.status_validacao && (
              <Badge
                variant="outline"
                className={cn('capitalize text-xs', getStatusColor(contato.status_validacao))}
              >
                Status: {contato.status_validacao}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button
              variant="outline"
              className="w-full min-h-[44px] text-xs font-semibold border-border hover:bg-muted/50"
              onClick={() => onOpenDetails(contato)}
            >
              Visualizar
            </Button>
            <Button
              className="w-full min-h-[44px] text-xs font-semibold bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800]"
              onClick={() => onEdit(contato)}
            >
              Editar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  ))
  ContatoCard.displayName = 'ContatoCard'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1A3A52]">
            Histórico de Contatos
          </h1>
          <p className="text-muted-foreground">Histórico de interações com clientes</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          {canExport(user?.role, 'contatos', user?.email) && (
            <ExportDropdown
              loading={loading}
              getData={async () => {
                let filterExp = []
                if (tipoFilter !== 'all') filterExp.push(`tipo = '${tipoFilter}'`)
                if (resultadoFilter !== 'all') filterExp.push(`resultado = '${resultadoFilter}'`)
                if (vendedorFilter !== 'all') filterExp.push(`usuario_id = '${vendedorFilter}'`)
                if (possivelClienteFilter === 'sim') filterExp.push('possivel_cliente = true')
                if (possivelClienteFilter === 'nao') filterExp.push('possivel_cliente = false')
                if (search) {
                  const safeSearch = search.replace(/'/g, "\\'")
                  filterExp.push(
                    `(cliente_id.descricao ~ '${safeSearch}' || nome_possivel_cliente ~ '${safeSearch}')`,
                  )
                }
                if (dateFrom) filterExp.push(`data_contato >= '${dateFrom} 00:00:00'`)
                if (dateTo) filterExp.push(`data_contato <= '${dateTo} 23:59:59'`)

                const res = await getContatos(1, 10000, filterExp.join(' && '), sortField)
                return res.items.map((contato) => ({
                  ...contato,
                  cliente: getClienteDisplayName(contato),
                  possivel_cliente_fmt: contato.possivel_cliente ? 'Sim' : 'Não',
                  data_fmt: format(new Date(contato.data_contato), 'dd/MM/yyyy HH:mm'),
                }))
              }}
              columns={[
                { header: 'Cliente', key: 'cliente' },
                { header: 'Possível Cliente', key: 'possivel_cliente_fmt' },
                { header: 'Tipo', key: 'tipo' },
                { header: 'Descrição', key: 'descricao' },
                { header: 'Resultado', key: 'resultado' },
                { header: 'Status', key: 'status_validacao' },
                { header: 'Data Contato', key: 'data_fmt' },
              ]}
              filename="contatos"
              title="Relatório de Contatos"
            />
          )}
          <Button
            onClick={() => {
              setSelectedContato(null)
              setFormOpen(true)
            }}
            className="bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800] min-h-[44px] font-bold w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Registrar Contato
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-card p-4 rounded-lg shadow-subtle border grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
              <SelectItem value="all">Tipos (Todos)</SelectItem>
              <SelectItem value="visita_presencial">Visita Presencial</SelectItem>
              <SelectItem value="telefone">Telefone</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>{' '}
          </Select>
          <Select value={resultadoFilter} onValueChange={setResultadoFilter}>
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Resultado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Resultados (Todos)</SelectItem>
              <SelectItem value="sucesso">Sucesso</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="sem resposta">Sem resposta</SelectItem>
              <SelectItem value="não interessado">Não interessado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Vendedores (Todos)</SelectItem>
              {vendedores.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name || v.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={possivelClienteFilter} onValueChange={setPossivelClienteFilter}>
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Possível Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Possível Cliente (Todos)</SelectItem>
              <SelectItem value="sim">Sim</SelectItem>
              <SelectItem value="nao">Não</SelectItem>
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
          <Button
            variant="outline"
            className="min-h-[44px]"
            onClick={() => {
              setSearch('')
              setTipoFilter('all')
              setResultadoFilter('all')
              setVendedorFilter('all')
              setPossivelClienteFilter('all')
              setDateFrom('')
              setDateTo('')
            }}
          >
            Limpar
          </Button>
        </div>
      )}

      {error ? (
        <div className="text-center py-16 bg-red-50 rounded-lg border border-red-200 shadow-subtle flex flex-col items-center justify-center space-y-4 animate-fade-in">
          <div className="bg-white p-4 rounded-full shadow-sm">
            <RefreshCcw className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-red-800">Ocorreu um erro ao carregar os dados</h3>
            <p className="text-sm text-red-600">Ocorreu um problema de conexão com o servidor.</p>
          </div>
          <Button
            onClick={loadData}
            className="min-h-[44px] bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800] font-bold"
          >
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
                    onClick={() =>
                      setSortField(
                        sortField === 'possivel_cliente' ? '-possivel_cliente' : 'possivel_cliente',
                      )
                    }
                  >
                    Possível Cliente
                  </TableHead>
                  <TableHead className="text-white font-semibold">Usuário</TableHead>{' '}
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
                  <TableHead className="text-white font-semibold">Status</TableHead>
                  <TableHead className="text-white text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contatos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <PhoneCall className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-lg font-bold text-[#1A3A52]">
                          Nenhum resultado encontrado
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Tente limpar os filtros ou registre uma nova interação.
                        </p>
                        <Button
                          onClick={() => {
                            setSelectedContato(null)
                            setFormOpen(true)
                          }}
                          className="bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800] mt-2 font-bold min-h-[44px]"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Registrar Contato
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  contatos.map((contato, i) => (
                    <ContatoRow
                      key={contato.id}
                      contato={contato}
                      i={i}
                      onOpenDetails={handleOpenDetails}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden animate-fade-in">
            {contatos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-subtle border flex flex-col items-center">
                <PhoneCall className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-bold text-[#1A3A52]">Nenhum resultado encontrado</h3>
                <p className="text-sm text-muted-foreground mb-4">Mude os filtros para buscar</p>
                <Button
                  onClick={() => {
                    setSelectedContato(null)
                    setFormOpen(true)
                  }}
                  className="bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800] font-bold min-h-[44px] w-full"
                >
                  Registrar Contato
                </Button>
              </div>
            ) : (
              contatos.map((contato) => (
                <ContatoCard
                  key={contato.id}
                  contato={contato}
                  onOpenDetails={handleOpenDetails}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={
                      page === 1
                        ? 'pointer-events-none opacity-50 min-h-[44px] text-[#1A3A52]'
                        : 'cursor-pointer min-h-[44px] hover:bg-[#1A3A52]/10 hover:text-[#1A3A52] text-[#1A3A52]'
                    }
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm font-semibold text-[#1A3A52] px-4">
                    Página {page} de {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={
                      page === totalPages
                        ? 'pointer-events-none opacity-50 min-h-[44px] text-[#1A3A52]'
                        : 'cursor-pointer min-h-[44px] hover:bg-[#1A3A52]/10 hover:text-[#1A3A52] text-[#1A3A52]'
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
