migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contatos')

    col.listRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && cliente_id.vendedor = @request.auth.codigo))"
    col.viewRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && cliente_id.vendedor = @request.auth.codigo))"
    col.createRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && cliente_id.vendedor = @request.auth.codigo))"
    col.updateRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && cliente_id.vendedor = @request.auth.codigo))"
    col.deleteRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'julia')"

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contatos')

    col.listRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id))"
    col.viewRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id))"
    col.createRule = '@request.auth.active = true'
    col.updateRule = '@request.auth.active = true'
    col.deleteRule = "@request.auth.role = 'admin'"

    app.save(col)
  },
)
