migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      const record = app.findAuthRecordByEmail('users', 'soaresclaudio@gmail.com')
      record.setPassword('010365CF')
      record.set('active', true)
      app.save(record)
    } catch (_) {
      const record = new Record(users)
      record.setEmail('soaresclaudio@gmail.com')
      record.setPassword('010365CF')
      record.set('role', 'gerente')
      record.set('active', true)
      record.set('name', 'Claudio')
      record.setVerified(true)
      app.save(record)
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'soaresclaudio@gmail.com')
      record.setPassword('010365cf')
      app.save(record)
    } catch (_) {}
  },
)
