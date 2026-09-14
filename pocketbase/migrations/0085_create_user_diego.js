migrate(
  (app) => {
    // 0085 — Ensure user diego is configured and credential synced
    const usersCol = app.findCollectionByNameOrId('users')
    const userCredentialsCol = app.findCollectionByNameOrId('user_credentials')
    const permissoesCol = app.findCollectionByNameOrId('permissoes')

    const targetUsername = 'diego'
    const targetEmail = 'diego@ferroeacoeldorado.com.br'
    const targetPassword = 'diego@skip2026'
    const targetRole = 'gerente_producao'
    const targetName = 'Diego'

    let diegoUser = null
    try {
      diegoUser = app.findFirstRecordByData('users', 'username', targetUsername)
    } catch (_) {
      try {
        diegoUser = app.findAuthRecordByEmail('users', targetEmail)
      } catch (_) {
        diegoUser = null
      }
    }

    if (!diegoUser) {
      diegoUser = new Record(usersCol)
      diegoUser.setEmail(targetEmail)
      diegoUser.set('username', targetUsername)
      diegoUser.set('name', targetName)
    }

    diegoUser.set('role', targetRole)
    diegoUser.setPassword(targetPassword)
    diegoUser.set('active', true)
    diegoUser.setVerified(true)
    app.save(diegoUser)

    // Credential sync
    let cred = null
    try {
      cred = app.findFirstRecordByData('user_credentials', 'user', diegoUser.id)
    } catch (_) {
      cred = null
    }

    if (!cred) {
      cred = new Record(userCredentialsCol)
      cred.set('user', diegoUser.id)
    }
    cred.set('password_plain', targetPassword)
    app.save(cred)

    // Production permissions
    const productionResources = ['producao', 'itens_producao', 'fotos_producao', 'maquinas']
    const actions = ['list', 'view', 'create', 'update']

    for (let r = 0; r < productionResources.length; r++) {
      for (let a = 0; a < actions.length; a++) {
        let existingPerm = []
        try {
          existingPerm = app.findRecordsByFilter(
            'permissoes',
            `usuario_id = '${diegoUser.id}' && recurso = '${productionResources[r]}' && acao = '${actions[a]}'`,
            '',
            1,
            0,
          )
        } catch (_) {
          existingPerm = []
        }

        if (existingPerm.length === 0) {
          const permRecord = new Record(permissoesCol)
          permRecord.set('usuario_id', diegoUser.id)
          permRecord.set('recurso', productionResources[r])
          permRecord.set('acao', actions[a])
          app.save(permRecord)
        }
      }
    }
  },
  (app) => {}
)
