import { useEffect, useState } from 'react'
import { Cog, Plus, Search, Edit, Trash2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Maquina, getMaquinas } from '@/services/maquinas'
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
import { MaquinaFormDialog } from '@/components/producao/MaquinaFormDialog'
import { MaquinaDeleteDialog } from '@/components/producao/MaquinaDeleteDialog'

export default function MaquinasPage() {
  const { user } = useAuth()
  const canEdit = user && ['admin', 'gerente', 'gerente_producao'].includes(user.role)

  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedMaquina, setSelectedMaquina] = useState<Maquina | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadMaquinas = async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await getMaquinas(page, 20, debouncedSearch)
      setMaquinas(data.items)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMaquinas()
  }, [page, debouncedSearch])

  useRealtime('maquinas', () => {
    loadMaquinas()
  })

  const handleCreate = () => {
    setSelectedMaquina(null)
    setFormOpen(true)
  }

  const handleEdit = (maquina: Maquina) => {
    setSelectedMaquina(maquina)
    setFormOpen(true)
  }

  const handleDelete = (maquina: Maquina) => {
    setSelectedMaquina(maquina)
    setDeleteOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {canEdit && (
          <Button onClick={handleCreate} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Nova Máquina/Processo
          </Button>
        )}
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-red-50/50 dark:bg-red-950/20">
          <p className="text-red-500 mb-4 font-medium">Ocorreu um erro ao carregar os dados</p>
          <Button variant="outline" onClick={loadMaquinas}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full rounded-md" />
        </div>
      ) : maquinas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/10">
          <Cog className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma máquina/processo encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
            {debouncedSearch
              ? 'Tente limpar a busca para ver todos os registros.'
              : 'Cadastre a primeira máquina ou processo para começar.'}
          </p>
          {canEdit && !debouncedSearch && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Máquina/Processo
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {maquinas.map((maquina) => (
              <Card key={maquina.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{maquina.nome}</h3>
                    <Badge variant={maquina.status ? 'default' : 'secondary'}>
                      {maquina.status ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>
                      Tipo/Categoria:{' '}
                      <span className="text-foreground">{maquina.tipo_categoria || '-'}</span>
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2 mt-4 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(maquina)}>
                        Editar
                      </Button>
                      {maquina.status && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(maquina)}
                        >
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
                  <TableHead>Tipo/Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {maquinas.map((maquina) => (
                  <TableRow key={maquina.id}>
                    <TableCell className="font-medium">{maquina.nome}</TableCell>
                    <TableCell>{maquina.tipo_categoria || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={maquina.status ? 'default' : 'secondary'}>
                        {maquina.status ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(maquina)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {maquina.status ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                            onClick={() => handleDelete(maquina)}
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

      <MaquinaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        maquina={selectedMaquina}
        onSuccess={() => {
          setFormOpen(false)
          loadMaquinas()
        }}
      />

      <MaquinaDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        maquina={selectedMaquina}
        onSuccess={() => {
          setDeleteOpen(false)
          loadMaquinas()
        }}
      />
    </div>
  )
}
