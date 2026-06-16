migrate(
  (app) => {
    const usersToSetup = [
      { username: 'adriano', namePattern: 'adriano', pass: '091098', role: 'admin' },
      { username: 'alex', namePattern: 'alex', pass: '230894', role: 'admin' },
      { username: 'claudio', namePattern: 'claudio', pass: '010365', role: 'gerente' },
      { username: 'julia', namePattern: 'julia', pass: '110203', role: 'julia' },
    ]

    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    for (const u of usersToSetup) {
      let record = null

      try {
        record = app.findFirstRecordByData('_pb_users_auth_', 'username', u.username)
      } catch (_) {}

      if (!record) {
        try {
          const records = app.findRecordsByFilter(
            '_pb_users_auth_',
            `name ~ '${u.namePattern}'`,
            '',
            1,
            0,
          )
          if (records && records.length > 0) {
            record = records[0]
          }
        } catch (_) {}
      }

      if (record) {
        record.set('active', true)
        if (!record.get('role')) {
          record.set('role', u.role)
        }
        record.set('username', u.username)
        app.save(record)
      } else {
        record = new Record(col)
        record.set('name', u.username.charAt(0).toUpperCase() + u.username.slice(1))
        record.set('username', u.username)
        record.setPassword(u.pass)
        record.set('active', true)
        record.set('role', u.role)
        app.save(record)
      }
    }
  },
  (app) => {
    // down migration logic left empty to avoid breaking existing users accidentally
  },
)
