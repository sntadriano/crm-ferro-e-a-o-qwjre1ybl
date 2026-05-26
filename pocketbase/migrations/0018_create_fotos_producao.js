migrate(
  (app) => {
    const producaoCol = app.findCollectionByNameOrId('producao')
    const collection = new Collection({
      name: 'fotos_producao',
      type: 'base',
      listRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'julia' || @request.auth.role = 'paulo')",
      viewRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'julia' || @request.auth.role = 'paulo')",
      createRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo')",
      updateRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo')",
      deleteRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente')",
      fields: [
        {
          name: 'producao_id',
          type: 'relation',
          required: true,
          collectionId: producaoCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'arquivo',
          type: 'file',
          maxSelect: 5,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/heic', 'image/heif'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_fotos_producao_producao_id ON fotos_producao (producao_id)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('fotos_producao')
    app.delete(collection)
  },
)
