import { useState, useEffect } from 'react'
import { RecordModel } from 'pocketbase'
import { getLeads, deleteLead, LeadFilters } from '@/services/leads'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { canExport, canUseFilters } from '@/lib/permissions'
import pb from '@/lib/pocketbase/client'
import { ExportDropdown } from '@/components/shared/ExportDropdown'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash,
  FileText,
  Filter,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { LeadFormDialog } from '@/components/leads/LeadFormDialog'
import { LeadDetailsSheet, statusColors, statusLabels } from '@/components/leads/LeadDetailsSheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BellRing, Clock, CheckCircle } from 'lucide-react'

const getFollowupStatus = (dateStr: string) => {
  if (!dateStr)
    return { color: 'bg-gray-100 text-gray-500 border-gray-200', label: 'Sem data', icon: null }
  const d = new Date(dateStr)
  const now = new Date()
  const diffH = (d.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (diffH < 0)
    return { color: 'bg-red-100 text-red-700 border-red-200', label: 'Atrasado', icon: AlertCircle }
  if (diffH <= 1)
    return { color: 'bg-red-100 text-red-700 border-red-200', label: '< 1h', icon: BellRing }
  if (diffH <= 24)
    return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: '< 24h', icon: Clock }
  return {
    color: 'bg-green-100 text-green-700 border-green-200',
    label: 'No prazo',
    icon: CheckCircle,
  }
}
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export default function LeadListPage() {
  const { user } = useAuth()
  const isMobile = useIsMobile()

  const [leads, setLeads] = useState<RecordModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    status: 'todos',
    vendedor_id: 'todos',
    sort: '-created',
    date_start: '',
    date_end: '',
    value_min: '',
    value_max: '',
  })

  const [tempFilters, setTempFilters] = useState<LeadFilters>(filters)
  const [vendedores, setVendedores] = useState<RecordModel[]>([])
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)

  const showFilters = canUseFilters(user?.role, 'leads', user?.email)

  useEffect(() => {
    pb.collection('users')
      .getFullList({ filter: "role = 'vendedor' || role = 'admin'" })
      .then(setVendedores)
      .catch(console.error)
  }, [])
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<RecordModel | null>(null)

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: debouncedSearch }))
    }, 500)
    return () => clearTimeout(handler)
  }, [debouncedSearch])

  const loadData = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const data = await getLeads(page, 20, filters)
      setLeads(data.items)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error(err)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filters, page])

  useRealtime('leads', () => {
    loadData()
  })

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      try {
        await deleteLead(id)
        toast.success('Lead excluído com sucesso')
      } catch (err) {
        toast.error('Erro ao excluir lead')
      }
    }
  }

  const applyAdvancedFilters = () => {
    setFilters((prev) => ({
      ...prev,
      date_start: tempFilters.date_start,
      date_end: tempFilters.date_end,
      value_min: tempFilters.value_min,
      value_max: tempFilters.value_max,
    }))
  }

  const clearAdvancedFilters = () => {
    const defaultFilters = {
      search: '',
      status: 'todos',
      vendedor_id: 'todos',
      sort: '-created',
      date_start: '',
      date_end: '',
      value_min: '',
      value_max: '',
    }
    setDebouncedSearch('')
    setTempFilters(defaultFilters)
    setFilters(defaultFilters)
    setPage(1)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  if (user?.role === 'paulo' || user?.role === 'gerente') {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center p-8 bg-destructive/10 rounded-lg max-w-md border border-destructive/20 shadow-md">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground text-sm">
            Você não tem permissão para acessar o gerenciamento de leads.
          </p>
        </div>
      </div>
    )
  }

  const renderSkeletons = () => {
    if (isMobile) {
      return Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="mb-4 shadow-sm border-[#E5E5E5] p-2">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4 bg-muted/60" />
            <Skeleton className="h-4 w-1/2 bg-muted/60" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-24 bg-muted/60" />
              <Skeleton className="h-5 w-24 bg-muted/60" />
            </div>
          </CardContent>
        </Card>
      ))
    }
    return Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i} className="even:bg-[#F5F5F5]">
        <TableCell>
          <Skeleton className="h-5 w-32 bg-muted/60" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-20 bg-muted/60" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-24 bg-muted/60" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-24 bg-muted/60" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-24 bg-muted/60" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-8 rounded-full bg-muted/60" />
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
            Gestão de Leads
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe e gerencie as oportunidades de vendas.
          </p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-3">
          {canExport(user?.role, 'leads', user?.email) && (
            <ExportDropdown
              getData={async () => {
                const res = await getLeads(1, 10000, filters)
                return res.items.map((lead) => ({
                  ...lead,
                  cliente: lead.expand?.cliente_id?.descricao || 'Sem Cliente',
                  valor_estimado_fmt: new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(lead.valor_estimado || 0),
                  data_criacao_fmt: format(new Date(lead.created), 'dd/MM/yyyy'),
                  proximo_followup_fmt: lead.proximo_followup
                    ? format(new Date(lead.proximo_followup), 'dd/MM/yyyy')
                    : '-',
                }))
              }}
              columns={[
                { header: 'Cliente', key: 'cliente' },
                { header: 'Status', key: 'status' },
                { header: 'Valor Estimado', key: 'valor_estimado_fmt' },
                { header: 'Data de Criação', key: 'data_criacao_fmt' },
                { header: 'Próx. Follow-up', key: 'proximo_followup_fmt' },
              ]}
              filename="leads"
              title="Relatório de Leads"
            />
          )}
          <Button
            onClick={() => {
              setSelectedLead(null)
              setFormOpen(true)
            }}
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold min-h-[44px] w-full md:w-auto shadow-sm"
            aria-label="Criar novo lead"
          >
            <Plus className="mr-2 h-5 w-5" />
            Criar Lead
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E5E5] flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente..."
                className="pl-10 min-h-[44px]"
                value={debouncedSearch}
                onChange={(e) => setDebouncedSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={filters.status}
                onValueChange={(v) => {
                  setFilters((p) => ({ ...p, status: v }))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px] min-h-[44px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="proposta_enviada">Proposta Enviada</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.vendedor_id}
                onValueChange={(v) => {
                  setFilters((p) => ({ ...p, vendedor_id: v }))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px] min-h-[44px]">
                  <SelectValue placeholder="Vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Vendedores</SelectItem>
                  {vendedores.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name || v.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-1 gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Data de Criação (De)</Label>
                <Input
                  type="date"
                  className="h-9"
                  value={filters.date_start}
                  onChange={(e) => {
                    setFilters((p) => ({ ...p, date_start: e.target.value }))
                    setPage(1)
                  }}
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Data de Criação (Até)</Label>
                <Input
                  type="date"
                  className="h-9"
                  value={filters.date_end}
                  onChange={(e) => {
                    setFilters((p) => ({ ...p, date_end: e.target.value }))
                    setPage(1)
                  }}
                />
              </div>
            </div>
            <div className="flex flex-1 gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Valor (Mín)</Label>
                <Input
                  type="number"
                  className="h-9"
                  value={filters.value_min}
                  onChange={(e) => {
                    setFilters((p) => ({
                      ...p,
                      value_min: e.target.value ? Number(e.target.value) : '',
                    }))
                    setPage(1)
                  }}
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Valor (Máx)</Label>
                <Input
                  type="number"
                  className="h-9"
                  value={filters.value_max}
                  onChange={(e) => {
                    setFilters((p) => ({
                      ...p,
                      value_max: e.target.value ? Number(e.target.value) : '',
                    }))
                    setPage(1)
                  }}
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" className="h-9" onClick={clearAdvancedFilters}>
                Limpar
              </Button>
            </div>
          </div>
        </div>
      )}

      {hasError ? (
        <div className="text-center p-12 bg-red-50 rounded-xl border border-red-100 flex flex-col items-center">
          <XCircle className="h-10 w-10 text-red-600 mb-4" />
          <h3 className="text-xl font-bold text-red-900 mb-2">
            Ocorreu um erro ao carregar os dados
          </h3>
          <p className="text-red-700 mb-6 max-w-md">Tente novamente.</p>
          <Button
            onClick={loadData}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 min-h-[44px] font-semibold px-8 shadow-sm"
          >
            Tentar novamente
          </Button>
        </div>
      ) : isLoading ? (
        <div
          className={
            isMobile ? '' : 'border border-[#E5E5E5] rounded-xl bg-white shadow-sm overflow-hidden'
          }
        >
          {isMobile ? (
            renderSkeletons()
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#F5F5F5]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-primary">Cliente</TableHead>
                    <TableHead className="font-bold text-primary">Status</TableHead>
                    <TableHead className="font-bold text-primary">Valor Estimado</TableHead>
                    <TableHead className="font-bold text-primary">Data de Criação</TableHead>
                    <TableHead className="font-bold text-primary">Próx. Follow-up</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderSkeletons()}</TableBody>
              </Table>
            </div>
          )}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center p-16 bg-[#F5F5F5] rounded-xl border border-[#E5E5E5] flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-primary mb-2">Nenhum resultado encontrado</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            A busca ou filtros atuais não retornaram nenhum registro.
          </p>
          <Button
            onClick={() => {
              setSelectedLead(null)
              setFormOpen(true)
            }}
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold min-h-[44px] px-8 shadow-sm"
          >
            Criar Lead
          </Button>
        </div>
      ) : isMobile ? (
        <div className="space-y-4">
          {leads.map((lead) => (
            <Card
              key={lead.id}
              className="overflow-hidden cursor-pointer shadow-md border-[#E5E5E5] hover:shadow-lg transition-shadow bg-white rounded-xl"
              onClick={() => {
                setSelectedLead(lead)
                setDetailsOpen(true)
              }}
              role="button"
              aria-label={`Ver detalhes do lead de ${lead.expand?.cliente_id?.descricao || 'Sem Cliente'}`}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-primary text-lg line-clamp-1 pr-2">
                    {lead.expand?.cliente_id?.descricao || 'Sem Cliente'}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`whitespace-nowrap font-semibold ${statusColors[lead.status]}`}
                  >
                    {statusLabels[lead.status] || lead.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-4 bg-[#F5F5F5] px-2 py-1 rounded inline-block">
                  CNPJ/CPF: {lead.expand?.cliente_id?.cnpj_cpf || '-'}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm border-t border-[#E5E5E5] pt-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Valor
                    </p>
                    <p className="font-bold text-primary">{formatCurrency(lead.valor_estimado)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Follow-up
                    </p>
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="font-medium text-foreground text-sm">
                        {lead.proximo_followup
                          ? format(new Date(lead.proximo_followup), 'dd/MM/yyyy')
                          : '-'}
                      </span>
                      {lead.status !== 'fechado' && lead.status !== 'perdido' && (
                        <Badge
                          variant="outline"
                          className={`w-fit text-[10px] ${getFollowupStatus(lead.proximo_followup).color}`}
                        >
                          {getFollowupStatus(lead.proximo_followup).label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border border-[#E5E5E5] rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#F5F5F5]">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-primary py-4">Cliente</TableHead>
                  <TableHead className="font-bold text-primary py-4">Status</TableHead>
                  <TableHead className="font-bold text-primary py-4">Valor Estimado</TableHead>
                  <TableHead className="font-bold text-primary py-4">Data de Criação</TableHead>
                  <TableHead className="font-bold text-primary py-4">Status Follow-up</TableHead>
                  <TableHead className="w-[80px] py-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead, index) => (
                  <TableRow
                    key={lead.id}
                    className={`cursor-pointer transition-colors hover:bg-accent hover:text-white group ${index % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'}`}
                    onClick={() => {
                      setSelectedLead(lead)
                      setDetailsOpen(true)
                    }}
                  >
                    <TableCell className="py-4">
                      <div className="font-bold text-primary group-hover:text-white">
                        {lead.expand?.cliente_id?.descricao || 'Sem Cliente'}
                      </div>
                      <div className="text-xs text-muted-foreground group-hover:text-white/80 mt-1">
                        {lead.expand?.cliente_id?.cnpj_cpf}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant="outline"
                        className={`font-semibold bg-white ${statusColors[lead.status]}`}
                      >
                        {statusLabels[lead.status] || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold py-4">
                      {formatCurrency(lead.valor_estimado)}
                    </TableCell>
                    <TableCell className="py-4 font-medium text-muted-foreground group-hover:text-white/90">
                      {format(new Date(lead.created), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="py-4 font-medium">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-sm">
                          {lead.proximo_followup
                            ? format(new Date(lead.proximo_followup), 'dd/MM/yyyy')
                            : '-'}
                        </span>
                        {lead.status !== 'fechado' && lead.status !== 'perdido' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-semibold flex gap-1 items-center px-1.5 py-0 ${getFollowupStatus(lead.proximo_followup).color}`}
                                >
                                  {getFollowupStatus(lead.proximo_followup).icon &&
                                    (() => {
                                      const Icon = getFollowupStatus(lead.proximo_followup).icon!
                                      return <Icon className="h-3 w-3" />
                                    })()}
                                  {getFollowupStatus(lead.proximo_followup).label}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {lead.proximo_followup
                                    ? `Vence em: ${format(new Date(lead.proximo_followup), "dd/MM/yyyy 'às' HH:mm")}`
                                    : 'Nenhum follow-up agendado'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-10 w-10 p-0 hover:bg-white/20 rounded-full"
                            aria-label="Ações do lead"
                          >
                            <MoreHorizontal className="h-5 w-5 text-primary group-hover:text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 shadow-lg rounded-xl">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLead(lead)
                              setDetailsOpen(true)
                            }}
                            className="cursor-pointer py-2.5"
                          >
                            <FileText className="mr-2 h-4 w-4 text-accent" />
                            <span className="font-medium">Detalhes</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLead(lead)
                              setFormOpen(true)
                            }}
                            className="cursor-pointer py-2.5"
                          >
                            <Edit className="mr-2 h-4 w-4 text-accent" />
                            <span className="font-medium">Editar</span>
                          </DropdownMenuItem>
                          {(user?.role === 'admin' || user?.role === 'gerente') && (
                            <DropdownMenuItem
                              className="text-destructive focus:bg-red-50 focus:text-destructive cursor-pointer py-2.5"
                              onClick={() => handleDelete(lead.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              <span className="font-medium">Excluir</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {!isLoading && !hasError && leads.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground hidden sm:block">
            Página {page} de {totalPages}
          </div>
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={page === 1 ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  className={
                    page === totalPages ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} lead={selectedLead} />
      <LeadDetailsSheet open={detailsOpen} onOpenChange={setDetailsOpen} lead={selectedLead} />
    </div>
  )
}
