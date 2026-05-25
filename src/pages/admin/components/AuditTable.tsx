import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, FileX2 } from 'lucide-react'
import { format } from 'date-fns'
import type { AuditLog } from '@/services/audit_logs'
import { Skeleton } from '@/components/ui/skeleton'
import { AuditDetailModal } from './AuditDetailModal'

interface Props {
  logs: AuditLog[]
  loading: boolean
  page: number
  totalPages: number
  setPage: (p: number) => void
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
}

export function AuditTable({ logs, loading, page, totalPages, setPage }: Props) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  if (loading) return <Skeleton className="h-[400px] w-full" />

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg bg-card">
        <FileX2 className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg">Nenhuma mudança registrada no período</p>
      </div>
    )
  }

  const renderFieldValue = (val: any) => {
    if (val === null || val === undefined) return '-'
    if (typeof val === 'object') return JSON.stringify(val).substring(0, 30) + '...'
    return String(val).substring(0, 30)
  }

  return (
    <div className="space-y-4">
      <div className="hidden md:block rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tabela</TableHead>
              <TableHead>Registro (ID)</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Campo</TableHead>
              <TableHead>Valor Anterior</TableHead>
              <TableHead>Valor Novo</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Data/Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const firstChange = log.detalhes?.[0] || {
                campo: '-',
                valor_anterior: '-',
                valor_novo: '-',
              }
              const moreChanges = (log.detalhes?.length || 0) > 1

              return (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell className="capitalize">{log.tabela}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.registro_id?.substring(0, 8) || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={actionColors[log.acao] || ''}>
                      {log.acao}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {firstChange.campo} {moreChanges && '(+)'}
                  </TableCell>
                  <TableCell>{renderFieldValue(firstChange.valor_anterior)}</TableCell>
                  <TableCell>{renderFieldValue(firstChange.valor_novo)}</TableCell>
                  <TableCell>{log.usuario_nome}</TableCell>
                  <TableCell>{format(new Date(log.created), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-4">
        {logs.map((log) => (
          <Card key={log.id} className="cursor-pointer" onClick={() => setSelectedLog(log)}>
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Badge variant="outline" className={actionColors[log.acao] || ''}>
                  {log.acao}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(log.created), 'dd/MM/yy HH:mm')}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-semibold capitalize">{log.tabela}</span> - {log.usuario_nome}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                ID: {log.registro_id || '-'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Próxima <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {selectedLog && <AuditDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  )
}
