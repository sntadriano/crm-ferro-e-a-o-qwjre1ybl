migrate(
  (app) => {
    const collection = new Collection({
      name: 'itens_producao',
      type: 'base',
      listRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo' || @request.auth.role = 'julia')",
      viewRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo' || @request.auth.role = 'julia')",
      createRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo')",
      updateRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo')",
      deleteRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo')",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['Armações', 'Arame 1kg', 'Corte e dobra', 'Barras 6m', 'Barras 12m'],
          maxSelect: 1,
        },
        {
          name: 'unidade',
          type: 'select',
          required: true,
          values: ['Unidades', 'Rolos', 'Kg', 'Barras'],
          maxSelect: 1,
        },
        { name: 'status', type: 'bool' },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_itens_producao_nome ON itens_producao (nome)',
        'CREATE INDEX idx_itens_producao_status ON itens_producao (status)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('itens_producao')
    app.delete(collection)
  },
)
