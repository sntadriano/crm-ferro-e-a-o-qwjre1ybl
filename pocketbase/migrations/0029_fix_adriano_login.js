migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users')

    const passwordField = collection.fields.getByName('password')
    if (passwordField) {
      passwordField.min = 8
    }

    try {
      if (collection.passwordOptions !== undefined) {
        collection.passwordOptions.minLength = 8
      } else {
        collection.passwordOptions = { minLength: 8 }
      }
    } catch (_) {}

    app.save(collection)

    try {
      const record = app.findFirstRecordByData('users', 'username', 'adriano')
      record.setPassword('@Dri1234')
      record.set('active', true)
      app.save(record)
    } catch (_) {
      try {
        const recordByName = app.findFirstRecordByData('users', 'name', 'adriano')
        if (recordByName) {
          recordByName.setPassword('@Dri1234')
          recordByName.set('active', true)
          app.save(recordByName)
        }
      } catch (_) {}
    }
  },
  (app) => {
    // Targeted migration, no exact revert needed for password/active updates
  },
)
