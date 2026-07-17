import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, AlertCircle, RefreshCcw, Info, Search, Filter, X } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAuth } from '@/hooks/use-auth'
import { canExport, canUseFilters } from '@/lib/permissions'
import { ExportDropdown } from '@/components/shared/ExportDropdown'
import { Button } from '@/components/ui/button'
import { CustomerTable } from '@/components/customers/CustomerTable'
import { CustomerCardList } from '@/components/customers/CustomerCardList'
import { ImportDialog } from '@/components/customers/ImportDialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { getClientes, ClienteFilters } from '@/services/clientes'
import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'
import { Customer } from '@/types/customer'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const ITEMS_PER_PAGE = 20

const mapToCustomer = (r: RecordModel): Customer => ({
  id: r.id,
  code: r.codigo?.toString() || '',
  name: r.descricao,
  tradeName: r.fantasia,
  document: r.cnpj_cpf,
  phone: r.fone,
  mobile: r.celular,
  email: r.email,
  status: r.status || 'Ativo',
  seller: r.vendedor?.toString() || '',
  registeredAt: r.cadastro || r.created,
  city: r.cidade,
})

export default function CustomerListPage() {
  const { user } = useAuth()
  const isMobile = useIsMobile()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<ClienteFilters>({
    search: '',
    status: 'all',
    vendedor: 'all',
    cidade: 'all',
    date_start: '',
    date_end: '',
    sort: 'descricao',
  })

  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [vendedores, setVendedores] = useState<RecordModel[]>([])
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const showFilters = canUseFilters(user?.role, 'clientes', user?.email)

  useEffect(() => {
    pb.collection('users')
      .getFullList({ filter: "role = 'vendedor' || role = 'admin'" })
      .then(setVendedores)
      .catch(console.error)
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: debouncedSearch }))
      setPage(1)
    }, 500)
    return () => clearTimeout(handler)
  }, [debouncedSearch])

  const fetchCustomers = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const res = await getClientes(page, ITEMS_PER_PAGE, filters)
      setCustomers(res.items.map(mapToCustomer))
      setTotalItems(res.totalItems)
    } catch (err) {
      console.error(err)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [page, filters])

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  const clearFilters = () => {
    setDebouncedSearch('')
    setFilters({
      search: '',
      status: 'all',
      vendedor: 'all',
      cidade: 'all',
      date_start: '',
      date_end: '',
      sort: 'descricao',
    })
    setPage(1)
  }

  const renderFilters = () => (
    <div className="bg-card p-4 rounded-lg border shadow-sm grid gap-4 grid-cols-1 md:grid-cols-4 items-end mt-4">
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-xs text-muted-foreground">Busca</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nome, Fantasia ou Documento..."
            className="pl-9"
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select
          value={filters.status}
          onValueChange={(v) => {
            setFilters((p) => ({ ...p, status: v }))
            setPage(1)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Vendedor</Label>
        <Select
          value={filters.vendedor}
          onValueChange={(v) => {
            setFilters((p) => ({ ...p, vendedor: v }))
            setPage(1)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {vendedores.map((v) => (
              <SelectItem key={v.id} value={v.codigo?.toString() || v.id}>
                {v.name || v.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Data Cadastro (De)</Label>
        <Input
          type="date"
          value={filters.date_start}
          onChange={(e) => {
            setFilters((p) => ({ ...p, date_start: e.target.value }))
            setPage(1)
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Data Cadastro (Até)</Label>
        <Input
          type="date"
          value={filters.date_end}
          onChange={(e) => {
            setFilters((p) => ({ ...p, date_end: e.target.value }))
            setPage(1)
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Cidade</Label>
        <Input
          placeholder="Nome da cidade"
          value={filters.cidade === 'all' ? '' : filters.cidade}
          onChange={(e) => {
            setFilters((p) => ({ ...p, cidade: e.target.value || 'all' }))
            setPage(1)
          }}
        />
      </div>
      <div>
        <Button variant="outline" className="w-full gap-2" onClick={clearFilters}>
          <X className="h-4 w-4" /> Limpar filtros
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestão de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e acompanhe a carteira de clientes da Ferro e Aço Eldorado.
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          {canExport(user?.role, 'clientes', user?.email) && (
            <ExportDropdown
              loading={isLoading}
              getData={async () => {
                const res = await getClientes(1, 10000, filters)
                return res.items.map((r) => ({
                  ...r,
                  status: r.status || 'Ativo',
                  cadastro: r.cadastro ? new Date(r.cadastro).toLocaleDateString() : '',
                }))
              }}
              columns={[
                { header: 'Código', key: 'codigo' },
                { header: 'Razão Social', key: 'descricao' },
                { header: 'Nome Fantasia', key: 'fantasia' },
                { header: 'CNPJ/CPF', key: 'cnpj_cpf' },
                { header: 'Telefone', key: 'fone' },
                { header: 'Email', key: 'email' },
                { header: 'Cidade', key: 'cidade' },
                { header: 'UF', key: 'uf' },
                { header: 'Status', key: 'status' },
              ]}
              filename="clientes"
              title="Relatório de Clientes"
            />
          )}
          <ImportDialog />
          <Button
            asChild
            className="flex-1 sm:flex-auto gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 min-h-[44px]"
          >
            <Link to="/clientes/novo">
              <Plus className="h-4 w-4" /> Novo Cliente
            </Link>
          </Button>
        </div>
      </div>

      {showFilters &&
        (isMobile ? (
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="w-full">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full flex justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filtros Avançados
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>{renderFilters()}</CollapsibleContent>
          </Collapsible>
        ) : (
          renderFilters()
        ))}

      {hasError ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-red-50 rounded-lg border border-red-200 mt-8">
          <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
          <h3 className="text-lg font-bold text-red-900">Ocorreu um erro ao carregar os dados</h3>
          <Button onClick={fetchCustomers} variant="secondary" className="gap-2 min-h-[44px] mt-4">
            <RefreshCcw className="h-4 w-4" /> Tentar novamente
          </Button>
        </div>
      ) : customers.length > 0 || isLoading ? (
        <>
          <div className="min-h-[400px]">
            {isMobile ? (
              <CustomerCardList customers={customers} />
            ) : (
              <CustomerTable customers={customers} isLoading={isLoading} />
            )}
          </div>

          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground hidden sm:block">
                Mostrando {(page - 1) * ITEMS_PER_PAGE + 1} a{' '}
                {Math.min(page * ITEMS_PER_PAGE, totalItems)} de {totalItems}
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
                    <span className="px-4 text-sm font-medium">
                      Página {page} de {totalPages}
                    </span>
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
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border border-dashed mt-8">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-bold">Nenhum resultado encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Tente ajustar os filtros ou limpar a busca.
          </p>
          <Button onClick={clearFilters} variant="outline" className="min-h-[44px]">
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
