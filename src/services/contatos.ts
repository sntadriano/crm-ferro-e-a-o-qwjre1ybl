import pb from '@/lib/pocketbase/client'

export const getContatosByCliente = (clienteId: string) => {
  return pb.collection('contatos').getFullList({
    filter: `cliente_id = '${clienteId}'`,
    sort: '-data_contato',
    expand: 'usuario_id',
  })
}
