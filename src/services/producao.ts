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
    fotos_producao_via_producao_id?: Array<{
      id: string
      arquivo: string[]
      collectionId: string
      collectionName: string
    }>
  }
}

export const getProducoesRelatorio = async (
  startDate: string,
  endDate: string,
  fields?: string,
) => {
  return pb.collection('producao').getFullList<ProducaoRecord>({
    filter: `data_producao >= '${new Date(startDate + 'T00:00:00').toISOString()}' && data_producao <= '${new Date(endDate + 'T23:59:59').toISOString()}' && ativo = true`,
    sort: '-data_producao',
    expand: 'item_id,usuario_id,fotos_producao_via_producao_id',
    fields,
  })
}

export const getFullProducoes = async (filter: string, fields?: string) => {
  return pb.collection('producao').getFullList<ProducaoRecord>({
    filter: buildProducaoFilter(filter),
    sort: '-data_producao',
    expand: 'item_id,usuario_id,fotos_producao_via_producao_id',
    fields,
  })
}

const buildProducaoFilter = (extra?: string): string => {
  const user = pb.authStore.record as any
  const role = user?.role || ''
  const parts: string[] = ['ativo = true']

  // Admins and authorised roles (gerente, paulo, julia) see every
  // production record — never append a usuario_id filter for them.
  // Any other authenticated user only sees their own records.
  if (role !== 'admin' && role !== 'gerente' && role !== 'paulo' && role !== 'julia') {
    parts.push(`usuario_id = "${user?.id ?? ''}"`)
  }

  if (extra) parts.push(`(${extra})`)

  return parts.join(' && ')
}

export const getProducoes = async (params: {
  page?: number
  perPage?: number
  filter?: string
  sort?: string
  fields?: string
}) => {
  return pb.collection('producao').getList<ProducaoRecord>(params.page || 1, params.perPage || 20, {
    sort: params.sort || '-data_producao',
    filter: buildProducaoFilter(params.filter),
    expand: 'item_id,usuario_id,fotos_producao_via_producao_id',
    fields: params.fields,
  })
}

export const createProducao = async (data: Partial<ProducaoRecord>) =>
  pb.collection('producao').create(data)

export const updateProducao = async (id: string, data: Partial<ProducaoRecord>) =>
  pb.collection('producao').update(id, data)

export const softDeleteProducao = async (id: string) =>
  pb.collection('producao').update(id, { ativo: false })

export const deleteProducao = async (id: string) => pb.collection('producao').delete(id)
