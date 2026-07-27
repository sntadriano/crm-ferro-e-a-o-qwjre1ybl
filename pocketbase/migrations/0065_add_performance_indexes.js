migrate(
  (app) => {
    // Indexes on frequently filtered columns to prevent query degradation
    // as data grows. addIndex is idempotent — safe to call even if the
    // index already exists.

    const clientes = app.findCollectionByNameOrId('clientes')
    clientes.addIndex('idx_clientes_vendedor', false, 'vendedor', '')
    app.save(clientes)

    const contatos = app.findCollectionByNameOrId('contatos')
    contatos.addIndex('idx_contatos_cliente_id', false, 'cliente_id', '')
    app.save(contatos)

    const pedidoItens = app.findCollectionByNameOrId('pedido_itens')
    pedidoItens.addIndex('idx_pedido_itens_produto_id', false, 'produto_id', '')
    app.save(pedidoItens)
  },
  (app) => {
    const clientes = app.findCollectionByNameOrId('clientes')
    clientes.removeIndex('idx_clientes_vendedor')
    app.save(clientes)

    const contatos = app.findCollectionByNameOrId('contatos')
    contatos.removeIndex('idx_contatos_cliente_id')
    app.save(contatos)

    const pedidoItens = app.findCollectionByNameOrId('pedido_itens')
    pedidoItens.removeIndex('idx_pedido_itens_produto_id')
    app.save(pedidoItens)
  },
)
