import { useEffect, useState, useMemo } from 'react'
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns'
import { Download, Search, Printer, History, AlertCircle, Camera, Eye } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'

import { getFullProducoes, ProducaoRecord } from '@/services/producao'
import { getProducaoAuditLogs, AuditLog } from '@/services/audit_logs'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PhotoGalleryDialog } from '@/components/producao/PhotoGalleryDialog'
import { useRealtime } from '@/hooks/use-realtime'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'
import { deleteProducao } from '@/services/producao'

export default function ProducaoHistoricoPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [records, setRecords] = useState<ProducaoRecord[]>([])

  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [search, setSearch] = useState('')
  const [filterItem, setFilterItem] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterUser, setFilterUser] = useState('all')

  const [itemsList, setItemsList] = useState<{ id: string; nome: string }[]>([])
  const [usersList, setUsersList] = useState<{ id: string; name: string }[]>([])

  const [selectedRecord, setSelectedRecord] = useState<ProducaoRecord | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [galleryRecord, setGalleryRecord] = useState<ProducaoRecord | null>(null)
  const [deleteRecord, setDeleteRecord] = useState<ProducaoRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [page, setPage] = useState(1)
  const perPage = 20

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(false)
      const start = startOfDay(parseISO(startDate)).toISOString()
      const end = endOfDay(parseISO(endDate)).toISOString()

      const res = await getFullProducoes(
        `data_producao >= '${start}' && data_producao <= '${end}' && ativo = true`,
      )
      setRecords(res)

      const uMap = new Map()
      const iMap = new Map()
      res.forEach((r) => {
        if (r.expand?.usuario_id) uMap.set(r.expand.usuario_id.id, r.expand.usuario_id.name)
        if (r.expand?.item_id) iMap.set(r.expand.item_id.id, r.expand.item_id.nome)
      })
      setUsersList(Array.from(uMap.entries()).map(([id, name]) => ({ id, name })))
      setItemsList(Array.from(iMap.entries()).map(([id, nome]) => ({ id, nome })))
      toast.success('Dados carregados com sucesso')
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [startDate, endDate])

  useRealtime('producao', () => {
    fetchData()
  })

  const handleDelete = async () => {
    if (!deleteRecord) return
    setDeleting(true)
    try {
      await deleteProducao(deleteRecord.id)
      toast.success('Produção excluída com sucesso')
      setDeleteRecord(null)
      setSelectedRecord(null)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir produção')
    } finally {
      setDeleting(false)
    }
  }

  const filteredData = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.expand?.item_id?.nome?.toLowerCase().includes(search.toLowerCase()) ||
        r.item.toLowerCase().includes(search.toLowerCase())
      const matchItem = filterItem === 'all' || r.expand?.item_id?.id === filterItem
      const matchStatus = filterStatus === 'all' || r.status === filterStatus
      const matchUser = filterUser === 'all' || r.expand?.usuario_id?.id === filterUser
      return matchSearch && matchItem && matchStatus && matchUser
    })
  }, [records, search, filterItem, filterStatus, filterUser])

  const paginatedData = useMemo(
    () => filteredData.slice((page - 1) * perPage, page * perPage),
    [filteredData, page],
  )
  const totalPages = Math.ceil(filteredData.length / perPage)

  const openRecord = async (r: ProducaoRecord) => {
    setSelectedRecord(r)
    setLoadingAudit(true)
    try {
      const logs = await getProducaoAuditLogs(r.id)
      setAuditLogs(logs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingAudit(false)
    }
  }

  const analytics = useMemo(() => {
    const byItem = new Map<string, number>()
    const byDay = new Map<string, number>()
    filteredData.forEach((r) => {
      const itemName = r.expand?.item_id?.nome || r.item
      byItem.set(itemName, (byItem.get(itemName) || 0) + r.quantidade)
      const day = format(new Date(r.data_producao), 'dd/MM')
      byDay.set(day, (byDay.get(day) || 0) + r.quantidade)
    })
    return {
      byItem: Array.from(byItem.entries()).map(([name, total]) => ({ name, total })),
      byDay: Array.from(byDay.entries())
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }
  }, [filteredData])

  const exportExcel = () => {
    const headers = ['Item', 'Quantidade', 'Unidade', 'Data', 'Usuário', 'Status', 'Observações']
    const rows = filteredData.map((d) => [
      d.expand?.item_id?.nome || d.item,
      d.quantidade,
      d.expand?.item_id?.unidade || '',
      format(new Date(d.data_producao), 'dd/MM/yyyy HH:mm'),
      d.expand?.usuario_id?.name || 'Desconhecido',
      d.status,
      d.observacoes || '',
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers, ...rows]
        .map((e) => e.map((item) => `"${String(item).replace(/"/g, '""')}"`).join(','))
        .join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `historico_producao_${format(new Date(), 'dd_MM_yyyy')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2 print:hidden mb-4">
        <Button
          variant="outline"
          onClick={exportExcel}
          className="bg-white/5 border-white/10 text-black dark:text-white hover:bg-white/10"
        >
          <Download className="mr-2 h-4 w-4" /> Exportar Excel
        </Button>
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="bg-white/5 border-white/10 text-black dark:text-white hover:bg-white/10"
        >
          <Printer className="mr-2 h-4 w-4" /> Exportar PDF
        </Button>
      </div>

      <Card className="border-white/10 bg-[#1A3A52] text-white print:hidden">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Início</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Fim</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/50" />
              <Input
                placeholder="Nome do item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Item</label>
            <Select value={filterItem} onValueChange={setFilterItem}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {itemsList.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="registrado">Registrado</SelectItem>
                <SelectItem value="conferido">Conferido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Usuário</label>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {usersList.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-red-500/20 bg-red-500/10">
          <CardContent className="flex flex-col items-center justify-center p-8 text-white">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p>Ocorreu um erro ao carregar os dados</p>
            <Button
              variant="outline"
              className="mt-4 border-white/20 text-white hover:bg-white/10"
              onClick={fetchData}
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full bg-white/5" />
          <Skeleton className="h-[400px] w-full bg-white/5" />
        </div>
      ) : (
        <Tabs defaultValue="dashboard" className="space-y-4 print:space-y-4">
          <TabsList className="bg-white/5 border-white/10 print:hidden">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-[#4A90E2] data-[state=active]:text-white"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-[#4A90E2] data-[state=active]:text-white"
            >
              Registros ({filteredData.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 block print:block">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-[#1A3A52] border-white/10 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Produzido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredData.reduce((acc, r) => acc + r.quantidade, 0)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#1A3A52] border-white/10 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Itens Diferentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.byItem.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-[#1A3A52] border-white/10 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Registros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredData.length}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-[#1A3A52] border-white/10 text-white print:break-inside-avoid">
                <CardHeader>
                  <CardTitle>Produção por Item</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ChartContainer
                    config={{ total: { label: 'Quantidade', color: 'hsl(var(--primary))' } }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.byItem}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                        <YAxis stroke="rgba(255,255,255,0.5)" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="total" fill="#4A90E2" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card className="bg-[#1A3A52] border-white/10 text-white print:break-inside-avoid">
                <CardHeader>
                  <CardTitle>Produção ao Longo do Tempo</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ChartContainer
                    config={{ total: { label: 'Quantidade', color: 'hsl(var(--primary))' } }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.byDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                        <YAxis stroke="rgba(255,255,255,0.5)" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="total" stroke="#FFC107" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="print:hidden">
            <Card className="bg-[#1A3A52] border-white/10">
              <CardContent className="p-0">
                {filteredData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-white/50">
                    <History className="h-12 w-12 mb-4 opacity-50" />
                    <p>Nenhum registro no período</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader className="bg-black/20 border-b border-white/10">
                          <TableRow className="hover:bg-transparent border-white/10">
                            <TableHead className="text-white">Item</TableHead>
                            <TableHead className="text-white">Qtd</TableHead>
                            <TableHead className="text-white">Data/Hora</TableHead>
                            <TableHead className="text-white">Usuário</TableHead>
                            <TableHead className="text-white">Status</TableHead>
                            <TableHead className="text-white w-[80px]">Fotos</TableHead>
                            <TableHead className="text-white text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedData.map((r) => (
                            <TableRow
                              key={r.id}
                              className="border-white/10 hover:bg-white/5 cursor-pointer"
                              onClick={() => openRecord(r)}
                            >
                              <TableCell className="text-white">
                                {r.expand?.item_id?.nome || r.item}
                              </TableCell>
                              <TableCell className="text-white font-medium">
                                {r.quantidade}
                              </TableCell>
                              <TableCell className="text-white">
                                {format(new Date(r.data_producao), 'dd/MM/yyyy HH:mm')}
                              </TableCell>
                              <TableCell className="text-white">
                                {r.expand?.usuario_id?.name || 'Desconhecido'}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    r.status === 'conferido'
                                      ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                  }
                                >
                                  {r.status === 'conferido' ? 'Conferido' : 'Registrado'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {r.expand?.fotos_producao_via_producao_id &&
                                r.expand.fotos_producao_via_producao_id.length > 0 ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/50"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setGalleryRecord(r)
                                    }}
                                    title="Ver fotos"
                                  >
                                    <Camera className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <div
                                    className="h-8 w-8 flex items-center justify-center opacity-30 cursor-not-allowed"
                                    title="Sem fotos"
                                  >
                                    <Camera className="h-4 w-4 text-white/30" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openRecord(r)
                                    }}
                                    className="text-white hover:text-[#4A90E2] hover:bg-white/5"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Detalhes
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setDeleteRecord(r)
                                    }}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/50"
                                    title="Excluir"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                    <div className="p-4 border-t border-white/10 flex items-center justify-between text-sm text-white/50">
                      <div>
                        Mostrando {(page - 1) * perPage + 1} a{' '}
                        {Math.min(page * perPage, filteredData.length)} de {filteredData.length}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={!!selectedRecord} onOpenChange={(o) => !o && setSelectedRecord(null)}>
        <DialogContent className="bg-[#1A3A52] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Produção</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/50 mb-1">Item</p>
                  <p className="font-medium">
                    {selectedRecord.expand?.item_id?.nome || selectedRecord.item}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 mb-1">Categoria</p>
                  <p className="font-medium">{selectedRecord.expand?.item_id?.tipo || '-'}</p>
                </div>
                <div>
                  <p className="text-white/50 mb-1">Quantidade</p>
                  <p className="font-medium">
                    {selectedRecord.quantidade} {selectedRecord.expand?.item_id?.unidade}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 mb-1">Data/Hora</p>
                  <p className="font-medium">
                    {format(new Date(selectedRecord.data_producao), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 mb-1">Registrado por</p>
                  <p className="font-medium">{selectedRecord.expand?.usuario_id?.name}</p>
                </div>
                <div>
                  <p className="text-white/50 mb-1">Status</p>
                  <Badge
                    variant="outline"
                    className={
                      selectedRecord.status === 'conferido'
                        ? 'bg-green-500/20 text-green-400 border-green-500/50'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                    }
                  >
                    {selectedRecord.status}
                  </Badge>
                </div>
              </div>
              {selectedRecord.observacoes && (
                <div>
                  <p className="text-white/50 text-sm mb-1">Observações</p>
                  <p className="text-sm p-3 bg-black/20 rounded-md border border-white/5">
                    {selectedRecord.observacoes}
                  </p>
                </div>
              )}
              {selectedRecord.expand?.fotos_producao_via_producao_id &&
                selectedRecord.expand.fotos_producao_via_producao_id.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <Button
                      variant="outline"
                      className="w-full bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                      onClick={() => setGalleryRecord(selectedRecord)}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Visualizar{' '}
                      {selectedRecord.expand.fotos_producao_via_producao_id.reduce(
                        (acc, r) => acc + r.arquivo.length,
                        0,
                      )}{' '}
                      Foto(s) de Evidência
                    </Button>
                  </div>
                )}

              <div>
                <h4 className="font-semibold mb-3 border-b border-white/10 pb-2 mt-4">
                  Histórico de Alterações
                </h4>
                {loadingAudit ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full bg-white/5" />
                    <Skeleton className="h-10 w-full bg-white/5" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-sm text-white/50">Nenhuma alteração registrada.</p>
                ) : (
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="text-sm bg-black/20 p-3 rounded-md border border-white/5"
                      >
                        <div className="flex justify-between text-white/50 mb-2 text-xs">
                          <span>
                            {log.usuario_nome} • {log.acao}
                          </span>
                          <span>{format(new Date(log.created), 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                        {log.detalhes?.map((d, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center text-xs mt-1"
                          >
                            <span className="font-medium capitalize">{d.campo}:</span>
                            <span className="text-red-400 line-through truncate max-w-[150px]">
                              {String(d.valor_anterior ?? '-')}
                            </span>
                            <span className="text-green-400 truncate max-w-[150px]">
                              ➔ {String(d.valor_novo ?? '-')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRecord} onOpenChange={(o) => !o && setDeleteRecord(null)}>
        <AlertDialogContent className="bg-[#1A3A52] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Tem certeza que deseja excluir este lançamento de produção? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Excluindo...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PhotoGalleryDialog
        open={!!galleryRecord}
        onOpenChange={(o) => !o && setGalleryRecord(null)}
        fotosRecords={galleryRecord?.expand?.fotos_producao_via_producao_id}
      />
    </div>
  )
}
