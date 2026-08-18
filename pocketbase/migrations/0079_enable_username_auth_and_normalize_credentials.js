migrate(
  (app) => {
    // =========================================================================
    // 0079 — Simplificação do login (username + email) e normalização de senha
    // =========================================================================
    //
    // Objetivos (solicitado pelo Adriano):
    //   1. Habilitar login por "username" além de "email" na collection `users`,
    //      definindo `passwordAuth.identityFields = ["username", "email"]`.
    //   2. Definir um `username` simples em minúsculas (primeiro nome) para cada
    //      usuário existente: adriano, alex, julia, danilo, vinicius, geovan,
    //      claudio, admin.
    //   3. Reaplicar `setPassword` com as senhas mais recentes documentadas no
    //      histórico de migrations (0077), convertidas para MINÚSCULAS — o
    //      formulário de login normaliza a senha digitada com `toLowerCase()`
    //      antes do `authWithPassword`, então o hash precisa ser da forma
    //      minúscula para o match funcionar.
    //   4. Garantir `active=true` e `verified=true` para todos esses usuários.
    //
    // NÃO altera roles, codigos_vendedor nem regras de permissão.
    //
    // NOTA TÉCNICA: no PocketBase 0.23+ o campo `username` deixou de ser um
    // campo de sistema embutido em auth collections. Para usá-lo como
    // identity field ele precisa ser (a) adicionado explicitamente como um
    // TextField, (b) ter valores únicos e (c) ter um índice UNIQUE. Por isso
    // a migration faz 3 saves encadeados: cria o campo -> popula usernames
    // únicos -> adiciona o índice UNIQUE + habilita passwordAuth.
    // =========================================================================

    const usersCol = app.findCollectionByNameOrId('users')

    // -------------------------------------------------------------------------
    // Passo 1 — garantir que o campo `username` existe no schema da collection.
    // -------------------------------------------------------------------------
    if (!usersCol.fields.getByName('username')) {
      usersCol.fields.add(new TextField({ name: 'username' }))
      app.save(usersCol)
    }

    // -------------------------------------------------------------------------
    // Passo 2 — popular `username` (único) + `setPassword` (minúsculas) +
    // active/verified para cada usuário. Feito ANTES do índice UNIQUE para
    // evitar colisão de valores vazios/duplicados.
    //
    // Senhas = valores EXATOS da migration 0077 (última intenção documentada),
    // convertidos para minúsculas para casar com o toLowerCase() do login.
    // -------------------------------------------------------------------------
    const users = [
      { email: 'adriano_santos_09@hotmail.com', username: 'adriano', password: '@dri1234' },
      { email: 'julia.carmona159@gmail.com', username: 'julia', password: 'julia@skip2026' },
      { email: 'alexsilvasantos23@hotmail.com', username: 'alex', password: 'skip@2026' },
      { email: 'danilovendas88@hotmail.com', username: 'danilo', password: 'eldorado2026' },
      { email: 'viniciusmamedes00@gmail.com', username: 'vinicius', password: 'mamedes00' },
      { email: 'geovangarcia@gmail.com', username: 'geovan', password: '29042003' },
      { email: 'soaresclaudio65@gmail.com', username: 'claudio', password: 'claudio@skip2026' },
      { email: 'ferroeacoeldorado@hotmail.com', username: 'admin', password: 'eldorado@admin' },
    ]

    console.log('===== MIGRATION 0079 — USERNAME AUTH + PASSWORD NORMALIZATION =====')

    for (let i = 0; i < users.length; i++) {
      const u = users[i]
      let record = null
      try {
        record = app.findAuthRecordByEmail('users', u.email)
      } catch (_) {
        record = null
      }

      if (!record) {
        console.log('SKIP (não encontrado):', u.username, '-', u.email)
        continue
      }

      // username simples em minúsculas (sobrescreve qualquer valor anterior).
      record.set('username', u.username)

      // senha em minúsculas (casar com o toLowerCase() do login)
      record.setPassword(u.password.toLowerCase())

      // active + verified garantidos
      if (!record.getBool('active')) {
        record.set('active', true)
      }
      if (!record.getBool('verified')) {
        record.setVerified(true)
      }

      app.save(record)
      console.log('OK:', u.username, '|', u.email, '| senha normalizada p/ minúsculas')
    }

    // -------------------------------------------------------------------------
    // 2b. Contas secundárias com o mesmo primeiro nome (Alex/Julia em outro
    //     domínio): como `username` agora é UNIQUE, recebem um username
    //     derivado para não colidir, mantendo login por email funcional.
    // -------------------------------------------------------------------------
    const secondary = [
      { email: 'alex@ferroeacoeldorado.com.br', username: 'alex_eldorado' },
      { email: 'julia@ferroeacoeldorado.com.br', username: 'julia_eldorado' },
    ]

    for (let i = 0; i < secondary.length; i++) {
      const s = secondary[i]
      let record = null
      try {
        record = app.findAuthRecordByEmail('users', s.email)
      } catch (_) {
        record = null
      }
      if (!record) continue

      record.set('username', s.username)
      if (!record.getBool('active')) {
        record.set('active', true)
      }
      if (!record.getBool('verified')) {
        record.setVerified(true)
      }
      app.save(record)
      console.log('OK (secundário):', s.username, '|', s.email)
    }

    // -------------------------------------------------------------------------
    // Passo 3 — adicionar índice UNIQUE sobre `username` e habilitar login por
    // username + email. addIndex é idempotente.
    // -------------------------------------------------------------------------
    usersCol.addIndex('idx_username_unique', true, 'username', "username != ''")

    usersCol.passwordAuth = {
      enabled: true,
      identityFields: ['username', 'email'],
    }

    app.save(usersCol)

    console.log('===== MIGRATION 0079 — RESUMO DE CREDENCIAIS =====')
    console.log('adriano  | adriano_santos_09@hotmail.com  | senha: @dri1234 (minúsculas)')
    console.log('julia    | julia.carmona159@gmail.com    | senha: julia@skip2026 (minúsculas)')
    console.log('alex     | alexsilvasantos23@hotmail.com | senha: skip@2026 (minúsculas)')
    console.log('danilo   | danilovendas88@hotmail.com    | senha: eldorado2026 (minúsculas)')
    console.log('vinicius | viniciusmamedes00@gmail.com   | senha: mamedes00 (minúsculas)')
    console.log('geovan   | geovangarcia@gmail.com        | senha: 29042003 (minúsculas)')
    console.log('claudio  | soaresclaudio65@gmail.com     | senha: claudio@skip2026 (minúsculas)')
    console.log('admin    | ferroeacoeldorado@hotmail.com | senha: eldorado@admin (minúsculas)')
    console.log('Login aceito por username (ex: "adriano") OU por email.')
  },
  (app) => {
    // Revert: restaura identityFields para apenas "email" e remove o índice
    // de username. Não revertemos senhas (hashes não são reversíveis).
    try {
      const usersCol = app.findCollectionByNameOrId('users')
      usersCol.passwordAuth = {
        enabled: true,
        identityFields: ['email'],
      }
      usersCol.removeIndex('idx_username_unique')
      app.save(usersCol)
    } catch (_) {
      // collection não encontrada — nada a fazer
    }
  },
)
