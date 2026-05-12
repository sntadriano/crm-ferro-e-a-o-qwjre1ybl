migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'ferroeacoeldorado@hotmail.com')
      return
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('ferroeacoeldorado@hotmail.com')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Admin Eldorado')
    record.set('role', 'admin')
    record.set('active', true)
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'ferroeacoeldorado@hotmail.com')
      app.delete(record)
    } catch (_) {}
  },
)
