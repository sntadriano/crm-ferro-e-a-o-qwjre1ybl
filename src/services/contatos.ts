import pb from '@/lib/pocketbase/client'

export const getContatos = async (page = 1, perPage = 20, filter = '', sort = '-data_contato') => {
  return pb.collection('contatos').getList(page, perPage, {
    filter,
    sort,
    expand: 'cliente_id,usuario_id',
  })
}

export const getContato = async (id: string) => {
  return pb.collection('contatos').getOne(id, { expand: 'cliente_id,usuario_id' })
}

export const createContato = async (data: any) => {
  return pb.collection('contatos').create(data)
}

export const updateContato = async (id: string, data: any) => {
  return pb.collection('contatos').update(id, data)
}

export const deleteContato = async (id: string) => {
  return pb.collection('contatos').delete(id)
}

export const getContatosVendas = async (startDate: string, endDate: string) => {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  return pb.collection('contatos').getFullList({
    filter: `data_contato >= '${start.toISOString().replace('T', ' ')}' && data_contato <= '${end.toISOString().replace('T', ' ')}'`,
    sort: '-data_contato',
    expand: 'cliente_id,usuario_id',
  })
}

export const getContatosPendentes = async () => {
  return pb.collection('contatos').getFullList({
    filter: `status_aprovacao = 'pendente'`,
    sort: '-data_contato',
    expand: 'cliente_id,usuario_id',
  })
}

export const aprovarContato = async (id: string) => {
  return pb.collection('contatos').update(id, { status_aprovacao: 'aprovado' })
}

export const getContatosByCliente = (clienteId: string) => {
  return pb.collection('contatos').getFullList({
    filter: `cliente_id = '${clienteId}'`,
    sort: '-data_contato',
    expand: 'usuario_id,cliente_id',
  })
}
