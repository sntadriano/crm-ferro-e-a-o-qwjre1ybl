migrate(
  (app) => {
    const targets = ['adriano', 'alex', 'claudio', 'julia']
    const records = app.findRecordsByFilter('_pb_users_auth_', '1=1', '', 100, 0)

    for (const record of records) {
      const name = (record.getString('name') || '').toLowerCase()
      const currentUsername = (record.getString('username') || '').toLowerCase()
      const email = (record.getString('email') || '').toLowerCase()

      for (const target of targets) {
        if (name.includes(target) || currentUsername.includes(target) || email.includes(target)) {
          record.set('username', target)
          record.set('active', true)
          try {
            app.saveNoValidate(record)
          } catch (e) {
            console.log(`Failed to update user to ${target}: ` + e.message)
          }
          break
        }
      }
    }
  },
  (app) => {
    // down migration
  },
)
