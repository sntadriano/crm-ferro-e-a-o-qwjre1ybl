migrate(
  (app) => {
    const vendedores = new Collection({
      name: 'vendedores',
      type: 'base',
      // Public read so every authenticated client can resolve codigo -> nome.
      // Write/delete restricted to admins (single source of truth).
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'codigo', type: 'number', required: true },
        { name: 'nome', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_vendedores_codigo ON vendedores (codigo)'],
    })
    app.save(vendedores)

    const seeds = [
      { codigo: 1, nome: 'Escritório' },
      { codigo: 2, nome: 'Danilo' },
      { codigo: 3, nome: 'Adriano' },
      { codigo: 4, nome: 'Danilo' },
      { codigo: 13, nome: 'Vinicius' },
    ]

    for (const s of seeds) {
      try {
        app.findFirstRecordByData('vendedores', 'codigo', s.codigo)
        // already exists — idempotent skip
      } catch (_) {
        const rec = new Record(vendedores)
        rec.set('codigo', s.codigo)
        rec.set('nome', s.nome)
        app.save(rec)
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('vendedores')
      app.delete(col)
    } catch (_) {}
  },
)
