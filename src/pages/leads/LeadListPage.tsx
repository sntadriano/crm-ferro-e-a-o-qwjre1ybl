import { useState, useEffect } from 'react'
import { RecordModel } from 'pocketbase'
import { getLeads, deleteLead, LeadFilters } from '@/services/leads'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
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
import { Search, Plus, MoreHorizontal, Edit, Trash, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { LeadFormDialog } from '@/components/leads/LeadFormDialog'
import { LeadDetailsSheet, statusColors, statusLabels } from '@/components/leads/LeadDetailsSheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { useIsMobile } from '@/hooks/use-mobile'

export default function LeadListPage() {
  const { user } = useAuth()
  const isMobile = useIsMobile()

  const [leads, setLeads] = useState<RecordModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    status: 'todos',
    sort: '-created',
  })
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
      const data = await getLeads(1, 20, filters)
      setLeads(data.items)
    } catch (err) {
      console.error(err)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filters])

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  if (user?.role === 'paulo' || user?.role === 'gerente') {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center p-8 bg-destructive/10 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-destructive mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar o gerenciamento de leads.
          </p>
        </div>
      </div>
    )
  }

  const renderSkeletons = () => {
    if (isMobile) {
      return Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="mb-4">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardContent>
        </Card>
      ))
    }
    return Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <Skeleton className="h-5 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-8 rounded-full" />
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1e3a8a]">Gestão de Leads</h1>
          <p className="text-muted-foreground">Acompanhe e gerencie as oportunidades de vendas.</p>
        </div>
        <Button
          onClick={() => {
            setSelectedLead(null)
            setFormOpen(true)
          }}
          className="bg-[#eab308] hover:bg-[#ca8a04] text-white w-full md:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Criar Lead
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            className="pl-8"
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Select
            value={filters.status}
            onValueChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="proposta_enviada">Proposta Enviada</SelectItem>
              <SelectItem value="fechado">Fechado</SelectItem>
              <SelectItem value="perdido">Perdido</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sort}
            onValueChange={(v) => setFilters((prev) => ({ ...prev, sort: v }))}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-created">Mais recentes</SelectItem>
              <SelectItem value="created">Mais antigos</SelectItem>
              <SelectItem value="-valor_estimado">Maior valor</SelectItem>
              <SelectItem value="valor_estimado">Menor valor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasError ? (
        <div className="text-center p-8 bg-white rounded-lg border">
          <p className="text-destructive mb-4">Erro ao carregar dados</p>
          <Button onClick={loadData} variant="outline">
            Tentar novamente
          </Button>
        </div>
      ) : isLoading ? (
        <div className={isMobile ? '' : 'border rounded-lg bg-white overflow-hidden'}>
          {isMobile ? (
            renderSkeletons()
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor Estimado</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Próx. Follow-up</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderSkeletons()}</TableBody>
            </Table>
          )}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-lg border flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Nenhum lead cadastrado</h3>
          <p className="text-muted-foreground mb-4">
            Você ainda não tem leads ou a busca não retornou resultados.
          </p>
          <Button
            onClick={() => {
              setSelectedLead(null)
              setFormOpen(true)
            }}
          >
            Criar Lead
          </Button>
        </div>
      ) : isMobile ? (
        <div className="space-y-4">
          {leads.map((lead) => (
            <Card
              key={lead.id}
              className="overflow-hidden cursor-pointer"
              onClick={() => {
                setSelectedLead(lead)
                setDetailsOpen(true)
              }}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold line-clamp-1">
                    {lead.expand?.cliente_id?.descricao || 'Sem Cliente'}
                  </h3>
                  <Badge variant="outline" className={statusColors[lead.status]}>
                    {statusLabels[lead.status] || lead.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  {lead.expand?.cliente_id?.cnpj_cpf}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{formatCurrency(lead.valor_estimado)}</span>
                  <span className="text-muted-foreground flex items-center">
                    {lead.proximo_followup
                      ? format(new Date(lead.proximo_followup), 'dd/MM/yyyy')
                      : '-'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor Estimado</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Próx. Follow-up</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedLead(lead)
                    setDetailsOpen(true)
                  }}
                >
                  <TableCell>
                    <div className="font-medium">
                      {lead.expand?.cliente_id?.descricao || 'Sem Cliente'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {lead.expand?.cliente_id?.cnpj_cpf}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[lead.status]}>
                      {statusLabels[lead.status] || lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(lead.valor_estimado)}
                  </TableCell>
                  <TableCell>{format(new Date(lead.created), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    {lead.proximo_followup
                      ? format(new Date(lead.proximo_followup), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedLead(lead)
                            setDetailsOpen(true)
                          }}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedLead(lead)
                            setFormOpen(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        {(user?.role === 'admin' || user?.role === 'gerente') && (
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                            onClick={() => handleDelete(lead.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Excluir
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
      )}

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} lead={selectedLead} />
      <LeadDetailsSheet open={detailsOpen} onOpenChange={setDetailsOpen} lead={selectedLead} />
    </div>
  )
}
