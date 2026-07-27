migrate(
  (app) => {
    const adminRule = "@request.auth.role = 'admin'"
    const clientesCol = app.findCollectionByNameOrId('clientes')

    const produtos = new Collection({
      name: 'produtos',
      type: 'base',
      listRule: adminRule,
      viewRule: adminRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
      fields: [
        { name: 'codigo', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'unidade', type: 'text' },
        { name: 'custo', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_produtos_codigo ON produtos (codigo)'],
    })
    app.save(produtos)

    const pedidos = new Collection({
      name: 'pedidos',
      type: 'base',
      listRule: adminRule,
      viewRule: adminRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
      fields: [
        { name: 'numero', type: 'number', required: true },
        { name: 'data', type: 'date' },
        { name: 'codigo_cliente', type: 'number' },
        { name: 'cliente_id', type: 'relation', collectionId: clientesCol.id, maxSelect: 1 },
        { name: 'vendedor', type: 'number' },
        { name: 'cp', type: 'text' },
        { name: 'valor_pedido', type: 'number' },
        { name: 'entrada_dinheiro', type: 'number' },
        { name: 'entrada_pix', type: 'number' },
        { name: 'entrada_cartao', type: 'number' },
        { name: 'valor_aprazo', type: 'number' },
        { name: 'qtd_itens', type: 'number' },
        { name: 'frete', type: 'number' },
        { name: 'status', type: 'select', values: ['normal', 'cancelado'], maxSelect: 1 },
        { name: 'total_mercadorias', type: 'number' },
        { name: 'desconto_acrescimo', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_pedidos_numero ON pedidos (numero)',
        'CREATE INDEX idx_pedidos_data ON pedidos (data)',
        'CREATE INDEX idx_pedidos_vendedor ON pedidos (vendedor)',
      ],
    })
    app.save(pedidos)

    const pedidoItens = new Collection({
      name: 'pedido_itens',
      type: 'base',
      listRule: adminRule,
      viewRule: adminRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
      fields: [
        {
          name: 'pedido_id',
          type: 'relation',
          collectionId: pedidos.id,
          maxSelect: 1,
          cascadeDelete: true,
          required: true,
        },
        { name: 'codigo_produto', type: 'text' },
        { name: 'produto_id', type: 'relation', collectionId: produtos.id, maxSelect: 1 },
        { name: 'descricao', type: 'text' },
        { name: 'unidade', type: 'text' },
        { name: 'quantidade', type: 'number' },
        { name: 'valor_unitario', type: 'number' },
        { name: 'valor_total', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_pedido_itens_pedido_id ON pedido_itens (pedido_id)'],
    })
    app.save(pedidoItens)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('pedido_itens'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('pedidos'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('produtos'))
    } catch (_) {}
  },
)
