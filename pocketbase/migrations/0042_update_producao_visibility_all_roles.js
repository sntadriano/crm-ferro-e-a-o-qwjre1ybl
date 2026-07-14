migrate(
  (app) => {
    const rule = "@request.auth.id != '' && @request.auth.active = true"

    const producao = app.findCollectionByNameOrId('producao')
    producao.listRule = rule
    producao.viewRule = rule
    app.save(producao)

    const fotos = app.findCollectionByNameOrId('fotos_producao')
    fotos.listRule = rule
    fotos.viewRule = rule
    app.save(fotos)
  },
  (app) => {
    const prevRule = "@request.auth.role = 'admin' || @request.auth.active = true"

    const producao = app.findCollectionByNameOrId('producao')
    producao.listRule = prevRule
    producao.viewRule = prevRule
    app.save(producao)

    const fotos = app.findCollectionByNameOrId('fotos_producao')
    fotos.listRule = prevRule
    fotos.viewRule = prevRule
    app.save(fotos)
  },
)
