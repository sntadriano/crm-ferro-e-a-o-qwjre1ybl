migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users')

    // Ensure minimum password length is 8 to enforce security policy
    const passwordField = collection.fields.getByName('password')
    if (passwordField) {
      passwordField.min = 8
    }
    app.save(collection)

    const usersToProvision = [
      {
        email: 'alexsilvasantos23@hotmail.com',
        password: '23081994',
        role: 'admin',
        name: 'Alex',
        active: true,
      },
      {
        email: 'julia.carmona159@gmail.com',
        password: 'Julia1102.',
        role: 'julia',
        name: 'Julia',
        active: true,
      },
      {
        email: 'soaresclaudio@gmail.com',
        password: '010365cf',
        role: 'gerente',
        name: 'Claudio',
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
      passwordField.min = 6
    }
    app.save(collection)
  },
)
