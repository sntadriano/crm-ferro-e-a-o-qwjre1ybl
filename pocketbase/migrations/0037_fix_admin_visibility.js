migrate(
  (app) => {
    // Fix clientes rules — admin bypasses the active check entirely
    const clientes = app.findCollectionByNameOrId('clientes')
    clientes.listRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && vendedor = @request.auth.codigo)))"
    clientes.viewRule = clientes.listRule
    app.save(clientes)

    // Fix itens_producao rules — admin bypasses the active check
    const itens = app.findCollectionByNameOrId('itens_producao')
    itens.listRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'paulo' || @request.auth.role = 'julia'))"
    itens.viewRule = itens.listRule
    app.save(itens)

    // Fix producao rules — admin bypasses the active check
    const producao = app.findCollectionByNameOrId('producao')
    producao.listRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'paulo' || @request.auth.role = 'julia'))"
    producao.viewRule = producao.listRule
    app.save(producao)

    // Fix fotos_producao rules — admin bypasses the active check
    const fotos = app.findCollectionByNameOrId('fotos_producao')
    fotos.listRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'julia' || @request.auth.role = 'paulo'))"
    fotos.viewRule = fotos.listRule
    app.save(fotos)
  },
  (app) => {
    const clientes = app.findCollectionByNameOrId('clientes')
    clientes.listRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && vendedor = @request.auth.codigo))"
    clientes.viewRule = clientes.listRule
    app.save(clientes)

    const itens = app.findCollectionByNameOrId('itens_producao')
    itens.listRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo' || @request.auth.role = 'julia')"
    itens.viewRule = itens.listRule
    app.save(itens)

    const producao = app.findCollectionByNameOrId('producao')
    producao.listRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo' || @request.auth.role = 'julia')"
    producao.viewRule = producao.listRule
    app.save(producao)

    const fotos = app.findCollectionByNameOrId('fotos_producao')
    fotos.listRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'julia' || @request.auth.role = 'paulo')"
    fotos.viewRule = fotos.listRule
    app.save(fotos)
  },
)
