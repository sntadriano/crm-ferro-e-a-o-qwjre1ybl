migrate(
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'julia.carmona159@gmail.com')
      if (record && !record.getBool('active')) {
        record.set('active', true)
        app.save(record)
      }
    } catch (_) {
      // User not found, skip
    }
  },
  (app) => {
    // Revert logic left empty to avoid accidentally deactivating a legitimately active user
  },
)
