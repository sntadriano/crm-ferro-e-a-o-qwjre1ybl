import pb from '@/lib/pocketbase/client'

export const getNotificacoes = () => {
  return pb.collection('notificacoes').getList(1, 50, {
    sort: '-created',
    expand: 'lead_id,lead_id.cliente_id',
  })
}

export const markAsRead = (id: string) => {
  return pb.collection('notificacoes').update(id, {
    status: 'lida',
    data_leitura: new Date().toISOString(),
  })
}

export const markAllAsRead = async (userId: string) => {
  const unread = await pb.collection('notificacoes').getFullList({
    filter: `status = 'nao_lida' && usuario_id = '${userId}'`,
  })

  const promises = unread.map((n) =>
    pb.collection('notificacoes').update(n.id, {
      status: 'lida',
      data_leitura: new Date().toISOString(),
    }),
  )

  await Promise.all(promises)
}

export const clearRead = async (userId: string) => {
  const read = await pb.collection('notificacoes').getFullList({
    filter: `status = 'lida' && usuario_id = '${userId}'`,
  })

  const promises = read.map((n) => pb.collection('notificacoes').delete(n.id))
  await Promise.all(promises)
}
