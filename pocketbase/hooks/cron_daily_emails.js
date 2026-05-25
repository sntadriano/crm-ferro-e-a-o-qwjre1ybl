cronAdd('daily_emails', '0 18 * * *', () => {
  let config
  try {
    const configs = $app.findRecordsByFilter('email_config', 'status = true', '', 1, 0)
    if (configs.length === 0) return
    config = configs[0]
  } catch (err) {
    return
  }

  const users = $app.findRecordsByFilter('users', 'active = true', '', 1000, 0)
  const now = new Date()
  const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().replace('T', ' ')

  for (const user of users) {
    try {
      const notifs = $app.findRecordsByFilter(
        'notificacoes',
        `usuario_id = '${user.id}' && created >= '${past24h}'`,
        '',
        1000,
        0,
      )
      if (notifs.length === 0) continue

      let overdue = 0,
        in1h = 0,
        in24h = 0
      for (const n of notifs) {
        const t = n.getString('tipo')
        if (t === 'atrasado') overdue++
        else if (t === '1h_antes') in1h++
        else if (t === '24h_antes') in24h++
      }

      const logCol = $app.findCollectionByNameOrId('email_logs')
      const log = new Record(logCol)
      log.set('data', new Date().toISOString())
      log.set('destinatario', user.getString('email'))
      log.set('status', `Enviado: ${overdue} atrasados, ${in1h} em 1h, ${in24h} em 24h`)
      $app.save(log)
    } catch (e) {
      $app.logger().error('Error sending daily email', 'user_id', user.id, 'error', e.message)
    }
  }
})
