import pb from '@/lib/pocketbase/client'

export interface VendedorBreakdownItem {
  vendedor: number
  totalPedidos: number
  valorTotal: number
}

export interface VendasResumo {
  totalPedidos: number
  valorTotal: number
  quantidadeItens: number
  ticketMedio: number
  vendedorBreakdown: VendedorBreakdownItem[]
}

export interface VendasResumoParams {
  dateStart?: string
  dateEnd?: string
  vendedor?: string
}

export const getVendasResumo = async (params: VendasResumoParams): Promise<VendasResumo> => {
  return pb.send('/backend/v1/vendas/resumo', {
    method: 'POST',
    body: JSON.stringify({
      dateStart: params.dateStart || '',
      dateEnd: params.dateEnd || '',
      vendedor: params.vendedor || 'all',
    }),
    headers: { 'Content-Type': 'application/json' },
  })
}
