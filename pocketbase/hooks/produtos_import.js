routerAdd(
  'POST',
  '/backend/v1/produtos/import',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'admin') {
      return e.forbiddenError('Acesso restrito a administradores.')
    }

    const body = e.requestInfo().body || {}
    const rows = body.produtos || []

    if (!Array.isArray(rows)) {
      return e.badRequestError("Campo 'produtos' deve ser um array.")
    }

    const col = $app.findCollectionByNameOrId('produtos')
    const auditCol = $app.findCollectionByNameOrId('audit_logs')

    var created = 0
    var updated = 0
    var errors = []

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i]
      var codigo = String(row.codigo || '').trim()
      if (!codigo) {
        errors.push({ reason: 'codigo ausente' })
        continue
      }

      var rec
      var isNew = false
      try {
        rec = $app.findFirstRecordByFilter('produtos', 'codigo = ?', codigo)
      } catch (_) {
        rec = new Record(col)
        isNew = true
      }

      rec.set('codigo', codigo)
      if (row.descricao !== undefined) rec.set('descricao', String(row.descricao || ''))
      if (row.unidade !== undefined) rec.set('unidade', String(row.unidade || ''))
      if (row.custo !== undefined && row.custo !== '') {
        rec.set('custo', Number(row.custo) || 0)
      }

      try {
        $app.save(rec)
        if (isNew) created++
        else updated++
      } catch (saveErr) {
        errors.push({
          codigo: codigo,
          reason: saveErr.message || 'Erro ao salvar',
        })
      }
    }

    try {
      var auditRec = new Record(auditCol)
      auditRec.set('usuario_id', e.auth ? e.auth.id : 'system')
      auditRec.set('usuario_nome', e.auth ? e.auth.getString('name') : 'System')
      auditRec.set('acao', 'IMPORT')
      auditRec.set('tabela', 'produtos')
      auditRec.set('registro_id', '')
      auditRec.set('detalhes', [
        {
          campo: 'import',
          valor_anterior: null,
          valor_novo: { created: created, updated: updated, errorsCount: errors.length },
        },
      ])
      $app.saveNoValidate(auditRec)
    } catch (_) {}

    return e.json(200, { created: created, updated: updated, errors: errors })
  },
  $apis.requireAuth(),
)
