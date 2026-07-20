migrate(
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'soaresclaudio@gmail.com')
      if (!record) return
      record.setEmail('soaresclaudio65@gmail.com')
      record.set('username', 'soaresclaudio65@gmail.com')
      record.setVerified(true)
      record.set('emailVisibility', true)
      app.save(record)
    } catch (_) {
      try {
        const recordByName = app.findFirstRecordByData('users', 'name', 'Claudio')
        if (recordByName) {
          recordByName.setEmail('soaresclaudio65@gmail.com')
          recordByName.set('username', 'soaresclaudio65@gmail.com')
          recordByName.setVerified(true)
          recordByName.set('emailVisibility', true)
          app.save(recordByName)
        }
      } catch (_) {}
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'soaresclaudio65@gmail.com')
      if (!record) return
      record.setEmail('soaresclaudio@gmail.com')
      record.set('username', 'soaresclaudio@gmail.com')
      record.setVerified(true)
      record.set('emailVisibility', true)
      app.save(record)
    } catch (_) {}
  },
)
