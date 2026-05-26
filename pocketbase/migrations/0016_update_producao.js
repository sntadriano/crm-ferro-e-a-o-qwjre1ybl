migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('producao')

    if (!col.fields.getByName('item_id')) {
      col.fields.add(
        new RelationField({
          name: 'item_id',
          collectionId: app.findCollectionByNameOrId('itens_producao').id,
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('observacoes')) {
      col.fields.add(
        new TextField({
          name: 'observacoes',
        }),
      )
    }

    if (!col.fields.getByName('ativo')) {
      col.fields.add(
        new BoolField({
          name: 'ativo',
        }),
      )
    }

    col.listRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo' || @request.auth.role = 'julia')"
    col.viewRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo' || @request.auth.role = 'julia')"
    col.createRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo')"
    col.updateRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo' || @request.auth.role = 'julia')"

    app.save(col)

    app.db().newQuery('UPDATE producao SET ativo = 1').execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('producao')
    col.fields.removeByName('item_id')
    col.fields.removeByName('observacoes')
    col.fields.removeByName('ativo')
    col.listRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente')"
    col.viewRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente')"
    col.createRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente')"
    col.updateRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente')"
    app.save(col)
  },
)
