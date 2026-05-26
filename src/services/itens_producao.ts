import pb from '@/lib/pocketbase/client'

export interface ItemProducao {
  id: string
  nome: string
  tipo: string
  unidade: string
  status: boolean
  observacoes?: string
  created: string
  updated: string
}

export type ItemProducaoFormData = {
  nome: string
  tipo: string
  unidade: string
  status: boolean
  observacoes?: string
}

export const getItensProducao = async (page = 1, perPage = 20, searchTerm = '') => {
  const filter = searchTerm ? `nome ~ "${searchTerm.replace(/"/g, '')}"` : ''
  return pb.collection('itens_producao').getList<ItemProducao>(page, perPage, {
    filter,
    sort: '-created',
  })
}

export const createItemProducao = (data: ItemProducaoFormData) =>
  pb.collection('itens_producao').create<ItemProducao>(data)

export const updateItemProducao = (id: string, data: Partial<ItemProducaoFormData>) =>
  pb.collection('itens_producao').update<ItemProducao>(id, data)

export const softDeleteItemProducao = (id: string) =>
  pb.collection('itens_producao').update<ItemProducao>(id, { status: false })
