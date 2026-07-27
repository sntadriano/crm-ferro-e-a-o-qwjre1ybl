migrate(
  (app) => {
    // 1. Set cascadeDelete on notificacoes.lead_id so that deleting a lead
    //    automatically removes all linked notifications.
    const notificacoes = app.findCollectionByNameOrId('notificacoes')
    const leadIdField = notificacoes.fields.getByName('lead_id')
    if (leadIdField) {
      leadIdField.cascadeDelete = true
    }
    app.save(notificacoes)

    // 2. Update contatos createRule to enforce vendor-carteira check.
    //    A vendedor may only create a contact for a client whose `vendedor`
    //    code is in the user's `codigos_vendedor` array.
    const contatos = app.findCollectionByNameOrId('contatos')
    contatos.createRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || (@request.auth.role = 'vendedor' && @request.auth.codigos_vendedor ~ cliente_id.vendedor))"
    app.save(contatos)
  },
  (app) => {
    // Revert cascadeDelete on notificacoes.lead_id
    const notificacoes = app.findCollectionByNameOrId('notificacoes')
    const leadIdField = notificacoes.fields.getByName('lead_id')
    if (leadIdField) {
      leadIdField.cascadeDelete = false
    }
    app.save(notificacoes)

    // Revert contatos createRule to the previous broad rule
    const contatos = app.findCollectionByNameOrId('contatos')
    contatos.createRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'vendedor')"
    app.save(contatos)
  },
)
