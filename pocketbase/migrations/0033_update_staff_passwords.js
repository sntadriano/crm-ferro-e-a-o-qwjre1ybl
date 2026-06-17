migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users')

    // Ensure minimum password length is 6 to support 6-digit passwords
    const passwordField = collection.fields.getByName('password')
    if (passwordField) {
      passwordField.min = 6
    }
    app.save(collection)

    const usersToProvision = [
      {
        email: 'alexsilvasantos23@hotmail.com',
        password: '230894',
        role: 'admin',
        name: 'Alex',
        active: true,
      },
      {
        email: 'soaresclaudio@gmail.com',
        password: '010365',
        role: 'gerente',
        name: 'Claudio',
        active: true,
      },
      {
        email: 'julia.carmona159@gmail.com',
        password: '110203',
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
    // There is no safe way to revert passwords to their previous unknown states,
    // so the down migration only reverts the password policy if desired.
    // However, since 0032 also set it to 6, we leave it as is or revert to 8.
    const collection = app.findCollectionByNameOrId('users')
    const passwordField = collection.fields.getByName('password')
    if (passwordField) {
      passwordField.min = 8
    }
    app.save(collection)
  },
)
