migrate(
  (app) => {
    // ---------------------------------------------------------------------------
    // Access rules alignment for "leads" and "contatos" collections.
    //
    // Pattern (consistent with clientes / producao / itens_producao / fotos_producao):
    //   "@request.auth.role = 'admin' || (@request.auth.active = true && [collection-specific logic])"
    //
    // This allows admin users to list/view records regardless of their own
    // `active` status, while preserving the existing per-role restrictions
    // for all other authenticated users.
    //
    // Current logic for the `clientes` collection:
    //   A seller (vendedor) can only see clients where the client's 'vendedor'
    //   field matches the user's 'codigo'. This behavior is preserved as per
    //   current requirements, pending future decision to expand visibility to
    //   the entire portfolio.
    // ---------------------------------------------------------------------------

    const leads = app.findCollectionByNameOrId('leads')
    const leadsRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id)))"
    leads.listRule = leadsRule
    leads.viewRule = leadsRule
    app.save(leads)

    const contatos = app.findCollectionByNameOrId('contatos')
    const contatosRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.name ?~ 'Alex' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id)))"
    contatos.listRule = contatosRule
    contatos.viewRule = contatosRule
    app.save(contatos)
  },
  (app) => {
    // Revert to the previous rules (admin gated behind `active = true`).
    const leads = app.findCollectionByNameOrId('leads')
    const leadsRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id))"
    leads.listRule = leadsRule
    leads.viewRule = leadsRule
    app.save(leads)

    const contatos = app.findCollectionByNameOrId('contatos')
    const contatosRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.name ?~ 'Alex' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id))"
    contatos.listRule = contatosRule
    contatos.viewRule = contatosRule
    app.save(contatos)
  },
)
