onRecordAfterCreateSuccess(
  (e) => {
    const auditLogs = $app.findCollectionByNameOrId('audit_logs')
    const record = new Record(auditLogs)
    record.set('usuario_id', e.auth ? e.auth.id : 'system')
    record.set('usuario_nome', e.auth ? e.auth.getString('name') : 'System')
    record.set('acao', 'CREATE')

    let exp = {}
    try {
      exp = e.record.publicExport()
    } catch (_) {}

    record.set('detalhes', {
      collection: e.record.collection().name,
      recordId: e.record.id,
      data: exp,
    })
    $app.saveNoValidate(record)
    e.next()
  },
  'clientes',
  'leads',
  'contatos',
  'users',
)

onRecordAfterUpdateSuccess(
  (e) => {
    const auditLogs = $app.findCollectionByNameOrId('audit_logs')
    const record = new Record(auditLogs)
    record.set('usuario_id', e.auth ? e.auth.id : 'system')
    record.set('usuario_nome', e.auth ? e.auth.getString('name') : 'System')
    record.set('acao', 'UPDATE')

    let exp = {}
    try {
      exp = e.record.publicExport()
    } catch (_) {}

    record.set('detalhes', {
      collection: e.record.collection().name,
      recordId: e.record.id,
      data: exp,
    })
    $app.saveNoValidate(record)
    e.next()
  },
  'clientes',
  'leads',
  'contatos',
  'users',
)

onRecordAfterDeleteSuccess(
  (e) => {
    const auditLogs = $app.findCollectionByNameOrId('audit_logs')
    const record = new Record(auditLogs)
    record.set('usuario_id', e.auth ? e.auth.id : 'system')
    record.set('usuario_nome', e.auth ? e.auth.getString('name') : 'System')
    record.set('acao', 'DELETE')
    record.set('detalhes', { collection: e.record.collection().name, recordId: e.record.id })
    $app.saveNoValidate(record)
    e.next()
  },
  'clientes',
  'leads',
  'contatos',
  'users',
)
