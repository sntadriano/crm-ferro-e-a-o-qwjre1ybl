import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Users, AlertCircle, RefreshCcw, Info } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useCustomers } from '@/hooks/use-customers'
import { Button } from '@/components/ui/button'
import { CustomerTable } from '@/components/customers/CustomerTable'
import { CustomerCardList } from '@/components/customers/CustomerCardList'
import { ImportDialog } from '@/components/customers/ImportDialog'
import { CustomerFilters } from '@/components/customers/CustomerFilters'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

const ITEMS_PER_PAGE = 20

export default function CustomerListPage() {
  const isMobile = useIsMobile()
  const { customers } = useCustomers()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const search = searchParams.get('q') || ''
  const status = searchParams.get('status') || 'all'
  const seller = searchParams.get('seller') || 'all'
  const sort = searchParams.get('sort') || 'date_desc'
  const page = parseInt(searchParams.get('page') || '1', 10)

  const fetchCustomers = () => {
    setIsLoading(true)
    setHasError(false)
    setTimeout(() => {
      const shouldFail = Math.random() < 0.05
      if (shouldFail) {
        setHasError(true)
      }
      setIsLoading(false)
    }, 800)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const updateParam = (key: string, value: string | number) => {
    const newParams = new URLSearchParams(searchParams)
    if (value && value !== 'all') newParams.set(key, value.toString())
    else newParams.delete(key)
    if (key !== 'page') newParams.set('page', '1')
    setSearchParams(newParams)
  }

  const clearFilters = () => setSearchParams(new URLSearchParams())

  const uniqueSellers = useMemo(() => {
    return Array.from(new Set(customers.map((c) => c.seller)))
      .filter(Boolean)
      .sort()
  }, [customers])

  const processedCustomers = useMemo(() => {
    let filtered = customers.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.tradeName?.toLowerCase().includes(search.toLowerCase()) ||
        c.document.replace(/\D/g, '').includes(search.replace(/\D/g, ''))
      const matchStatus = status === 'all' || c.status === status
      const matchSeller = seller === 'all' || c.seller === seller
      return matchSearch && matchStatus && matchSeller
    })

    filtered.sort((a, b) => {
      switch (sort) {
        case 'name_asc':
          return a.name.localeCompare(b.name)
        case 'name_desc':
          return b.name.localeCompare(a.name)
        case 'date_asc':
          return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()
        case 'date_desc':
          return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
        case 'status_asc':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    return filtered
  }, [customers, search, status, seller, sort])

  const totalPages = Math.ceil(processedCustomers.length / ITEMS_PER_PAGE)
  const paginatedCustomers = processedCustomers.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Alert className="bg-primary/5 text-primary border-primary/20">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm font-medium">
          Aviso: Os dados exibidos são temporários e armazenados localmente na memória. Conecte um
          backend (Skip Cloud/Supabase) para persistência definitiva.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestão de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e acompanhe a carteira de clientes da Ferro e Aço Eldorado.
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
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

      {hasError ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-red-50 rounded-lg border border-red-200 mt-8">
          <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
          <h3 className="text-lg font-bold text-red-900">Erro ao carregar clientes</h3>
          <p className="text-sm text-red-800 mt-1 mb-6 max-w-md">
            Ocorreu um problema de conexão ao tentar buscar os clientes. Verifique sua internet e
            tente novamente.
          </p>
          <Button onClick={fetchCustomers} variant="secondary" className="gap-2 min-h-[44px]">
            <RefreshCcw className="h-4 w-4" /> Tentar novamente
          </Button>
        </div>
      ) : customers.length > 0 ? (
        <>
          <CustomerFilters
            search={search}
            setSearch={(v) => updateParam('q', v)}
            status={status}
            setStatus={(v) => updateParam('status', v)}
            seller={seller}
            setSeller={(v) => updateParam('seller', v)}
            sort={sort}
            setSort={(v) => updateParam('sort', v)}
            onClear={clearFilters}
            sellers={uniqueSellers}
          />

          {!isLoading && processedCustomers.length === 0 && (
            <div className="border rounded-md p-12 text-center bg-card">
              <p className="text-muted-foreground">
                Nenhum cliente encontrado com os filtros atuais.
              </p>
              <Button variant="link" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          )}

          <div className="min-h-[400px]">
            {isMobile ? (
              <CustomerCardList customers={paginatedCustomers} />
            ) : (
              <CustomerTable customers={paginatedCustomers} isLoading={isLoading} />
            )}
          </div>

          {!isLoading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-sm text-muted-foreground">
              <div>
                Exibindo {(page - 1) * ITEMS_PER_PAGE + 1} a{' '}
                {Math.min(page * ITEMS_PER_PAGE, processedCustomers.length)} de{' '}
                {processedCustomers.length} clientes
              </div>
              <Pagination className="w-auto mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => updateParam('page', Math.max(1, page - 1))}
                      className={page === 1 ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive>{page}</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => updateParam('page', Math.min(totalPages, page + 1))}
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
          <h3 className="text-lg font-bold">Nenhum cliente cadastrado</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md">
            Sua base de clientes está vazia. Comece adicionando seu primeiro cliente manualmente ou
            via importação de Excel.
          </p>
          <div className="flex gap-4">
            <ImportDialog />
            <Button asChild variant="secondary" className="min-h-[44px]">
              <Link to="/clientes/novo">
                <Plus className="h-4 w-4 mr-2" /> Criar cliente
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
