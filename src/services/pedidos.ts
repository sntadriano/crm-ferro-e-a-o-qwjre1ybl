import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface PedidoRecord extends RecordModel {
  numero: number
  data?: string
  codigo_cliente?: number
  cliente_id?: string
  vendedor?: number
  cp?: string
  valor_pedido?: number
  entrada_dinheiro?: number
  entrada_pix?: number
  entrada_cartao?: number
  valor_aprazo?: number
  qtd_itens?: number
  frete?: number
  status?: string
  total_mercadorias?: number
  desconto_acrescimo?: number
}

export interface PedidoItemRecord extends RecordModel {
  pedido_id: string
  codigo_produto?: string
  produto_id?: string
  descricao?: string
  unidade?: string
  quantidade?: number
  valor_unitario?: number
  valor_total?: number
}

export interface PedidoFilters {
  dateStart?: string
  dateEnd?: string
  vendedor?: string
}

const buildFilter = (filters?: PedidoFilters): string => {
  const parts: string[] = []
  if (filters?.dateStart) {
    parts.push(`data >= "${new Date(filters.dateStart + 'T00:00:00').toISOString()}"`)
  }
  if (filters?.dateEnd) {
    parts.push(`data <= "${new Date(filters.dateEnd + 'T23:59:59').toISOString()}"`)
  }
  if (filters?.vendedor && filters.vendedor !== 'all') {
    parts.push(`vendedor = ${filters.vendedor}`)
  }
  return parts.join(' && ')
}

export const getPedidos = async (page = 1, perPage = 20, filters?: PedidoFilters) => {
  return pb.collection('pedidos').getList<PedidoRecord>(page, perPage, {
    filter: buildFilter(filters),
    sort: '-data',
    expand: 'cliente_id',
  })
}

export const getAllPedidos = async (filters?: PedidoFilters) => {
  return pb.collection('pedidos').getFullList<PedidoRecord>({
    filter: buildFilter(filters),
    sort: '-data',
  })
}

export const getPedidoItens = async (pedidoId: string) => {
  return pb.collection('pedido_itens').getFullList<PedidoItemRecord>({
    filter: `pedido_id = "${pedidoId}"`,
  })
}

export const importPedidos = async (pedidos: any[], itens: any[]) => {
  return pb.send('/backend/v1/pedidos/import', {
    method: 'POST',
    body: JSON.stringify({ pedidos, itens }),
    headers: { 'Content-Type': 'application/json' },
  })
}
