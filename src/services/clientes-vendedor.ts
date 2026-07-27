import pb from '@/lib/pocketbase/client'

export interface PopularVendedorDetail {
  cliente_id: string
  codigo: number
  descricao: string
  vendedor_anterior: number
  vendedor_novo: number
  total_pedidos: number
}

export interface PopularVendedorResult {
  apply: boolean
  totalClientes: number
  resolved: number
  unresolved: number
  updated: number
  wouldUpdate: number
  details: PopularVendedorDetail[]
}

export const popularVendedorReport = async (): Promise<PopularVendedorResult> => {
  return pb.send('/backend/v1/clientes/popular-vendedor', {
    method: 'POST',
    body: JSON.stringify({ apply: false }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const popularVendedorApply = async (): Promise<PopularVendedorResult> => {
  return pb.send('/backend/v1/clientes/popular-vendedor', {
    method: 'POST',
    body: JSON.stringify({ apply: true }),
    headers: { 'Content-Type': 'application/json' },
  })
}
