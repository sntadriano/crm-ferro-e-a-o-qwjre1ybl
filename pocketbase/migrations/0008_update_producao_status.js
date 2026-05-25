migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('producao')

    if (!col.fields.getByName('status')) {
      col.fields.add({
        name: 'status',
        type: 'select',
        values: ['registrado', 'conferido'],
        maxSelect: 1,
      })
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('producao')
    col.fields.removeByName('status')
    app.save(col)
  },
)
