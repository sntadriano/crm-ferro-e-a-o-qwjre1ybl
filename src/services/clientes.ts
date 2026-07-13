import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface ClienteFilters {
  search?: string
  status?: string
  vendedor?: string
  cidade?: string
  date_start?: string
  date_end?: string
  sort?: string
}

export interface ClienteRecord extends RecordModel {
  codigo?: number
  descricao?: string
  fantasia?: string
  cnpj_cpf?: string
  insc_estadual?: string
  fone?: string
  celular?: string
  email?: string
  endereco?: string
  bairro?: string
  cidade?: string
  uf?: string
  cep?: string
  tipo?: string
  vendedor?: number
  cadastro?: string
  status?: string
}

const buildFilter = (filters: ClienteFilters = {}): string => {
  const user = pb.authStore.record as any
  const role = user?.role || ''
  const parts: string[] = []

  // Only vendedores are restricted to their own clients.
  // Admin, gerente, and julia can see all clients — no hardcoded vendedor filter.
  if (role === 'vendedor') {
    parts.push(`vendedor = ${user?.codigo ?? 0}`)
  }

  if (filters.search) {
    const s = filters.search.replace(/"/g, '')
    parts.push(`(descricao ~ "${s}" || fantasia ~ "${s}" || cnpj_cpf ~ "${s}")`)
  }

  if (filters.status && filters.status !== 'all') {
    parts.push(`status = "${filters.status}"`)
  }

  if (filters.vendedor && filters.vendedor !== 'all') {
    parts.push(`vendedor = ${filters.vendedor}`)
  }

  if (filters.cidade && filters.cidade !== 'all') {
    parts.push(`cidade ~ "${filters.cidade.replace(/"/g, '')}"`)
  }

  if (filters.date_start) {
    parts.push(`cadastro >= "${new Date(filters.date_start + 'T00:00:00').toISOString()}"`)
  }

  if (filters.date_end) {
    parts.push(`cadastro <= "${new Date(filters.date_end + 'T23:59:59').toISOString()}"`)
  }

  return parts.length > 0 ? parts.join(' && ') : ''
}

export const getClientes = async (page: number, perPage: number, filters: ClienteFilters = {}) => {
  return pb.collection('clientes').getList<ClienteRecord>(page, perPage, {
    filter: buildFilter(filters),
    sort: filters.sort || '-created',
  })
}

export const getAllClientes = async (filters: ClienteFilters = {}) => {
  return pb.collection('clientes').getFullList<ClienteRecord>({
    filter: buildFilter(filters),
    sort: filters.sort || '-created',
  })
}

export const getCliente = async (id: string) => {
  return pb.collection('clientes').getOne<ClienteRecord>(id)
}

export const createCliente = async (data: Partial<ClienteRecord>) => {
  return pb.collection('clientes').create<ClienteRecord>(data)
}

export const updateCliente = async (id: string, data: Partial<ClienteRecord>) => {
  return pb.collection('clientes').update<ClienteRecord>(id, data)
}

export const deleteCliente = async (id: string) => {
  return pb.collection('clientes').delete(id)
}
