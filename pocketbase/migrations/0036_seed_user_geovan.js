migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users')

    try {
      const record = app.findAuthRecordByEmail('users', 'geovangarcia@gmail.com')
      record.setPassword('29042003')
      record.set('role', 'paulo')
      record.set('active', true)
      record.set('name', 'geovan')
      app.save(record)
    } catch (_) {
      const record = new Record(collection)
      record.setEmail('geovangarcia@gmail.com')
      record.setPassword('29042003')
      record.set('role', 'paulo')
      record.set('active', true)
      record.set('name', 'geovan')
      record.setVerified(true)
      app.save(record)
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'geovangarcia@gmail.com')
      app.delete(record)
    } catch (_) {}
  },
)
