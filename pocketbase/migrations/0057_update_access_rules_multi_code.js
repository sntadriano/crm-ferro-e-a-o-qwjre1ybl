migrate(
  (app) => {
    // --- clientes -------------------------------------------------------------
    // vendedores now match via the JSON array `codigos_vendedor` on the auth
    // record (array-contains the client's `vendedor` number) instead of the
    // legacy single `codigo` equality. Admin / gerente / julia keep broad
    // visibility.
    const clientes = app.findCollectionByNameOrId('clientes')
    const clienteRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && @request.auth.codigos_vendedor ~ vendedor)))"
    clientes.listRule = clienteRule
    clientes.viewRule = clienteRule
    app.save(clientes)

    // --- leads ----------------------------------------------------------------
    // leads has no direct `vendedor` field — it references `cliente_id` which
    // holds `vendedor`. Use the array-contains operator against the expanded
    // relation field so a user managing codes [2,4] sees leads for any client
    // whose vendedor is 2 or 4.
    const leads = app.findCollectionByNameOrId('leads')
    const leadRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && @request.auth.codigos_vendedor ~ cliente_id.vendedor)))"
    leads.listRule = leadRule
    leads.viewRule = leadRule
    app.save(leads)

    // --- contatos -------------------------------------------------------------
    // Removes the `@request.auth.name ?~ 'Alex'` hack from migration 0011.
    // Alex (and any other user sharing code 1) now gains access purely through
    // `codigos_vendedor` containing the client's `vendedor` code.
    const contatos = app.findCollectionByNameOrId('contatos')
    const contatoListRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || (@request.auth.role = 'vendedor' && @request.auth.codigos_vendedor ~ cliente_id.vendedor)))"
    contatos.listRule = contatoListRule
    contatos.viewRule = contatoListRule
    contatos.createRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'vendedor')"
    contatos.updateRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || (@request.auth.role = 'vendedor' && @request.auth.codigos_vendedor ~ cliente_id.vendedor))"
    contatos.deleteRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente')"
    app.save(contatos)
  },
  (app) => {
    // Revert to the pre-multi-code rules (admin bypass + active gate, single
    // codigo equality for clientes, usuario_id ownership for leads/contatos,
    // and the Alex-name hack restored on contatos).
    const clientes = app.findCollectionByNameOrId('clientes')
    const clienteRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && vendedor = @request.auth.codigo)))"
    clientes.listRule = clienteRule
    clientes.viewRule = clienteRule
    app.save(clientes)

    const leads = app.findCollectionByNameOrId('leads')
    const leadRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id)))"
    leads.listRule = leadRule
    leads.viewRule = leadRule
    app.save(leads)

    const contatos = app.findCollectionByNameOrId('contatos')
    const contatoListRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.name ?~ 'Alex' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id)))"
    contatos.listRule = contatoListRule
    contatos.viewRule = contatoListRule
    contatos.createRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.name ?~ 'Alex' || @request.auth.role = 'vendedor')"
    contatos.updateRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.name ?~ 'Alex')"
    contatos.deleteRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.name ?~ 'Alex')"
    app.save(contatos)
  },
)
