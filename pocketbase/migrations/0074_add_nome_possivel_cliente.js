migrate(
  (app) => {
    const leads = app.findCollectionByNameOrId('leads')
    if (!leads.fields.getByName('nome_possivel_cliente')) {
      leads.fields.add(new TextField({ name: 'nome_possivel_cliente' }))
    }
    app.save(leads)

    const contatos = app.findCollectionByNameOrId('contatos')
    if (!contatos.fields.getByName('nome_possivel_cliente')) {
      contatos.fields.add(new TextField({ name: 'nome_possivel_cliente' }))
    }
    app.save(contatos)
  },
  (app) => {
    const leads = app.findCollectionByNameOrId('leads')
    const lf = leads.fields.getByName('nome_possivel_cliente')
    if (lf) leads.fields.remove(lf.getId())
    app.save(leads)

    const contatos = app.findCollectionByNameOrId('contatos')
    const cf = contatos.fields.getByName('nome_possivel_cliente')
    if (cf) contatos.fields.remove(cf.getId())
    app.save(contatos)
  },
)
