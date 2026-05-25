import pb from '@/lib/pocketbase/client'

export interface ClienteFilters {
  search?: string
  status?: string
  vendedor?: string
  cidade?: string
  date_start?: string
  date_end?: string
  sort?: string
}

export const getClientes = (page = 1, perPage = 20, filters: ClienteFilters = {}) => {
  const f = []
  if (filters.search) {
    const s = filters.search.replace(/'/g, "\\'")
    f.push(`(descricao ~ '${s}' || fantasia ~ '${s}' || cnpj_cpf ~ '${s}')`)
  }
  if (filters.status && filters.status !== 'all') f.push(`status = '${filters.status}'`)
  if (filters.vendedor && filters.vendedor !== 'all') f.push(`vendedor = ${filters.vendedor}`)
  if (filters.cidade && filters.cidade !== 'all') f.push(`cidade = '${filters.cidade}'`)
  if (filters.date_start) f.push(`cadastro >= '${filters.date_start} 00:00:00'`)
  if (filters.date_end) f.push(`cadastro <= '${filters.date_end} 23:59:59'`)

  return pb.collection('clientes').getList(page, perPage, {
    filter: f.join(' && '),
    sort: filters.sort || 'descricao',
  })
}
