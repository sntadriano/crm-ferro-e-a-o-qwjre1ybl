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

export const getContatosByCliente = (clienteId: string) => {
  return pb.collection('contatos').getFullList({
    filter: `cliente_id = '${clienteId}'`,
    sort: '-data_contato',
    expand: 'usuario_id,cliente_id',
  })
}
