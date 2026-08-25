migrate(
  (app) => {
    // =========================================================================
    // 0081 — Correção definitiva do login de Julia e Claudio
    // =========================================================================
    //
    // CONTEXTO:
    //   A migration anterior procurou usuários por e-mail fixo documentado.
    //   No entanto, contas duplicadas na tabela "users" fizeram com que a
    //   conta realmente ativa/recente ficasse com credenciais divergentes.
    //
    // IDENTIFICADORES ESTÁVEIS:
    //   - Julia:   users com role = 'julia' && active = true
    //   - Claudio: users com role = 'gerente_producao' && active = true
    //
    // REGRAS DE EXECUÇÃO:
    //   1. Se houver mais de uma conta ativa com o role correspondente:
    //      - Logar todas (id, email, username atual, updated)
    //      - Selecionar a conta com 'updated' mais recente
    //   2. Antes de gravar o username ("julia" / "claudio"):
    //      - Verificar se qualquer OUTRA conta usa esse username
    //      - Renomear a conta conflitante para "<target>_antigo_<id>"
    //   3. Gravar na conta selecionada:
    //      - username = "julia" (ou "claudio")
    //      - setPassword("julia@skip2026") / setPassword("claudio@skip2026")
    //        (preservando o case exato)
    //      - active = true, verified = true
    //   4. Logar resumo final com id + email de cada conta corrigida.
    // =========================================================================

    console.log('===== MIGRATION 0081 — CORREÇÃO DE LOGIN: JULIA E CLAUDIO =====')

    const targets = [
      {
        name: 'Julia',
        role: 'julia',
        desiredUsername: 'julia',
        password: 'julia@skip2026',
      },
      {
        name: 'Claudio',
        role: 'gerente_producao',
        desiredUsername: 'claudio',
        password: 'claudio@skip2026',
      },
    ]

    for (let t = 0; t < targets.length; t++) {
      const target = targets[t]
      console.log(`\n--- Processando ${target.name} (role: '${target.role}') ---`)

      // 1. Buscar todas as contas ativas com o role
      let activeAccounts = []
      try {
        activeAccounts = app.findRecordsByFilter(
          'users',
          `role = '${target.role}' && active = true`,
          '-updated',
          100,
          0,
        )
      } catch (err) {
        console.log(`Erro ao buscar contas para ${target.name}:`, err)
        activeAccounts = []
      }

      // Se não encontrou nenhuma conta ativa, busca qualquer conta com o role (mesmo active=false)
      if (activeAccounts.length === 0) {
        console.log(
          `Nenhuma conta ativa encontrada com role = '${target.role}'. Buscando todas com esse role...`,
        )
        try {
          activeAccounts = app.findRecordsByFilter(
            'users',
            `role = '${target.role}'`,
            '-updated',
            100,
            0,
          )
        } catch (_) {
          activeAccounts = []
        }
      }

      if (activeAccounts.length === 0) {
        console.log(
          `AVISO: Nenhuma conta encontrada com role '${target.role}' para ${target.name}.`,
        )
        continue
      }

      // Logar todas as contas encontradas
      console.log(`Contas encontradas (${activeAccounts.length}):`)
      for (let i = 0; i < activeAccounts.length; i++) {
        const acc = activeAccounts[i]
        console.log(
          `  [${i + 1}] ID: ${acc.id} | Email: ${acc.getString('email')} | Username: ${acc.getString('username')} | Updated: ${acc.getString('updated')} | Active: ${acc.getBool('active')}`,
        )
      }

      // A lista veio ordenada por '-updated', então o primeiro elemento é o mais recente
      const chosenAccount = activeAccounts[0]
      console.log(
        `Conta selecionada para ${target.name}: ID ${chosenAccount.id} (Email: ${chosenAccount.getString('email')})`,
      )

      // 2. Verificar se outra conta já está usando o username desejado
      let conflictingRecords = []
      try {
        conflictingRecords = app.findRecordsByFilter(
          'users',
          `username = '${target.desiredUsername}' && id != '${chosenAccount.id}'`,
          '',
          100,
          0,
        )
      } catch (_) {
        conflictingRecords = []
      }

      for (let c = 0; c < conflictingRecords.length; c++) {
        const conflict = conflictingRecords[c]
        const fallbackUsername = `${target.desiredUsername}_antigo_${conflict.id}`
        console.log(`Liberando username '${target.desiredUsername}' da conta duplicada/antiga:`)
        console.log(
          `  ID: ${conflict.id} | Email: ${conflict.getString('email')} | Novo username: ${fallbackUsername}`,
        )
        conflict.set('username', fallbackUsername)
        app.save(conflict)
      }

      // 3. Aplicar username, senha, active e verified na conta escolhida
      chosenAccount.set('username', target.desiredUsername)
      chosenAccount.setPassword(target.password)
      chosenAccount.set('active', true)
      chosenAccount.setVerified(true)

      app.save(chosenAccount)

      // 4. Log do resumo
      console.log(`SUCESSO: ${target.name} corrigido(a) com sucesso!`)
      console.log(`  ID: ${chosenAccount.id}`)
      console.log(`  Email: ${chosenAccount.getString('email')}`)
      console.log(`  Username: ${target.desiredUsername}`)
      console.log(`  Senha aplicada: ${target.password}`)
      console.log(`  Active: true | Verified: true`)
    }

    console.log('\n===== RESUMO FINAL MIGRATION 0081 =====')
    console.log(
      'Julia e Claudio atualizados com identificadores estáveis (role + active + latest updated).',
    )
  },
  (app) => {
    console.log('===== DOWNGRADE 0081 (no-op) =====')
  },
)
