migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users')

    // Set minimum password length to 6
    const passwordField = collection.fields.getByName('password')
    if (passwordField) {
      passwordField.min = 6
    }
    app.save(collection)

    const usersToProvision = [
      {
        email: 'alexsilvasantos23@hotmail.com',
        password: 'Skip@2026',
        role: 'admin',
        name: 'Alex',
        active: true,
      },
      {
        email: 'soaresclaudio@gmail.com',
        password: 'Skip@2026',
        role: 'gerente',
        name: 'Claudio',
        active: true,
      },
      {
        email: 'julia.carmona159@gmail.com',
        password: 'Skip@2026',
        role: 'julia',
        name: 'Julia',
        active: true,
      },
    ]

    for (const u of usersToProvision) {
      try {
        const record = app.findAuthRecordByEmail('users', u.email)
        record.setPassword(u.password)
        record.set('role', u.role)
        record.set('active', u.active)
        if (u.name) record.set('name', u.name)
        app.save(record)
      } catch (_) {
        const record = new Record(collection)
        record.setEmail(u.email)
        record.setPassword(u.password)
        record.set('role', u.role)
        record.set('active', u.active)
        if (u.name) record.set('name', u.name)
        record.setVerified(true)
        app.save(record)
      }
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
