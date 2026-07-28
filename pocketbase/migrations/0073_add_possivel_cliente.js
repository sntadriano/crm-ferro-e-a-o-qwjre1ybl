migrate(
  (app) => {
    const leads = app.findCollectionByNameOrId('leads')
    if (!leads.fields.getByName('possivel_cliente')) {
      leads.fields.add(new BoolField({ name: 'possivel_cliente' }))
    }
    app.save(leads)

    const contatos = app.findCollectionByNameOrId('contatos')
    if (!contatos.fields.getByName('possivel_cliente')) {
      contatos.fields.add(new BoolField({ name: 'possivel_cliente' }))
    }
    app.save(contatos)

    app
      .db()
      .newQuery('UPDATE leads SET possivel_cliente = 0 WHERE possivel_cliente IS NULL')
      .execute()
    app
      .db()
      .newQuery('UPDATE contatos SET possivel_cliente = 0 WHERE possivel_cliente IS NULL')
      .execute()
  },
  (app) => {
    const leads = app.findCollectionByNameOrId('leads')
    const lf = leads.fields.getByName('possivel_cliente')
    if (lf) leads.fields.remove(lf.getId())
    app.save(leads)

    const contatos = app.findCollectionByNameOrId('contatos')
    const cf = contatos.fields.getByName('possivel_cliente')
    if (cf) contatos.fields.remove(cf.getId())
    app.save(contatos)
  },
)
