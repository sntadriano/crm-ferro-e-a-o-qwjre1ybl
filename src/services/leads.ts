import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface LeadFilters {
  search?: string
  status?: string
  sort?: string
}

export const getLeads = (page = 1, perPage = 20, filters: LeadFilters = {}) => {
  const f = []
  if (filters.search) f.push(`cliente_id.descricao ~ '${filters.search}'`)
  if (filters.status && filters.status !== 'todos') f.push(`status = '${filters.status}'`)

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
