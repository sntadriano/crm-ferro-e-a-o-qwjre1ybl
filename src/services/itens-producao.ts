import pb from '@/lib/pocketbase/client'

export interface ItemProducao {
  id: string
  nome: string
  tipo: string
  unidade: string
  status: boolean
  observacoes?: string
}

export const getActiveItensProducao = async () => {
  return pb.collection('itens_producao').getFullList<ItemProducao>({
    filter: 'status = true',
    sort: 'nome',
  })
}
