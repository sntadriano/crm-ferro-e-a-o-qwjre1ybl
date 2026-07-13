migrate(
  (app) => {
    // ---------------------------------------------------------------------------
    // Shared visibility for production records.
    //
    // Any authenticated user with `active = true` can now list/view ALL
    // production records (and their attached photos), regardless of who
    // created them. Admins retain their existing bypass (no `active` gate).
    //
    // Previous behavior restricted visibility to admin/gerente/paulo/julia.
    // ---------------------------------------------------------------------------

    const producao = app.findCollectionByNameOrId('producao')
    const sharedRule = "@request.auth.role = 'admin' || @request.auth.active = true"
    producao.listRule = sharedRule
    producao.viewRule = sharedRule
    app.save(producao)

    const fotos = app.findCollectionByNameOrId('fotos_producao')
    fotos.listRule = sharedRule
    fotos.viewRule = sharedRule
    app.save(fotos)
  },
  (app) => {
    // Revert to the previous role-scoped rules.
    const producao = app.findCollectionByNameOrId('producao')
    const producaoRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'paulo' || @request.auth.role = 'julia'))"
    producao.listRule = producaoRule
    producao.viewRule = producaoRule
    app.save(producao)

    const fotos = app.findCollectionByNameOrId('fotos_producao')
    const fotosRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'julia' || @request.auth.role = 'paulo'))"
    fotos.listRule = fotosRule
    fotos.viewRule = fotosRule
    app.save(fotos)
  },
)
