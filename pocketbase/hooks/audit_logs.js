onRecordAfterCreateSuccess(
  (e) => {
    try {
      const auditLogs = $app.findCollectionByNameOrId('audit_logs')
      const record = new Record(auditLogs)
      record.set('usuario_id', e.auth ? e.auth.id : 'system')
      record.set('usuario_nome', e.auth ? e.auth.getString('name') : 'System')
      record.set('acao', 'CREATE')
      record.set('tabela', e.record.collection().name)
      record.set('registro_id', e.record.id)

      let exp = {}
      try {
        exp = e.record.publicExport()
      } catch (_) {}

      record.set('detalhes', [
        {
          campo: 'all',
          valor_anterior: null,
          valor_novo: exp,
        },
      ])
      $app.saveNoValidate(record)
    } catch (err) {
      console.log('Error creating audit log in onRecordAfterCreateSuccess:', err)
    }
    e.next()
  },
  'clientes',
  'leads',
  'contatos',
  'users',
  'producao',
)

onRecordAfterUpdateSuccess(
  (e) => {
    try {
      const auditLogs = $app.findCollectionByNameOrId('audit_logs')
      const record = new Record(auditLogs)
      record.set('usuario_id', e.auth ? e.auth.id : 'system')
      record.set('usuario_nome', e.auth ? e.auth.getString('name') : 'System')
      record.set('acao', 'UPDATE')
      record.set('tabela', e.record.collection().name)
      record.set('registro_id', e.record.id)

      let expNovo = {}
      let expAntigo = {}
      try {
        expNovo = e.record.publicExport()
        if (e.record.original()) {
          expAntigo = e.record.original().publicExport()
        }
      } catch (_) {}

      const changes = []
      for (const key in expNovo) {
        if (JSON.stringify(expNovo[key]) !== JSON.stringify(expAntigo[key]) && key !== 'updated') {
          changes.push({
            campo: key,
            valor_anterior: expAntigo[key],
            valor_novo: expNovo[key],
          })
        }
      }

      record.set('detalhes', changes)
      $app.saveNoValidate(record)
    } catch (err) {
      console.log('Error creating audit log in onRecordAfterUpdateSuccess:', err)
    }
    e.next()
  },
  'clientes',
  'leads',
  'contatos',
  'users',
  'producao',
)

onRecordAfterDeleteSuccess(
  (e) => {
    try {
      const auditLogs = $app.findCollectionByNameOrId('audit_logs')
      const record = new Record(auditLogs)
      record.set('usuario_id', e.auth ? e.auth.id : 'system')
      record.set('usuario_nome', e.auth ? e.auth.getString('name') : 'System')
      record.set('acao', 'DELETE')
      record.set('tabela', e.record.collection().name)
      record.set('registro_id', e.record.id)

      let expAntigo = {}
      try {
        expAntigo = e.record.publicExport()
      } catch (_) {}

      record.set('detalhes', [
        {
          campo: 'all',
          valor_anterior: expAntigo,
          valor_novo: null,
        },
      ])
      $app.saveNoValidate(record)
    } catch (err) {
      console.log('Error creating audit log in onRecordAfterDeleteSuccess:', err)
    }
    e.next()
  },
  'clientes',
  'leads',
  'contatos',
  'users',
  'producao',
)
