migrate(
  (app) => {
    const allUsers = app.findRecordsByFilter('_pb_users_auth_', '', 'created', 1000, 0)

    const users = []
    for (let i = 0; i < allUsers.length; i++) {
      const u = allUsers[i]
      const email = u.getString('email') || ''
      const username = u.getString('username') || ''
      const name = (u.getString('name') || '').toLowerCase()

      if (
        email === 'adriano_santos_09@hotmail.com' ||
        username === 'adriano' ||
        name.includes('adriano')
      ) {
        users.push(u)
      }
    }

    let target = null

    if (users.length > 0) {
      target = users[0]

      // Remove duplicates to ensure no unique constraint errors on email or username
      for (let i = 1; i < users.length; i++) {
        const u = users[i]
        const email = u.getString('email') || ''
        const username = u.getString('username') || ''
        if (email === 'adriano_santos_09@hotmail.com' || username === 'adriano') {
          try {
            app.delete(u)
          } catch (_) {}
        }
      }
    } else {
      const collection = app.findCollectionByNameOrId('_pb_users_auth_')
      target = new Record(collection)
      target.set('name', 'Adriano')
      target.set('role', 'vendedor')
    }

    target.setEmail('adriano_santos_09@hotmail.com')
    target.setPassword('@Dri1234')
    target.setVerified(true)
    target.set('active', true)

    try {
      target.set('username', 'adriano')
      app.save(target)
    } catch (err) {
      // If setting username to 'adriano' fails, fallback to a generated one
      target.set('username', `adriano_${$security.randomString(5)}`)
      app.save(target)
    }
  },
  (app) => {
    // No revert needed
  },
)
