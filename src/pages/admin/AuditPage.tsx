import { useEffect, useState } from 'react'
import { getAuditLogs, type AuditLog } from '@/services/audit_logs'
import { AuditFilters } from './components/AuditFilters'
import { AuditTable } from './components/AuditTable'
import { AuditCharts } from './components/AuditCharts'
import { subDays, format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [filters, setFilters] = useState({
    tabela: 'all',
    usuario: '',
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setError(false)
      const res = await getAuditLogs({ ...filters, page, perPage: 20 })
      setLogs(res.items)
      setTotalPages(res.totalPages)
    } catch (err) {
      setError(true)
      toast.error('Ocorreu um erro ao carregar os dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filters, page])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-lg font-medium text-muted-foreground">
          Ocorreu um erro ao carregar os dados
        </p>
        <Button onClick={loadData}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 flex flex-col h-full overflow-hidden bg-background">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Histórico de Auditoria</h1>
        <p className="text-muted-foreground">Monitoramento de atividades e alterações do sistema</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-3">
          <AuditFilters filters={filters} setFilters={setFilters} />
        </div>
        <div className="xl:col-span-3">
          <AuditCharts logs={logs} loading={loading} />
        </div>
        <div className="xl:col-span-3">
          <AuditTable
            logs={logs}
            loading={loading}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
          />
        </div>
      </div>
    </div>
  )
}
