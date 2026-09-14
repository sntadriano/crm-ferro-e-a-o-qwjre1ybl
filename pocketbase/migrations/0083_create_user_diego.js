migrate(
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('users')
      const user = new Record(usersCol)
      user.setEmail('diego@ferroeacoeldorado.com.br')
      user.setPassword('diego@skip2026')
      user.set('name', 'Diego')
      user.set('role', 'gerente_producao')
      user.set('username', 'diego')
      user.set('active', true)
      user.setVerified(true)
      app.save(user)
      console.log('Diego saved:', user.id)
    } catch (e) {
      console.log('Error creating Diego:', e)
      throw e
    }
  },
  (app) => {},
)
