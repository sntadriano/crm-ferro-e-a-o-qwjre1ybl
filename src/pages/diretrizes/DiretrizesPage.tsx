import { useEffect, useState, useMemo } from 'react'
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  Briefcase,
  Factory,
  Package,
  Headphones,
  FileText,
  Search,
  FolderPlus,
  HelpCircle,
  LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  Diretriz,
  DiretrizCategoria,
  getCategorias,
  getDiretrizes,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  createDiretriz,
  updateDiretriz,
  deleteDiretriz,
} from '@/services/diretrizes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Label } from '@/components/ui/label'

const ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp,
  Briefcase,
  Factory,
  Package,
  Headphones,
  FileText,
}

// Mesma regra de permissão usada no painel de administração:
const isAdriano = (user: any) => {
  if (!user) return false
  const username = String(user.username ?? '')
    .trim()
    .toLowerCase()
  const email = String(user.email ?? '')
    .trim()
    .toLowerCase()
  return username === 'adriano' || email === 'adriano_santos_09@hotmail.com'
}

export default function DiretrizesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const canManage = isAdriano(user)

  const [categorias, setCategorias] = useState<DiretrizCategoria[]>([])
  const [diretrizes, setDiretrizes] = useState<Diretriz[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modais de Categoria
  const [categoriaModalOpen, setCategoriaModalOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<DiretrizCategoria | null>(null)
  const [categoriaForm, setCategoriaForm] = useState({
    nome: '',
    descricao: '',
    icone: 'FileText',
    ordem: 0,
  })
  const [savingCategoria, setSavingCategoria] = useState(false)

  // Modais de Diretriz
  const [diretrizModalOpen, setDiretrizModalOpen] = useState(false)
  const [editingDiretriz, setEditingDiretriz] = useState<Diretriz | null>(null)
  const [targetCategoriaId, setTargetCategoriaId] = useState<string>('')
  const [diretrizForm, setDiretrizForm] = useState({
    titulo: '',
    conteudo: '',
    ordem: 0,
  })
  const [savingDiretriz, setSavingDiretriz] = useState(false)

  // Dialog de Exclusão
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'categoria' | 'diretriz'
    id: string
    title: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [cats, dirs] = await Promise.all([getCategorias(), getDiretrizes()])
      setCategorias(cats)
      setDiretrizes(dirs)
    } catch (error) {
      console.error('Erro ao carregar diretrizes:', error)
      toast({
        title: 'Erro ao carregar diretrizes',
        description: 'Não foi possível carregar os dados. Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtragem
  const filteredCategorias = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return categorias

    return categorias.filter((cat) => {
      const matchCat =
        cat.nome.toLowerCase().includes(term) ||
        (cat.descricao && cat.descricao.toLowerCase().includes(term))
      const hasMatchDiretriz = diretrizes.some(
        (dir) =>
          dir.categoria === cat.id &&
          (dir.titulo.toLowerCase().includes(term) ||
            (dir.conteudo && dir.conteudo.toLowerCase().includes(term))),
      )
      return matchCat || hasMatchDiretriz
    })
  }, [categorias, diretrizes, searchTerm])

  const getDiretrizesForCategoria = (categoriaId: string) => {
    const term = searchTerm.trim().toLowerCase()
    const list = diretrizes.filter((d) => d.categoria === categoriaId)
    if (!term) return list
    return list.filter(
      (d) =>
        d.titulo.toLowerCase().includes(term) ||
        (d.conteudo && d.conteudo.toLowerCase().includes(term)),
    )
  }

  // Ações de Categoria
  const handleOpenNewCategoria = () => {
    setEditingCategoria(null)
    setCategoriaForm({
      nome: '',
      descricao: '',
      icone: 'FileText',
      ordem: (categorias.length + 1) * 1,
    })
    setCategoriaModalOpen(true)
  }

  const handleOpenEditCategoria = (cat: DiretrizCategoria) => {
    setEditingCategoria(cat)
    setCategoriaForm({
      nome: cat.nome,
      descricao: cat.descricao || '',
      icone: cat.icone || 'FileText',
      ordem: cat.ordem ?? 0,
    })
    setCategoriaModalOpen(true)
  }

  const handleSaveCategoria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoriaForm.nome.trim()) {
      toast({ title: 'O nome da categoria é obrigatório', variant: 'destructive' })
      return
    }

    try {
      setSavingCategoria(true)
      if (editingCategoria) {
        await updateCategoria(editingCategoria.id, {
          nome: categoriaForm.nome.trim(),
          descricao: categoriaForm.descricao.trim() || undefined,
          icone: categoriaForm.icone || undefined,
          ordem: Number(categoriaForm.ordem) || 0,
        })
        toast({ title: 'Categoria atualizada com sucesso' })
      } else {
        await createCategoria({
          nome: categoriaForm.nome.trim(),
          descricao: categoriaForm.descricao.trim() || undefined,
          icone: categoriaForm.icone || undefined,
          ordem: Number(categoriaForm.ordem) || 0,
        })
        toast({ title: 'Categoria criada com sucesso' })
      }
      setCategoriaModalOpen(false)
      loadData()
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao salvar categoria',
        description: err.message || 'Verifique suas permissões.',
        variant: 'destructive',
      })
    } finally {
      setSavingCategoria(false)
    }
  }

  // Ações de Diretriz
  const handleOpenNewDiretriz = (categoriaId: string) => {
    setEditingDiretriz(null)
    setTargetCategoriaId(categoriaId)
    const existing = diretrizes.filter((d) => d.categoria === categoriaId)
    setDiretrizForm({
      titulo: '',
      conteudo: '',
      ordem: (existing.length + 1) * 1,
    })
    setDiretrizModalOpen(true)
  }

  const handleOpenEditDiretriz = (dir: Diretriz) => {
    setEditingDiretriz(dir)
    setTargetCategoriaId(dir.categoria)
    setDiretrizForm({
      titulo: dir.titulo,
      conteudo: dir.conteudo || '',
      ordem: dir.ordem ?? 0,
    })
    setDiretrizModalOpen(true)
  }

  const handleSaveDiretriz = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!diretrizForm.titulo.trim()) {
      toast({ title: 'O título da diretriz é obrigatório', variant: 'destructive' })
      return
    }

    try {
      setSavingDiretriz(true)
      if (editingDiretriz) {
        await updateDiretriz(editingDiretriz.id, {
          titulo: diretrizForm.titulo.trim(),
          conteudo: diretrizForm.conteudo.trim() || undefined,
          ordem: Number(diretrizForm.ordem) || 0,
        })
        toast({ title: 'Diretriz atualizada com sucesso' })
      } else {
        await createDiretriz({
          categoria: targetCategoriaId,
          titulo: diretrizForm.titulo.trim(),
          conteudo: diretrizForm.conteudo.trim() || undefined,
          ordem: Number(diretrizForm.ordem) || 0,
        })
        toast({ title: 'Diretriz adicionada com sucesso' })
      }
      setDiretrizModalOpen(false)
      loadData()
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao salvar diretriz',
        description: err.message || 'Verifique suas permissões.',
        variant: 'destructive',
      })
    } finally {
      setSavingDiretriz(false)
    }
  }

  // Confirmação de exclusão
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      if (deleteTarget.type === 'categoria') {
        await deleteCategoria(deleteTarget.id)
        toast({ title: 'Categoria excluída com sucesso' })
      } else {
        await deleteDiretriz(deleteTarget.id)
        toast({ title: 'Diretriz excluída com sucesso' })
      }
      setDeleteTarget(null)
      loadData()
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao excluir',
        description: err.message || 'Falha ao processar exclusão.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const totalDiretrizes = diretrizes.length

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Diretrizes da Empresa
          </h1>
          <p className="text-muted-foreground mt-1">
            Manual de normas, procedimentos, políticas e diretrizes operacionais do CRM Ferro e Aço.
          </p>
        </div>

        {canManage && (
          <Button onClick={handleOpenNewCategoria} className="gap-2 shrink-0">
            <FolderPlus className="h-4 w-4" />
            Nova Categoria
          </Button>
        )}
      </div>

      {/* Barra de busca e estatísticas */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por título, norma ou conteúdo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-sm text-muted-foreground">
          <Badge variant="outline" className="font-normal">
            {categorias.length} {categorias.length === 1 ? 'categoria' : 'categorias'}
          </Badge>
          <Badge variant="secondary" className="font-normal">
            {totalDiretrizes} {totalDiretrizes === 1 ? 'diretriz' : 'diretrizes'} cadastradas
          </Badge>
        </div>
      </div>

      {/* Conteúdo Principal */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm">Carregando diretrizes...</p>
        </div>
      ) : filteredCategorias.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <HelpCircle className="h-12 w-12 text-muted-foreground/60 mx-auto" />
            <h3 className="text-lg font-semibold">Nenhuma diretriz encontrada</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {searchTerm
                ? 'Nenhum resultado corresponde à sua pesquisa. Tente buscar com outras palavras-chave.'
                : 'Nenhuma categoria ou diretriz cadastrada ainda.'}
            </p>
            {canManage && !searchTerm && (
              <Button onClick={handleOpenNewCategoria} variant="outline" className="gap-2 mt-2">
                <Plus className="h-4 w-4" /> Criar primeira categoria
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Accordion
          type="multiple"
          defaultValue={filteredCategorias.map((c) => c.id)}
          className="space-y-4"
        >
          {filteredCategorias.map((cat) => {
            const IconComponent = (cat.icone && ICON_MAP[cat.icone]) || FileText
            const categoryDiretrizes = getDiretrizesForCategoria(cat.id)

            return (
              <AccordionItem
                key={cat.id}
                value={cat.id}
                className="border rounded-lg bg-card shadow-sm overflow-hidden px-4"
              >
                <div className="flex items-center justify-between py-2">
                  <AccordionTrigger className="hover:no-underline py-2 flex-1">
                    <div className="flex items-center gap-3 text-left">
                      <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-base flex items-center gap-2">
                          {cat.nome}
                          <Badge variant="outline" className="text-xs font-normal">
                            {categoryDiretrizes.length}
                          </Badge>
                        </div>
                        {cat.descricao && (
                          <p className="text-xs text-muted-foreground font-normal mt-0.5 line-clamp-1">
                            {cat.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>

                  {canManage && (
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 gap-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenNewDiretriz(cat.id)
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Adicionar diretriz</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Editar Categoria"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenEditCategoria(cat)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive/80 hover:text-destructive"
                        title="Excluir Categoria"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget({
                            type: 'categoria',
                            id: cat.id,
                            title: `a categoria "${cat.nome}" e todas as suas diretrizes`,
                          })
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                <AccordionContent className="pt-2 pb-4">
                  {categoryDiretrizes.length === 0 ? (
                    <div className="text-center py-6 px-4 border border-dashed rounded-md bg-muted/20">
                      <p className="text-sm text-muted-foreground">
                        Nenhuma diretriz cadastrada nesta categoria ainda.
                      </p>
                      {canManage && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 gap-1 text-xs"
                          onClick={() => handleOpenNewDiretriz(cat.id)}
                        >
                          <Plus className="h-3.5 w-3.5" /> Adicionar primeira diretriz
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {categoryDiretrizes.map((dir) => (
                        <Card key={dir.id} className="border-border/60 shadow-none bg-muted/10">
                          <CardHeader className="py-3 px-4 flex flex-row items-start justify-between space-y-0">
                            <div>
                              <CardTitle className="text-sm font-semibold">{dir.titulo}</CardTitle>
                              {dir.updated && (
                                <CardDescription className="text-[11px] mt-0.5">
                                  Atualizado em {new Date(dir.updated).toLocaleDateString('pt-BR')}
                                </CardDescription>
                              )}
                            </div>
                            {canManage && (
                              <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleOpenEditDiretriz(dir)}
                                  title="Editar diretriz"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive/80 hover:text-destructive"
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'diretriz',
                                      id: dir.id,
                                      title: `a diretriz "${dir.titulo}"`,
                                    })
                                  }
                                  title="Excluir diretriz"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </CardHeader>
                          {dir.conteudo && (
                            <CardContent className="py-2 px-4 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed border-t border-border/40 bg-background/50 rounded-b-lg">
                              {dir.conteudo}
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      {/* Modal Categoria */}
      <Dialog open={categoriaModalOpen} onOpenChange={setCategoriaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? 'Editar Categoria' : 'Nova Categoria de Diretrizes'}
            </DialogTitle>
            <DialogDescription>
              Organize os procedimentos por área de atuação da empresa.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCategoria} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-nome">Nome da Categoria *</Label>
              <Input
                id="cat-nome"
                required
                placeholder="Ex: Vendas, Produção..."
                value={categoriaForm.nome}
                onChange={(e) => setCategoriaForm((prev) => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Descrição</Label>
              <Input
                id="cat-desc"
                placeholder="Breve resumo sobre o propósito da categoria"
                value={categoriaForm.descricao}
                onChange={(e) =>
                  setCategoriaForm((prev) => ({ ...prev, descricao: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-icone">Ícone</Label>
                <select
                  id="cat-icone"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={categoriaForm.icone}
                  onChange={(e) => setCategoriaForm((prev) => ({ ...prev, icone: e.target.value }))}
                >
                  <option value="TrendingUp">Vendas (TrendingUp)</option>
                  <option value="Briefcase">Administrativo (Briefcase)</option>
                  <option value="Factory">Produção (Factory)</option>
                  <option value="Package">Estoque / Logística (Package)</option>
                  <option value="Headphones">Atendimento (Headphones)</option>
                  <option value="FileText">Geral (FileText)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-ordem">Ordem de Exibição</Label>
                <Input
                  id="cat-ordem"
                  type="number"
                  value={categoriaForm.ordem}
                  onChange={(e) =>
                    setCategoriaForm((prev) => ({ ...prev, ordem: Number(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoriaModalOpen(false)}
                disabled={savingCategoria}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingCategoria}>
                {savingCategoria ? 'Salvando...' : 'Salvar Categoria'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Diretriz */}
      <Dialog open={diretrizModalOpen} onOpenChange={setDiretrizModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDiretriz ? 'Editar Diretriz' : 'Adicionar Diretriz'}</DialogTitle>
            <DialogDescription>
              Defina o título da regra, norma ou procedimento e seu conteúdo descritivo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveDiretriz} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dir-titulo">Título da Diretriz *</Label>
              <Input
                id="dir-titulo"
                required
                placeholder="Ex: Política de Descontos e Prazos"
                value={diretrizForm.titulo}
                onChange={(e) => setDiretrizForm((prev) => ({ ...prev, titulo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dir-conteudo">Conteúdo / Regras</Label>
              <Textarea
                id="dir-conteudo"
                rows={6}
                placeholder="Escreva detalhadamente o procedimento, passo a passo ou regras que devem ser seguidas..."
                value={diretrizForm.conteudo}
                onChange={(e) => setDiretrizForm((prev) => ({ ...prev, conteudo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dir-ordem">Ordem de Exibição</Label>
              <Input
                id="dir-ordem"
                type="number"
                value={diretrizForm.ordem}
                onChange={(e) =>
                  setDiretrizForm((prev) => ({ ...prev, ordem: Number(e.target.value) || 0 }))
                }
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDiretrizModalOpen(false)}
                disabled={savingDiretriz}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingDiretriz}>
                {savingDiretriz ? 'Salvando...' : 'Salvar Diretriz'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alerta de Exclusão */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir {deleteTarget?.title}? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
