migrate(
  (app) => {
    try {
      app.findCollectionByNameOrId('producao')
      return // already exists
    } catch (e) {}

    const collection = new Collection({
      name: 'producao',
      type: 'base',
      listRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente')",
      viewRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente')",
      createRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente')",
      updateRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente')",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'item', type: 'text', required: true },
        { name: 'quantidade', type: 'number', required: true },
        { name: 'data_producao', type: 'date', required: true },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)

    // Seed Data
    try {
      const admin = app.findFirstRecordByData('_pb_users_auth_', 'role', 'admin')
      if (admin) {
        const items = [
          'Vergalhão 10mm',
          'Chapa de Aço 5mm',
          'Tubo Galvanizado',
          'Perfil U',
          'Bobina Fina',
        ]
        const now = new Date()
        for (let i = 0; i < 20; i++) {
          const r = new Record(collection)
          r.set('item', items[i % items.length])
          r.set('quantidade', Math.floor(Math.random() * 100) + 10)

          const d = new Date(now)
          d.setDate(d.getDate() - Math.floor(Math.random() * 30))
          r.set('data_producao', d.toISOString().replace('T', ' '))
          r.set('usuario_id', admin.id)

          app.save(r)
        }
      }
    } catch (e) {}
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('producao')
      app.delete(collection)
    } catch (e) {}
  },
)
