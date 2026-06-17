migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users')
    const passwordField = collection.fields.getByName('password')
    if (passwordField) {
      passwordField.min = 6
      app.save(collection)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('users')
    const passwordField = collection.fields.getByName('password')
    if (passwordField) {
      passwordField.min = 8
      app.save(collection)
    }
  },
)
