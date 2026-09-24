import pb from '@/lib/pocketbase/client'

export interface DiretrizCategoria {
  id: string
  nome: string
  descricao?: string
  icone?: string
  ordem?: number
  created: string
  updated: string
}

export interface Diretriz {
  id: string
  categoria: string
  titulo: string
  conteudo?: string
  ordem?: number
  created: string
  updated: string
  expand?: {
    categoria?: DiretrizCategoria
  }
}

export type DiretrizCategoriaFormData = {
  nome: string
  descricao?: string
  icone?: string
  ordem?: number
}

export type DiretrizFormData = {
  categoria: string
  titulo: string
  conteudo?: string
  ordem?: number
}

// Categorias
export const getCategorias = async (): Promise<DiretrizCategoria[]> => {
  return pb.collection('diretrizes_categorias').getFullList<DiretrizCategoria>({
    sort: 'ordem,nome',
  })
}

export const createCategoria = async (
  data: DiretrizCategoriaFormData,
): Promise<DiretrizCategoria> => {
  return pb.collection('diretrizes_categorias').create<DiretrizCategoria>(data)
}

export const updateCategoria = async (
  id: string,
  data: Partial<DiretrizCategoriaFormData>,
): Promise<DiretrizCategoria> => {
  return pb.collection('diretrizes_categorias').update<DiretrizCategoria>(id, data)
}

export const deleteCategoria = async (id: string): Promise<boolean> => {
  return pb.collection('diretrizes_categorias').delete(id)
}

// Diretrizes
export const getDiretrizes = async (categoriaId?: string): Promise<Diretriz[]> => {
  const filter = categoriaId ? `categoria = "${categoriaId}"` : ''
  return pb.collection('diretrizes').getFullList<Diretriz>({
    filter,
    sort: 'ordem,created',
  })
}

export const createDiretriz = async (data: DiretrizFormData): Promise<Diretriz> => {
  return pb.collection('diretrizes').create<Diretriz>(data)
}

export const updateDiretriz = async (
  id: string,
  data: Partial<DiretrizFormData>,
): Promise<Diretriz> => {
  return pb.collection('diretrizes').update<Diretriz>(id, data)
}

export const deleteDiretriz = async (id: string): Promise<boolean> => {
  return pb.collection('diretrizes').delete(id)
}
