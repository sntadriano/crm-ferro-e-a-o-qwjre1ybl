import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { getContatosPendentes, aprovarContato } from '@/services/contatos'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'

export default function AprovacoesPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const records = await getContatosPendentes()
      setData(records)
    } catch (e) {
      toast.error('Erro ao carregar registros pendentes.')
    } finally {
      setLoading(false)
    }
  }

  const handleAprovar = async (id: string) => {
    setActionId(id)
    try {
      await aprovarContato(id)
      toast.success('Registro aprovado com sucesso.')
      setData((prev) => prev.filter((d) => d.id !== id))
    } catch (e) {
      toast.error('Erro ao aprovar registro.')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto w-full animate-fade-in-up">
      <h1 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
        Aprovações Pendentes
      </h1>

      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-10 w-full rounded"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border">
          <p className="text-slate-500">Nenhum registro pendente de aprovação.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow
                  key={d.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(d.data_contato), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    {d.expand?.usuario_id?.name || d.expand?.usuario_id?.email || 'Desconhecido'}
                  </TableCell>
                  <TableCell>{d.expand?.cliente_id?.descricao}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{d.resultado}</span>
                      {d.teve_pedido && (
                        <span className="text-xs text-emerald-600">
                          Pedido: R$ {d.valor_pedido.toFixed(2)}
                        </span>
                      )}
                      {d.descricao && (
                        <span className="text-xs text-slate-500 italic mt-1">{d.descricao}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleAprovar(d.id)}
                      disabled={actionId === d.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      {actionId === d.id ? 'Aprovando...' : 'Aprovar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
