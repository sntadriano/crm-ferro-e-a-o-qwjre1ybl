migrate(
  (app) => {
    const contatos = app.findCollectionByNameOrId('contatos')
    contatos.createRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || (@request.auth.role = 'vendedor' && (possivel_cliente = true || @request.auth.codigos_vendedor ~ cliente_id.vendedor)))"
    app.save(contatos)
  },
  (app) => {
    const contatos = app.findCollectionByNameOrId('contatos')
    contatos.createRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || (@request.auth.role = 'vendedor' && @request.auth.codigos_vendedor ~ cliente_id.vendedor))"
    app.save(contatos)
  },
)
