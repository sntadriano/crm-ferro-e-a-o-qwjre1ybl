import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useCustomers } from '@/hooks/use-customers'
import { Button } from '@/components/ui/button'
import { CustomerTable } from '@/components/customers/CustomerTable'
import { CustomerCardList } from '@/components/customers/CustomerCardList'
import { ImportDialog } from '@/components/customers/ImportDialog'
import { CustomerFilters } from '@/components/customers/CustomerFilters'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export default function CustomerListPage() {
  const isMobile = useIsMobile()
  const { customers } = useCustomers()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)

  // Sync state with URL params for shareable URLs
  const search = searchParams.get('q') || ''
  const status = searchParams.get('status') || 'all'
  const seller = searchParams.get('seller') || 'all'

  useEffect(() => {
    // Simulate network delay
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value && value !== 'all') newParams.set(key, value)
    else newParams.delete(key)
    setSearchParams(newParams)
  }

  const clearFilters = () => setSearchParams(new URLSearchParams())

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.tradeName?.toLowerCase().includes(search.toLowerCase()) ||
        c.document.replace(/\D/g, '').includes(search.replace(/\D/g, ''))

      const matchStatus = status === 'all' || c.status === status
      const matchSeller = seller === 'all' || c.seller === seller

      return matchSearch && matchStatus && matchSeller
    })
  }, [customers, search, status, seller])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestão de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e acompanhe a carteira de clientes da sua empresa.
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <ImportDialog />
          <Button asChild className="flex-1 sm:flex-auto gap-2">
            <Link to="/clientes/novo">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Link>
          </Button>
        </div>
      </div>

      <CustomerFilters
        search={search}
        setSearch={(v) => updateParam('q', v)}
        status={status}
        setStatus={(v) => updateParam('status', v)}
        seller={seller}
        setSeller={(v) => updateParam('seller', v)}
        onClear={clearFilters}
      />

      <div className="min-h-[400px]">
        {isMobile ? (
          <CustomerCardList customers={filteredCustomers} />
        ) : (
          <CustomerTable customers={filteredCustomers} isLoading={isLoading} />
        )}
      </div>

      {!isLoading && filteredCustomers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-sm text-muted-foreground">
          <div>
            Exibindo <span className="font-medium text-foreground">{filteredCustomers.length}</span>{' '}
            de <span className="font-medium text-foreground">{customers.length}</span> clientes
          </div>
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" className="opacity-50 pointer-events-none" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" className="opacity-50 pointer-events-none" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
