migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('clientes')
    app.truncateCollection(col)
  },
  (app) => {
    // Cannot reverse a data purge — deleted records cannot be restored
  },
)
