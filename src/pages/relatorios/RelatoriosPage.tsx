import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { format } from 'date-fns'
import { CalendarIcon, RefreshCw, BarChart } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { useVendedorUsers } from '@/hooks/use-vendedor-users'

import { ClientesTab } from './tabs/ClientesTab'
import { LeadsTab } from './tabs/LeadsTab'
import { ContatosTab } from './tabs/ContatosTab'
import { ProducaoTab } from './tabs/ProducaoTab'
import { formatUserLabel } from '@/lib/entity-labels'

export default function RelatoriosPage() {
  const { user } = useAuth()
  const [dateStart, setDateStart] = useState<string>('')
  const [dateEnd, setDateEnd] = useState<string>('')
  const [vendedorId, setVendedorId] = useState<string>('todos')
  const [refreshKey, setRefreshKey] = useState(0)
  const [startOpen, setStartOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)
  const { vendedorUsers: usersList } = useVendedorUsers()

  const [usersMap, setUsersMap] = useState<Record<number, string>>({})

  useEffect(() => {
    const map: Record<number, string> = {}
    usersList.forEach((u) => {
      if (u.codigo) map[u.codigo] = formatUserLabel(u, usersList)
    })
    setUsersMap(map)
  }, [usersList])

  if (user?.role === 'vendedor') {
    return <Navigate to="/dashboard" replace />
  }

  const canSeeClientes = user?.role === 'admin' || user?.email?.toLowerCase().includes('alex')
  const canSeeLeads = user?.role === 'admin' || user?.role === 'julia'
  const canSeeContatos = user?.role === 'admin' || user?.role === 'julia'
  const canSeeProducao = user?.role === 'admin' || user?.role === 'gerente'

  const defaultTab = canSeeClientes ? 'clientes' : canSeeLeads ? 'leads' : 'producao'

  const handleRefresh = () => setRefreshKey((prev) => prev + 1)

  const selectedUser = usersList.find((u) => u.id === vendedorId)
  const filters = {
    dateStart,
    dateEnd,
    vendedorId: vendedorId !== 'todos' ? vendedorId : undefined,
    vendedorCodigo: selectedUser?.codigo,
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart className="h-6 w-6 text-primary" />
          Relatórios Gerenciais
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão consolidada do desempenho da Ferro e Aço Eldorado
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end md:items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="space-y-1">
          <Label>Data Inicial</Label>
          <Popover
            open={startOpen}
            onOpenChange={(open) => {
              setStartOpen(open)
              if (open) setEndOpen(false)
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[200px] justify-start text-left font-normal',
                  !dateStart && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateStart ? (
                  format(new Date(dateStart + 'T00:00:00'), 'dd/MM/yyyy')
                ) : (
                  <span>Selecione...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover z-[100] shadow-lg">
              <Calendar
                mode="single"
                selected={dateStart ? new Date(dateStart + 'T00:00:00') : undefined}
                onSelect={(d) => {
                  setDateStart(d ? format(d, 'yyyy-MM-dd') : '')
                  setStartOpen(false)
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <Label>Data Final</Label>
          <Popover
            open={endOpen}
            onOpenChange={(open) => {
              setEndOpen(open)
              if (open) setStartOpen(false)
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[200px] justify-start text-left font-normal',
                  !dateEnd && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateEnd ? (
                  format(new Date(dateEnd + 'T00:00:00'), 'dd/MM/yyyy')
                ) : (
                  <span>Selecione...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover z-[100] shadow-lg">
              <Calendar
                mode="single"
                selected={dateEnd ? new Date(dateEnd + 'T00:00:00') : undefined}
                onSelect={(d) => {
                  setDateEnd(d ? format(d, 'yyyy-MM-dd') : '')
                  setEndOpen(false)
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1 min-w-[200px] flex-1 md:flex-none">
          <Label>Vendedor</Label>
          <Select value={vendedorId} onValueChange={setVendedorId}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {usersList.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {formatUserLabel(u, usersList)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleRefresh} className="w-full md:w-auto md:ml-auto">
          <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px] mb-4 h-auto">
          {canSeeClientes && (
            <TabsTrigger value="clientes" className="py-2">
              Clientes
            </TabsTrigger>
          )}
          {canSeeLeads && (
            <TabsTrigger value="leads" className="py-2">
              Leads
            </TabsTrigger>
          )}
          {canSeeContatos && (
            <TabsTrigger value="contatos" className="py-2">
              Contatos
            </TabsTrigger>
          )}
          {canSeeProducao && (
            <TabsTrigger value="producao" className="py-2">
              Produção
            </TabsTrigger>
          )}
        </TabsList>

        {canSeeClientes && (
          <TabsContent
            value="clientes"
            className="m-0 focus-visible:outline-none focus-visible:ring-0"
          >
            <ClientesTab filters={filters} refreshKey={refreshKey} usersMap={usersMap} />
          </TabsContent>
        )}
        {canSeeLeads && (
          <TabsContent
            value="leads"
            className="m-0 focus-visible:outline-none focus-visible:ring-0"
          >
            <LeadsTab filters={filters} refreshKey={refreshKey} />
          </TabsContent>
        )}
        {canSeeContatos && (
          <TabsContent
            value="contatos"
            className="m-0 focus-visible:outline-none focus-visible:ring-0"
          >
            <ContatosTab filters={filters} refreshKey={refreshKey} usersList={usersList} />
          </TabsContent>
        )}
        {canSeeProducao && (
          <TabsContent
            value="producao"
            className="m-0 focus-visible:outline-none focus-visible:ring-0"
          >
            <ProducaoTab filters={filters} refreshKey={refreshKey} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
