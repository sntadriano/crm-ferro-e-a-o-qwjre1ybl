import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface ProdutoRecord extends RecordModel {
  codigo: string
  descricao?: string
  unidade?: string
  custo?: number
}

export const getProdutos = async (page = 1, perPage = 20) => {
  return pb.collection('produtos').getList<ProdutoRecord>(page, perPage, { sort: 'codigo' })
}

export const getAllProdutos = async () => {
  return pb.collection('produtos').getFullList<ProdutoRecord>({ sort: 'codigo' })
}

export const importProdutos = async (produtos: any[]) => {
  return pb.send('/backend/v1/produtos/import', {
    method: 'POST',
    body: JSON.stringify({ produtos }),
    headers: { 'Content-Type': 'application/json' },
  })
}
