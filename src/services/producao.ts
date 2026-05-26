import pb from '@/lib/pocketbase/client'

export interface ProducaoRecord {
  id: string
  item: string
  item_id?: string
  quantidade: number
  data_producao: string
  usuario_id: string
  status: 'registrado' | 'conferido'
  observacoes?: string
  ativo?: boolean
  created: string
  updated: string
  expand?: {
    item_id?: {
      id: string
      nome: string
      unidade: string
    }
    usuario_id?: {
      id: string
      name: string
      email: string
    }
  }
}

export const getProducoesRelatorio = async (startDate: string, endDate: string) => {
  return pb.collection('producao').getFullList<ProducaoRecord>({
    filter: `data_producao >= '${startDate} 00:00:00' && data_producao <= '${endDate} 23:59:59' && ativo = true`,
    sort: '-data_producao',
    expand: 'item_id,usuario_id',
  })
}

export const getProducoes = async (params: {
  page?: number
  perPage?: number
  filter?: string
  sort?: string
}) => {
  return pb.collection('producao').getList<ProducaoRecord>(params.page || 1, params.perPage || 20, {
    sort: params.sort || '-data_producao',
    filter: params.filter || 'ativo = true',
    expand: 'item_id,usuario_id',
  })
}

export const createProducao = async (data: Partial<ProducaoRecord>) =>
  pb.collection('producao').create(data)

export const updateProducao = async (id: string, data: Partial<ProducaoRecord>) =>
  pb.collection('producao').update(id, data)

export const softDeleteProducao = async (id: string) =>
  pb.collection('producao').update(id, { ativo: false })
