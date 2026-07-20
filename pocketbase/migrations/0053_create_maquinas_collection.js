migrate(
  (app) => {
    // 1. Create maquinas collection
    var maquinasCol = new Collection({
      name: 'maquinas',
      type: 'base',
      listRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'gerente_producao' || @request.auth.role = 'paulo' || @request.auth.role = 'julia')",
      viewRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'gerente_producao' || @request.auth.role = 'paulo' || @request.auth.role = 'julia')",
      createRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'gerente_producao')",
      updateRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'gerente_producao')",
      deleteRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'gerente_producao')",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'tipo_categoria', type: 'text' },
        { name: 'status', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_maquinas_nome ON maquinas (nome)'],
    })
    app.save(maquinasCol)

    // 2. Seed a default machine for backfilling existing production records
    var defaultMaq = new Record(maquinasCol)
    defaultMaq.set('nome', 'Máquina Padrão')
    defaultMaq.set('tipo_categoria', 'Geral')
    defaultMaq.set('status', true)
    app.save(defaultMaq)

    // 3. Add maquina_id relation to producao
    var producaoCol = app.findCollectionByNameOrId('producao')
    if (!producaoCol.fields.getByName('maquina_id')) {
      producaoCol.fields.add(
        new RelationField({
          name: 'maquina_id',
          collectionId: maquinasCol.id,
          maxSelect: 1,
          required: true,
        }),
      )
    }
    app.save(producaoCol)

    // 4. Backfill existing producao records with default machine
    app
      .db()
      .newQuery(
        "UPDATE producao SET maquina_id = {:id} WHERE maquina_id = '' OR maquina_id IS NULL",
      )
      .bind({ id: defaultMaq.id })
      .execute()
  },
  (app) => {
    // Remove maquina_id from producao
    var producaoCol = app.findCollectionByNameOrId('producao')
    if (producaoCol.fields.getByName('maquina_id')) {
      producaoCol.fields.removeByName('maquina_id')
    }
    app.save(producaoCol)

    // Delete maquinas collection
    try {
      var maquinasCol = app.findCollectionByNameOrId('maquinas')
      app.delete(maquinasCol)
    } catch (e) {}
  },
)
