migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('audit_logs')

    col.fields.add(new TextField({ name: 'tabela' }))
    col.fields.add(new TextField({ name: 'registro_id' }))

    col.listRule =
      "@request.auth.role = 'admin' || @request.auth.name ?~ 'Alex' || (@request.auth.role = 'julia' && (tabela = 'leads' || tabela = 'contatos')) || (@request.auth.role = 'gerente' && tabela = 'producao')"
    col.viewRule = col.listRule

    app.save(col)

    try {
      app
        .db()
        .newQuery(`
      UPDATE audit_logs 
      SET 
        tabela = json_extract(detalhes, '$.collection'),
        registro_id = json_extract(detalhes, '$.recordId')
      WHERE tabela IS NULL OR tabela = ''
    `)
        .execute()
    } catch (e) {}

    const actions = ['CREATE', 'UPDATE', 'DELETE']
    const tables = ['clientes', 'leads', 'contatos', 'producao']
    const users = ['System', 'Alex', 'Julia', 'João', 'Carlos']
    const userIds = ['system', 'user_1', 'user_2', 'user_3', 'user_4']

    const now = new Date()
    for (let i = 0; i < 50; i++) {
      const r = new Record(col)
      const date = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      const userIdx = Math.floor(Math.random() * users.length)
      const action = actions[Math.floor(Math.random() * actions.length)]
      const table = tables[Math.floor(Math.random() * tables.length)]

      r.set('usuario_id', userIds[userIdx])
      r.set('usuario_nome', users[userIdx])
      r.set('acao', action)
      r.set('tabela', table)
      r.set('registro_id', 'mock_' + i)
      r.set('created', date.toISOString().replace('T', ' '))
      r.set('updated', date.toISOString().replace('T', ' '))
      r.set('timestamp', date.toISOString().replace('T', ' '))

      if (action === 'UPDATE') {
        r.set('detalhes', [
          {
            campo: 'status',
            valor_anterior: 'novo',
            valor_novo: 'fechado',
          },
        ])
      } else if (action === 'CREATE') {
        r.set('detalhes', [
          {
            campo: 'all',
            valor_anterior: null,
            valor_novo: { status: 'novo' },
          },
        ])
      } else {
        r.set('detalhes', [
          {
            campo: 'all',
            valor_anterior: { status: 'fechado' },
            valor_novo: null,
          },
        ])
      }
      app.saveNoValidate(r)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('audit_logs')
    try {
      col.fields.removeByName('tabela')
    } catch (_) {}
    try {
      col.fields.removeByName('registro_id')
    } catch (_) {}
    col.listRule = "@request.auth.role = 'admin'"
    col.viewRule = "@request.auth.role = 'admin'"
    app.save(col)
  },
)
