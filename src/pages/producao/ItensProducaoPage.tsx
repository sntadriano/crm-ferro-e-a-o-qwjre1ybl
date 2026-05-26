import { useEffect, useState } from 'react'
import { Package, Plus, Search, Edit, Trash2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { ItemProducao, getItensProducao } from '@/services/itens_producao'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ItemProducaoFormDialog } from '@/components/producao/ItemProducaoFormDialog'
import { ItemProducaoDeleteDialog } from '@/components/producao/ItemProducaoDeleteDialog'

export default function ItensProducaoPage() {
  const { user } = useAuth()
  const canEdit = user && ['admin', 'gerente', 'paulo'].includes(user.role)

  const [items, setItems] = useState<ItemProducao[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemProducao | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadItems = async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await getItensProducao(page, 20, debouncedSearch)
      setItems(data.items)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [page, debouncedSearch])

  useRealtime('itens_producao', () => {
    loadItems()
  })

  const handleCreate = () => {
    setSelectedItem(null)
    setFormOpen(true)
  }

  const handleEdit = (item: ItemProducao) => {
    setSelectedItem(item)
    setFormOpen(true)
  }

  const handleDelete = (item: ItemProducao) => {
    setSelectedItem(item)
    setDeleteOpen(true)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Itens de Produção
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie o catálogo de itens fabricados.
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Item
          </Button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-red-50/50 dark:bg-red-950/20">
          <p className="text-red-500 mb-4 font-medium">Ocorreu um erro ao carregar os dados</p>
          <Button variant="outline" onClick={loadItems}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full rounded-md" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/10">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum item encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
            {debouncedSearch
              ? 'Tente limpar a busca para ver todos os itens.'
              : 'Cadastre o primeiro item de produção para começar.'}
          </p>
          {canEdit && !debouncedSearch && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Item
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{item.nome}</h3>
                    <Badge variant={item.status ? 'default' : 'secondary'}>
                      {item.status ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground space-y-1">
                    <p>
                      Tipo: <span className="text-foreground">{item.tipo}</span>
                    </p>
                    <p>
                      Unid: <span className="text-foreground">{item.unidade}</span>
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2 mt-4 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        Editar
                      </Button>
                      {item.status && (
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(item)}>
                          Inativar
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>{item.tipo}</TableCell>
                    <TableCell>{item.unidade}</TableCell>
                    <TableCell>
                      <Badge variant={item.status ? 'default' : 'secondary'}>
                        {item.status ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {item.status ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                            onClick={() => handleDelete(item)}
                            title="Inativar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="w-9 inline-block"></span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
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
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ItemProducaoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={selectedItem}
        onSuccess={() => {
          setFormOpen(false)
          loadItems()
        }}
      />

      <ItemProducaoDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        item={selectedItem}
        onSuccess={() => {
          setDeleteOpen(false)
          loadItems()
        }}
      />
    </div>
  )
}
