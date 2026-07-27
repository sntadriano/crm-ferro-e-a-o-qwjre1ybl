migrate(
  (app) => {
    const pedidos = app.findCollectionByNameOrId('pedidos')

    if (!pedidos.fields.getByName('cliente_nome')) {
      pedidos.fields.add(new TextField({ name: 'cliente_nome' }))
    }

    app.save(pedidos)
  },
  (app) => {
    const pedidos = app.findCollectionByNameOrId('pedidos')
    const field = pedidos.fields.getByName('cliente_nome')
    if (field) {
      pedidos.fields.remove(field)
      app.save(pedidos)
    }
  },
)
