migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users')

    // Set minimum password length to 8
    const passwordField = collection.fields.getByName('password')
    if (passwordField) {
      passwordField.min = 8
    }

    app.save(collection)

    try {
      const adriano = app.findFirstRecordByData('users', 'username', 'adriano')
      adriano.setPassword('@Dri1234')
      app.save(adriano)
    } catch (_) {
      try {
        const adrianoByName = app.findFirstRecordByData('users', 'name', 'adriano')
        adrianoByName.setPassword('@Dri1234')
        app.save(adrianoByName)
      } catch (_) {}
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('users')
    const passwordField = collection.fields.getByName('password')
    if (passwordField) {
      passwordField.min = 6
    }
    app.save(collection)
  },
)
