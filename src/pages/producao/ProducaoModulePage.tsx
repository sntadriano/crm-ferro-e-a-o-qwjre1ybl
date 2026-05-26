import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProducaoPage from './ProducaoPage'
import ItensProducaoPage from './ItensProducaoPage'
import ProducaoHistoricoPage from './ProducaoHistoricoPage'
import { useAuth } from '@/hooks/use-auth'
import { canViewProducaoHistorico } from '@/lib/permissions'
import { Factory } from 'lucide-react'

export default function ProducaoModulePage() {
  const { user } = useAuth()
  const canViewHistory = canViewProducaoHistorico(user?.role, user?.name)
  const canViewItems = ['admin', 'gerente', 'julia', 'paulo'].includes(user?.role || '')

  return (
    <div className="p-6 max-w-[1400px] mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Factory className="h-8 w-8 text-primary" />
          Produção
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os registros de produção, catálogo de itens e análise de performance.
        </p>
      </div>

      <Tabs defaultValue="lancamento" className="w-full">
        <TabsList className="w-full justify-start md:w-auto flex overflow-x-auto h-auto p-1 bg-muted">
          <TabsTrigger value="lancamento" className="py-2.5 px-4 text-sm font-medium">
            Lançar Produção
          </TabsTrigger>
          {canViewItems && (
            <TabsTrigger value="itens" className="py-2.5 px-4 text-sm font-medium">
              Itens
            </TabsTrigger>
          )}
          {canViewHistory && (
            <TabsTrigger value="historico" className="py-2.5 px-4 text-sm font-medium">
              Histórico
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="lancamento" className="mt-6 border-0 p-0 focus-visible:outline-none">
          <ProducaoPage />
        </TabsContent>

        {canViewItems && (
          <TabsContent value="itens" className="mt-6 border-0 p-0 focus-visible:outline-none">
            <ItensProducaoPage />
          </TabsContent>
        )}

        {canViewHistory && (
          <TabsContent value="historico" className="mt-6 border-0 p-0 focus-visible:outline-none">
            <ProducaoHistoricoPage />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
