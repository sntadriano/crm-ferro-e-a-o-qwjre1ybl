onRecordAfterCreateSuccess((e) => {
  const adminId = e.auth?.id || 'system'
  const adminName = e.auth?.getString('name') || 'Sistema'

  const log = new Record($app.findCollectionByNameOrId('audit_logs'))
  log.set('usuario_id', adminId)
  log.set('usuario_nome', adminName)
  log.set('acao', 'create_lead')
  log.set('detalhes', { lead_id: e.record.id, status: e.record.getString('status') })
  $app.save(log)
  e.next()
}, 'leads')

onRecordAfterUpdateSuccess((e) => {
  const oldStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')

  if (oldStatus !== newStatus) {
    const adminId = e.auth?.id || 'system'
    const adminName = e.auth?.getString('name') || 'Sistema'

    const log = new Record($app.findCollectionByNameOrId('audit_logs'))
    log.set('usuario_id', adminId)
    log.set('usuario_nome', adminName)
    log.set('acao', 'change_lead_status')
    log.set('detalhes', { lead_id: e.record.id, from: oldStatus, to: newStatus })
    $app.save(log)
  }
  e.next()
}, 'leads')
