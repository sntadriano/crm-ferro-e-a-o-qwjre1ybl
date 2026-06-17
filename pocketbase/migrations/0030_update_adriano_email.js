migrate(
  (app) => {
    try {
      const record = app.findFirstRecordByData('users', 'username', 'adriano')
      record.setEmail('adriano_santos_09@hotmail.com')
      record.setVerified(true)
      record.set('emailVisibility', true)
      app.save(record)
    } catch (_) {
      try {
        const recordByName = app.findFirstRecordByData('users', 'name', 'adriano')
        if (recordByName) {
          recordByName.setEmail('adriano_santos_09@hotmail.com')
          recordByName.setVerified(true)
          recordByName.set('emailVisibility', true)
          app.save(recordByName)
        }
      } catch (_) {}
    }
  },
  (app) => {
    // Revert not strictly needed for targeted user email update
  },
)
