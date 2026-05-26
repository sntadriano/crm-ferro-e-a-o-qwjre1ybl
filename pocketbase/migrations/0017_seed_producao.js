migrate(
  (app) => {
    const itens = app.findRecordsByFilter('itens_producao', 'status = true', '', 10, 0)
    if (itens.length < 3) return

    const users = app.findRecordsByFilter(
      '_pb_users_auth_',
      "role = 'paulo' || role = 'admin'",
      '',
      1,
      0,
    )
    const userId = users.length > 0 ? users[0].id : ''

    if (!userId) return

    const prodCol = app.findCollectionByNameOrId('producao')

    const createProd = (item, qty, status) => {
      try {
        const record = new Record(prodCol)
        record.set('item', item.getString('nome'))
        record.set('item_id', item.id)
        record.set('quantidade', qty)
        record.set('status', status)
        record.set('data_producao', new Date().toISOString().replace('T', ' '))
        record.set('usuario_id', userId)
        record.set('ativo', true)
        app.save(record)
      } catch (e) {
        console.log(e)
      }
    }

    createProd(itens[0], 50, 'registrado')
    createProd(itens[1], 20, 'conferido')
    createProd(itens[2], 100, 'registrado')
  },
  (app) => {
    app
      .db()
      .newQuery("DELETE FROM producao WHERE status = 'registrado' OR status = 'conferido'")
      .execute()
  },
)
