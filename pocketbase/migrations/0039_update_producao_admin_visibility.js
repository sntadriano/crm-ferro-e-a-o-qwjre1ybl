migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('producao')

    // Admin sees every production record; other authorised roles still
    // see all active production entries (gerente, paulo, julia).
    col.listRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'paulo' || @request.auth.role = 'julia'))"
    col.viewRule = col.listRule

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('producao')
    col.listRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'paulo' || @request.auth.role = 'julia'))"
    col.viewRule = col.listRule
    app.save(col)
  },
)
