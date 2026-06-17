migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users')

    // Set minimum password length to 6 to allow 6-character passwords
    const passwordField = collection.fields.getByName('password')
    if (passwordField) {
      passwordField.min = 6
    }

    app.save(collection)

    // Synchronize user credentials: Ensure existing users with 6-char passwords
    // are properly hashed since previous migrations might have failed to set them
    // due to the 8-character constraint.
    try {
      const adriano = app.findFirstRecordByData('users', 'username', 'adriano')
      adriano.setPassword('Skip@2026')
      app.save(adriano)
    } catch (_) {
      try {
        // Fallback: match by name if username field isn't used
        const adrianoByName = app.findFirstRecordByData('users', 'name', 'adriano')
        adrianoByName.setPassword('Skip@2026')
        app.save(adrianoByName)
      } catch (_) {}
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('users')
    const passwordField = collection.fields.getByName('password')
    if (passwordField) {
      passwordField.min = 8
    }
    app.save(collection)
  },
)
