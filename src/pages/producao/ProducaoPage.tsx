import React, { useState, useEffect, useCallback } from 'react'
import { format, isAfter, setHours, startOfDay, isSameDay, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Plus,
  Search,
  FileEdit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CalendarIcon,
  ClipboardList,
  AlertTriangle,
  Camera,
} from 'lucide-react'
import { toast } from 'sonner'

import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getProducoes, deleteProducao, updateProducao, ProducaoRecord } from '@/services/producao'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProducaoFormDialog } from '@/components/producao/ProducaoFormDialog'
import { PhotoGalleryDialog } from '@/components/producao/PhotoGalleryDialog'
import { cn } from '@/lib/utils'

const ProducaoTableRow = React.memo(
  ({
    record,
    userRole,
    canConferir,
    canEditOrDelete,
    canDelete,
    onGallery,
    onConferir,
    onEdit,
    onDelete,
  }: any) => {
    return (
      <TableRow>
        <TableCell className="font-medium">{record.expand?.item_id?.nome || record.item}</TableCell>
        <TableCell>
          {record.quantidade} {record.expand?.item_id?.unidade || ''}
        </TableCell>
        <TableCell>{format(new Date(record.data_producao), 'dd/MM/yyyy HH:mm')}</TableCell>
        <TableCell>{record.expand?.usuario_id?.name || 'Desconhecido'}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge
              variant={record.status === 'conferido' ? 'default' : 'secondary'}
              className={
                record.status === 'conferido' ? 'bg-green-500 hover:bg-green-600 text-white' : ''
              }
            >
              {record.status === 'conferido' ? 'Conferido' : 'Registrado'}
            </Badge>
            {record.status === 'registrado' &&
              new Date(record.data_producao) < subDays(new Date(), 2) && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Revisar
                </Badge>
              )}
          </div>
        </TableCell>
        {userRole !== 'vendedor' && (
          <TableCell>
            {record.expand?.fotos_producao_via_producao_id &&
            record.expand.fotos_producao_via_producao_id.length > 0 ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                onClick={() => onGallery(record)}
                title="Ver fotos"
              >
                <Camera className="h-4 w-4" />
              </Button>
            ) : (
              <div
                className="h-8 w-8 flex items-center justify-center opacity-30 cursor-not-allowed"
                title="Sem fotos"
              >
                <Camera className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </TableCell>
        )}
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            {record.status === 'registrado' && canConferir && (
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => onConferir(record)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                Conferir
              </Button>
            )}
            {canEditOrDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => onEdit(record)}
              >
                <FileEdit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => onDelete(record.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    )
  },
)
ProducaoTableRow.displayName = 'ProducaoTableRow'

const ProducaoMobileCard = React.memo(
  ({
    record,
    userRole,
    canConferir,
    canEditOrDelete,
    canDelete,
    onGallery,
    onConferir,
    onEdit,
    onDelete,
  }: any) => {
    return (
      <Card className="overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{record.expand?.item_id?.nome || record.item}</h4>
              <p className="text-sm text-muted-foreground">
                {record.quantidade} {record.expand?.item_id?.unidade || ''}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={record.status === 'conferido' ? 'default' : 'secondary'}
                className={record.status === 'conferido' ? 'bg-green-500 text-white' : ''}
              >
                {record.status === 'conferido' ? 'Conferido' : 'Registrado'}
              </Badge>
              {record.status === 'registrado' &&
                new Date(record.data_producao) < subDays(new Date(), 2) && (
                  <Badge variant="destructive" className="flex items-center gap-1 text-[10px]">
                    <AlertTriangle className="h-3 w-3" /> Revisar
                  </Badge>
                )}
            </div>
          </div>

          {userRole !== 'vendedor' &&
            record.expand?.fotos_producao_via_producao_id &&
            record.expand.fotos_producao_via_producao_id.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs flex items-center gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950"
                  onClick={() => onGallery(record)}
                >
                  <Camera className="h-3 w-3" />
                  Ver Evidências
                </Button>
              </div>
            )}

          <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 mt-2">
            <div>
              <span className="block font-medium">Data/Hora</span>
              {format(new Date(record.data_producao), 'dd/MM/yyyy HH:mm')}
            </div>
            <div>
              <span className="block font-medium">Usuário</span>
              {record.expand?.usuario_id?.name || 'Desconhecido'}
            </div>
          </div>
          {record.observacoes && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              <span className="font-medium">Obs:</span> {record.observacoes}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-border/50">
            {record.status === 'registrado' && canConferir && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8"
                onClick={() => onConferir(record)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                Conferir
              </Button>
            )}
            {canEditOrDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => onEdit(record)}
              >
                <FileEdit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-500"
                onClick={() => onDelete(record.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  },
)
ProducaoMobileCard.displayName = 'ProducaoMobileCard'

export default function ProducaoPage() {
  const { user } = useAuth()
  const [data, setData] = useState<ProducaoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<Date>(new Date())

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const perPage = 20

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ProducaoRecord | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [conferirRecord, setConferirRecord] = useState<ProducaoRecord | null>(null)
  const [galleryRecord, setGalleryRecord] = useState<ProducaoRecord | null>(null)

  const isAdmin = user?.role === 'admin'
  const isGerente = user?.role === 'gerente'
  const isJulia = user?.role === 'julia'
  const isGalpao = user?.role === 'paulo'

  const minDate = isGalpao ? subDays(new Date(), 7) : undefined

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const dateStart = startOfDay(dateFilter).toISOString().replace('T', ' ')
      const dateEnd = new Date(startOfDay(dateFilter).getTime() + 86400000)
        .toISOString()
        .replace('T', ' ')

      let filter = `data_producao >= "${dateStart}" && data_producao < "${dateEnd}"`
      if (statusFilter !== 'all') {
        filter += ` && status = '${statusFilter}'`
      }
      if (search) {
        filter += ` && item ~ '${search}'`
      }

      const res = await getProducoes({
        page,
        perPage,
        filter,
        fields:
          'id,item,quantidade,data_producao,status,observacoes,ativo,created,updated,expand.item_id.id,expand.item_id.nome,expand.item_id.unidade,expand.usuario_id.id,expand.usuario_id.name,expand.fotos_producao_via_producao_id.id,expand.fotos_producao_via_producao_id.arquivo',
      })
      setData(res.items)
      setTotalPages(res.totalPages)
      setTotalItems(res.totalItems)
    } catch (error) {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [dateFilter, statusFilter, search, page])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPage(1)
  }, [dateFilter, statusFilter, search])

  useRealtime('producao', async (e) => {
    if (e.action === 'update') {
      try {
        const updatedRecord = await pb.collection('producao').getOne<ProducaoRecord>(e.record.id, {
          expand: 'item_id,usuario_id,fotos_producao_via_producao_id',
          fields:
            'id,item,quantidade,data_producao,status,observacoes,ativo,created,updated,expand.item_id.id,expand.item_id.nome,expand.item_id.unidade,expand.usuario_id.id,expand.usuario_id.name,expand.fotos_producao_via_producao_id.id,expand.fotos_producao_via_producao_id.arquivo',
        })
        setData((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)))
      } catch (err) {
        // Fallback to reload
        loadData()
      }
    } else {
      loadData()
    }
  })

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteProducao(deleteId)
      toast.success('Registro excluído com sucesso')
      setDeleteId(null)
      loadData()
    } catch (error) {
      toast.error(
        'Não foi possível excluir o registro. Verifique suas permissões e tente novamente.',
      )
    }
  }

  const handleConferir = async () => {
    if (!conferirRecord) return
    try {
      await updateProducao(conferirRecord.id, { status: 'conferido' })
      toast.success('Produção conferida com sucesso')
      setConferirRecord(null)
      // loadData is handled by useRealtime
    } catch (error) {
      toast.error('Erro ao conferir produção')
    }
  }

  const openEdit = useCallback((record: ProducaoRecord) => {
    setSelectedRecord(record)
    setFormOpen(true)
  }, [])

  const openNew = useCallback(() => {
    setSelectedRecord(null)
    setFormOpen(true)
  }, [])

  const handleGallery = useCallback((record: ProducaoRecord) => setGalleryRecord(record), [])
  const handleSetConferir = useCallback((record: ProducaoRecord) => setConferirRecord(record), [])
  const handleSetDelete = useCallback((id: string) => setDeleteId(id), [])

  const isAfter18h = isAfter(new Date(), setHours(startOfDay(new Date()), 18))
  const isToday = isSameDay(dateFilter, new Date())
  const showNoRecordsAlert = isToday && isAfter18h && data.length === 0 && !loading

  const canEditOrDelete = isAdmin || isGerente || isGalpao || isJulia
  const canDelete = isAdmin || isGerente
  const canConferir = isAdmin || isJulia

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full justify-end">
          {canEditOrDelete && (
            <Button onClick={openNew} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Produção
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/40">
          <div className="flex flex-1 items-center gap-3 w-full">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="registrado">Registrado</SelectItem>
                <SelectItem value="conferido">Conferido</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[240px] justify-start text-left font-normal bg-background',
                    !dateFilter && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? (
                    format(dateFilter, 'PPP', { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={(d) => d && setDateFilter(d)}
                  disabled={(d) => (minDate ? d < minDate : false)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {showNoRecordsAlert && (
        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 p-4 rounded-lg flex items-center gap-3 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium">
            Sem registros hoje. Já passou das 18h e nenhuma produção foi lançada.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <ClipboardList className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Nenhuma produção registrada</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Não há registros de produção para os filtros selecionados.
          </p>
          {canEditOrDelete && <Button onClick={openNew}>Registrar Produção</Button>}
        </Card>
      ) : (
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden flex flex-col">
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  {user?.role !== 'vendedor' && <TableHead className="w-[80px]">Fotos</TableHead>}
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((record) => (
                  <ProducaoTableRow
                    key={record.id}
                    record={record}
                    userRole={user?.role}
                    canConferir={canConferir}
                    canEditOrDelete={canEditOrDelete}
                    canDelete={canDelete}
                    onGallery={handleGallery}
                    onConferir={handleSetConferir}
                    onEdit={openEdit}
                    onDelete={handleSetDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden flex flex-col gap-3 p-4">
            {data.map((record) => (
              <ProducaoMobileCard
                key={record.id}
                record={record}
                userRole={user?.role}
                canConferir={canConferir}
                canEditOrDelete={canEditOrDelete}
                canDelete={canDelete}
                onGallery={handleGallery}
                onConferir={handleSetConferir}
                onEdit={openEdit}
                onDelete={handleSetDelete}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/20">
              <div>
                Mostrando {(page - 1) * perPage + 1} a {Math.min(page * perPage, totalItems)} de{' '}
                {totalItems}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {formOpen && (
        <ProducaoFormDialog open={formOpen} onOpenChange={setFormOpen} record={selectedRecord} />
      )}

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Registro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este registro de produção? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!conferirRecord} onOpenChange={(o) => !o && setConferirRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferir Produção</DialogTitle>
            <DialogDescription>Confirma que os dados abaixo estão corretos?</DialogDescription>
          </DialogHeader>

          {conferirRecord && (
            <div className="space-y-3 py-4 bg-muted/50 p-4 rounded-md my-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold block">Item</span>
                  {conferirRecord.expand?.item_id?.nome || conferirRecord.item}
                </div>
                <div>
                  <span className="font-semibold block">Quantidade</span>
                  {conferirRecord.quantidade} {conferirRecord.expand?.item_id?.unidade || ''}
                </div>
                <div>
                  <span className="font-semibold block">Data/Hora</span>
                  {format(new Date(conferirRecord.data_producao), 'dd/MM/yyyy HH:mm')}
                </div>
                <div>
                  <span className="font-semibold block">Registrado por</span>
                  {conferirRecord.expand?.usuario_id?.name}
                </div>
              </div>
              {conferirRecord.observacoes && (
                <div className="text-sm">
                  <span className="font-semibold block">Observações</span>
                  <p className="text-muted-foreground">{conferirRecord.observacoes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConferirRecord(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConferir} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PhotoGalleryDialog
        open={!!galleryRecord}
        onOpenChange={(o) => !o && setGalleryRecord(null)}
        fotosRecords={galleryRecord?.expand?.fotos_producao_via_producao_id}
      />
    </div>
  )
}
