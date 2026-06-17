migrate(
  (app) => {
    const usernames = ['adriano', 'alex', 'claudio', 'julia']

    for (const username of usernames) {
      try {
        const record = app.findFirstRecordByData('users', 'username', username)
        record.setPassword('091098')
        record.set('active', true)
        record.set('username', username.toLowerCase())
        app.save(record)
      } catch (_) {
        // User not found, skip safely
      }
    }
  },
  (app) => {
    // No reliable way to revert passwords to their previous hashed state
  },
)
