migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('producao')
    col.deleteRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente')"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('producao')
    col.deleteRule = "@request.auth.role = 'admin'"
    app.save(col)
  },
)
