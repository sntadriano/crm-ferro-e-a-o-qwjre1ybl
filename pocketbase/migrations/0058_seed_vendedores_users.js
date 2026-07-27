migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      app.findAuthRecordByEmail('users', 'danilovendas88@hotmail.com')
    } catch (_) {
      const record = new Record(users)
      record.setEmail('danilovendas88@hotmail.com')
      record.setPassword('ELDORADO2026')
      record.set('role', 'vendedor')
      record.set('active', true)
      record.set('name', 'Danilo')
      record.set('codigos_vendedor', [2, 4])
      record.setVerified(true)
      app.save(record)
    }

    try {
      app.findAuthRecordByEmail('users', 'Viniciusmamedes00@gmail.com')
    } catch (_) {
      const record = new Record(users)
      record.setEmail('Viniciusmamedes00@gmail.com')
      record.setPassword('mamedes00')
      record.set('role', 'vendedor')
      record.set('active', true)
      record.set('name', 'Vinicius')
      record.set('codigos_vendedor', [13])
      record.setVerified(true)
      app.save(record)
    }

    const adrianoRecords = app.findRecordsByFilter(
      'users',
      "name ?~ 'Adriano' && role = 'admin'",
      '',
      1,
      0,
    )
    if (adrianoRecords.length > 0) {
      const record = adrianoRecords[0]
      record.set('codigos_vendedor', [1, 3])
      record.set('active', true)
      app.save(record)
    }

    const juliaRecords = app.findRecordsByFilter('users', "name ?~ 'Julia'", '', 1, 0)
    if (juliaRecords.length > 0) {
      const record = juliaRecords[0]
      const existing = record.get('codigos_vendedor')
      const arr = Array.isArray(existing) ? existing.slice() : []
      if (arr.indexOf(1) === -1) {
        arr.push(1)
      }
      record.set('codigos_vendedor', arr)
      record.set('active', true)
      app.save(record)
    }

    const alexRecords = app.findRecordsByFilter('users', "name ?~ 'Alex'", '', 1, 0)
    if (alexRecords.length > 0) {
      const record = alexRecords[0]
      const existing = record.get('codigos_vendedor')
      const arr = Array.isArray(existing) ? existing.slice() : []
      if (arr.indexOf(1) === -1) {
        arr.push(1)
      }
      record.set('codigos_vendedor', arr)
      record.set('active', true)
      app.save(record)
    }
  },
  (app) => {
    try {
      const danilo = app.findAuthRecordByEmail('users', 'danilovendas88@hotmail.com')
      app.delete(danilo)
    } catch (_) {}
    try {
      const vinicius = app.findAuthRecordByEmail('users', 'Viniciusmamedes00@gmail.com')
      app.delete(vinicius)
    } catch (_) {}
  },
)
