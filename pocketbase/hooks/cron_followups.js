cronAdd('check_followups', '0 * * * *', () => {
  const now = new Date()
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const next1h = new Date(now.getTime() + 60 * 60 * 1000)

  const leads = $app.findRecordsByFilter(
    'leads',
    "status != 'fechado' && status != 'perdido' && proximo_followup != '' && notificacao_enviada = false",
    '',
    1000,
    0,
  )

  for (const lead of leads) {
    const followupStr = lead.getString('proximo_followup')
    if (!followupStr) continue

    const followupDate = new Date(followupStr)

    let tipo = null
    if (followupDate < now) {
      tipo = 'atrasado'
    } else if (followupDate <= next1h) {
      tipo = '1h_antes'
    } else if (followupDate <= next24h) {
      tipo = '24h_antes'
    }

    if (tipo) {
      try {
        const notifCol = $app.findCollectionByNameOrId('notificacoes')
        const notif = new Record(notifCol)
        notif.set('lead_id', lead.id)
        notif.set('usuario_id', lead.getString('usuario_id'))
        notif.set('tipo', tipo)
        notif.set('status', 'nao_lida')
        $app.save(notif)

        lead.set('notificacao_enviada', true)
        $app.save(lead)
      } catch (e) {
        $app.logger().error('Error creating notification', 'lead_id', lead.id, 'error', e.message)
      }
    }
  }
})
