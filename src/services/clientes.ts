import pb from '@/lib/pocketbase/client'

export const getClientes = (search = '') => {
  const filter = search
    ? `descricao ~ '${search}' || fantasia ~ '${search}' || cnpj_cpf ~ '${search}'`
    : ''
  return pb.collection('clientes').getList(1, 50, { filter, sort: 'descricao' })
}
