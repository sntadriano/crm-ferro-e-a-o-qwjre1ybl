migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    // Ensure the password field allows 6 characters
    const passField = users.fields.getByName('password')
    if (passField) {
      passField.min = 6
      app.save(users)
    }

    const usersToSeed = [
      {
        username: 'adriano',
        name: 'Adriano',
        email: 'adriano@ferroeacoeldorado.com.br',
        pass: '091098',
        role: 'admin',
      },
      {
        username: 'alex',
        name: 'Alex',
        email: 'alex@ferroeacoeldorado.com.br',
        pass: '230894',
        role: 'admin',
      },
      {
        username: 'claudio',
        name: 'Claudio',
        email: 'claudio@ferroeacoeldorado.com.br',
        pass: '010365',
        role: 'gerente',
      },
      {
        username: 'julia',
        name: 'Julia',
        email: 'julia@ferroeacoeldorado.com.br',
        pass: '110203',
        role: 'julia',
      },
    ]

    for (const u of usersToSeed) {
      try {
        app.findAuthRecordByEmail('users', u.email)
      } catch (_) {
        try {
          const record = new Record(users)
          record.set('username', u.username)
          record.setEmail(u.email)
          record.setPassword(u.pass)
          record.setVerified(true)
          record.set('name', u.name)
          record.set('role', u.role)
          record.set('active', true)
          app.save(record)
        } catch (err) {
          console.log('Error creating user: ' + u.email, err)
        }
      }
    }
  },
  (app) => {
    const emails = [
      'adriano@ferroeacoeldorado.com.br',
      'alex@ferroeacoeldorado.com.br',
      'claudio@ferroeacoeldorado.com.br',
      'julia@ferroeacoeldorado.com.br',
    ]
    for (const email of emails) {
      try {
        const record = app.findAuthRecordByEmail('users', email)
        app.delete(record)
      } catch (_) {}
    }
  },
)
