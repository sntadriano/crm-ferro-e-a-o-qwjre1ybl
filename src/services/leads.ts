import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface LeadFilters {
  search?: string
  status?: string
  sort?: string
  date_start?: string
  date_end?: string
  value_min?: number | ''
  value_max?: number | ''
  cliente_id?: string
}

export const getLeads = (page = 1, perPage = 20, filters: LeadFilters = {}) => {
  const f = []
  if (filters.search) f.push(`cliente_id.descricao ~ '${filters.search}'`)
  if (filters.status && filters.status !== 'todos') f.push(`status = '${filters.status}'`)
  if (filters.date_start) f.push(`created >= '${filters.date_start} 00:00:00'`)
  if (filters.date_end) f.push(`created <= '${filters.date_end} 23:59:59'`)
  if (filters.value_min !== undefined && filters.value_min !== '')
    f.push(`valor_estimado >= ${filters.value_min}`)
  if (filters.value_max !== undefined && filters.value_max !== '')
    f.push(`valor_estimado <= ${filters.value_max}`)
  if (filters.cliente_id) f.push(`cliente_id = '${filters.cliente_id}'`)

  return pb.collection('leads').getList(page, perPage, {
    filter: f.join(' && '),
    sort: filters.sort || '-created',
    expand: 'cliente_id,usuario_id',
  })
}

export const getLead = (id: string) => {
  return pb.collection('leads').getOne(id, {
    expand: 'cliente_id,usuario_id',
  })
}

export const createLead = (data: Partial<RecordModel>) => {
  return pb.collection('leads').create(data)
}

export const updateLead = (id: string, data: Partial<RecordModel>) => {
  return pb.collection('leads').update(id, data)
}

export const deleteLead = (id: string) => {
  return pb.collection('leads').delete(id)
}
