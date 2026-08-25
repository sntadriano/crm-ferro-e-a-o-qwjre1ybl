migrate(
  (app) => {
    // =========================================================================
    // 0082 — Coleção user_credentials e seed de senhas documentadas
    // =========================================================================
    //
    // 1. Criar coleção "user_credentials":
    //    - user: relation para users (1 registro por usuário, único)
    //    - password_plain: texto puro da senha
    //    - created / updated: autodates
    //    - list/view/create/update/delete rules TODAS restritas a:
    //      "@request.auth.username = 'adriano' || @request.auth.email = 'adriano_santos_09@hotmail.com'"
    //    - Índice UNIQUE sobre o campo `user`
    //
    // 2. Semear registros para os usuários com senhas documentadas nas migrations 0079 e 0081:
    //    - adriano: @dri1234
    //    - julia: julia@skip2026
    //    - alex: skip@2026
    //    - danilo: eldorado2026
    //    - vinicius: mamedes00
    //    - geovan: 29042003
    //    - claudio: claudio@skip2026
    //    - admin: eldorado@admin
    //    - alex_eldorado: skip@2026
    //    - julia_antigo: julia@skip2026
    // =========================================================================

    const usersCol = app.findCollectionByNameOrId('users')

    const adrianoRule =
      "@request.auth.username = 'adriano' || @request.auth.email = 'adriano_santos_09@hotmail.com'"

    const userCredentialsCol = new Collection({
      name: 'user_credentials',
      type: 'base',
      listRule: adrianoRule,
      viewRule: adrianoRule,
      createRule: adrianoRule,
      updateRule: adrianoRule,
      deleteRule: adrianoRule,
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'password_plain',
          type: 'text',
          required: true,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_user_credentials_user ON user_credentials (user)'],
    })

    app.save(userCredentialsCol)

    console.log('Coleção user_credentials criada com sucesso!')

    // Seed das credenciais para os usuários existentes
    const seeds = [
      { email: 'adriano_santos_09@hotmail.com', username: 'adriano', password: '@dri1234' },
      { email: 'soaresclaudio65@gmail.com', username: 'claudio', password: 'claudio@skip2026' },
      { email: 'julia@ferroeacoeldorado.com.br', username: 'julia', password: 'julia@skip2026' },
      {
        email: 'julia.carmona159@gmail.com',
        username: 'julia_antigo_n37q9hu5progi2h',
        password: 'julia@skip2026',
      },
      { email: 'alexsilvasantos23@hotmail.com', username: 'alex', password: 'skip@2026' },
      { email: 'alex@ferroeacoeldorado.com.br', username: 'alex_eldorado', password: 'skip@2026' },
      { email: 'danilovendas88@hotmail.com', username: 'danilo', password: 'eldorado2026' },
      { email: 'viniciusmamedes00@gmail.com', username: 'vinicius', password: 'mamedes00' },
      { email: 'geovangarcia@gmail.com', username: 'geovan', password: '29042003' },
      { email: 'ferroeacoeldorado@hotmail.com', username: 'admin', password: 'eldorado@admin' },
    ]

    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i]
      let userRecord = null

      // Busca primeiro por email, se não achar busca por username
      try {
        userRecord = app.findAuthRecordByEmail('users', s.email)
      } catch (_) {
        try {
          userRecord = app.findFirstRecordByData('users', 'username', s.username)
        } catch (_) {
          userRecord = null
        }
      }

      if (!userRecord) {
        console.log(`[SEED] Usuário não encontrado para: ${s.email} / ${s.username}`)
        continue
      }

      try {
        // Verificar se já existe credencial para este usuário
        let existingCred = null
        try {
          existingCred = app.findFirstRecordByData('user_credentials', 'user', userRecord.id)
        } catch (_) {
          existingCred = null
        }

        if (existingCred) {
          existingCred.set('password_plain', s.password)
          app.save(existingCred)
          console.log(
            `[SEED] Credencial atualizada para usuário ${userRecord.getString('name') || userRecord.id} (${userRecord.getString('email')})`,
          )
        } else {
          const cred = new Record(userCredentialsCol)
          cred.set('user', userRecord.id)
          cred.set('password_plain', s.password)
          app.save(cred)
          console.log(
            `[SEED] Credencial criada para usuário ${userRecord.getString('name') || userRecord.id} (${userRecord.getString('email')})`,
          )
        }
      } catch (err) {
        console.log(`[SEED] Erro ao salvar credencial para ${userRecord.id}:`, err)
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('user_credentials')
      app.delete(col)
    } catch (_) {}
  },
)
