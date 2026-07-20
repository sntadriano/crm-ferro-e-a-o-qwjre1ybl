import pb from '@/lib/pocketbase/client'

export interface Maquina {
  id: string
  nome: string
  tipo_categoria?: string
  status: boolean
  created: string
  updated: string
}

export type MaquinaFormData = {
  nome: string
  tipo_categoria?: string
  status: boolean
}

export const getMaquinas = async (page = 1, perPage = 20, searchTerm = '') => {
  const filter = searchTerm ? `nome ~ "${searchTerm.replace(/"/g, '')}"` : ''
  return pb.collection('maquinas').getList<Maquina>(page, perPage, {
    filter,
    sort: '-created',
  })
}

export const getActiveMaquinas = async () => {
  return pb.collection('maquinas').getFullList<Maquina>({
    filter: 'status = true',
    sort: 'nome',
  })
}

export const createMaquina = (data: MaquinaFormData) =>
  pb.collection('maquinas').create<Maquina>(data)

export const updateMaquina = (id: string, data: Partial<MaquinaFormData>) =>
  pb.collection('maquinas').update<Maquina>(id, data)

export const softDeleteMaquina = (id: string) =>
  pb.collection('maquinas').update<Maquina>(id, { status: false })
