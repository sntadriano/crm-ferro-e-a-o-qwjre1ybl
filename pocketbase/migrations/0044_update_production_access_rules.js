migrate(
  (app) => {
    const rule = "@request.auth.id != '' && @request.auth.active = true"

    const producao = app.findCollectionByNameOrId('producao')
    producao.listRule = rule
    producao.viewRule = rule
    producao.createRule = rule
    producao.updateRule = rule
    producao.deleteRule = rule
    app.save(producao)

    const fotos = app.findCollectionByNameOrId('fotos_producao')
    fotos.listRule = rule
    fotos.viewRule = rule
    fotos.createRule = rule
    fotos.updateRule = rule
    fotos.deleteRule = rule
    app.save(fotos)
  },
  (app) => {
    const producao = app.findCollectionByNameOrId('producao')
    producao.listRule = "@request.auth.id != '' && @request.auth.active = true"
    producao.viewRule = "@request.auth.id != '' && @request.auth.active = true"
    producao.createRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo')"
    producao.updateRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo' || @request.auth.role = 'julia')"
    producao.deleteRule = "@request.auth.active = true && @request.auth.role = 'admin'"
    app.save(producao)

    const fotos = app.findCollectionByNameOrId('fotos_producao')
    fotos.listRule = "@request.auth.id != '' && @request.auth.active = true"
    fotos.viewRule = "@request.auth.id != '' && @request.auth.active = true"
    fotos.createRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo')"
    fotos.updateRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo')"
    fotos.deleteRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente')"
    app.save(fotos)
  },
)
