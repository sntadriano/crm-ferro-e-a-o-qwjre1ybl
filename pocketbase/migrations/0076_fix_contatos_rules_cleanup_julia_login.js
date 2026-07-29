migrate(
  (app) => {
    // =========================================================================
    // 1. Update contatos listRule / viewRule to allow vendedores to see their
    //    own "Possível Cliente" records (possivel_cliente = true && creator)
    //    OR records linked to clients in their sales portfolio.
    //
    //    Previous rule (migration 0057/0075) only allowed portfolio-based
    //    access, so prospect records created by a vendedor (without a formal
    //    cliente_id link) were invisible to them.
    // =========================================================================
    const contatos = app.findCollectionByNameOrId('contatos')
    const newContatoRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || (@request.auth.role = 'vendedor' && (possivel_cliente = true && usuario_id = @request.auth.id || @request.auth.codigos_vendedor ~ cliente_id.vendedor))))"
    contatos.listRule = newContatoRule
    contatos.viewRule = newContatoRule
    app.save(contatos)

    // =========================================================================
    // 2. Find and permanently delete Danilo's test prospect record.
    //    Matches: descricao = 'TESTE PROSPECT AUTOMACAO',
    //             tipo = 'visita_presencial',
    //             resultado = 'visitado_com_sucesso',
    //             data_contato = '2026-07-29'
    // =========================================================================
    let testRecords = []
    try {
      testRecords = app.findRecordsByFilter(
        'contatos',
        "descricao = 'TESTE PROSPECT AUTOMACAO' && tipo = 'visita_presencial' && resultado = 'visitado_com_sucesso'",
        '-created',
        50,
        0,
      )
    } catch (_) {
      testRecords = []
    }

    let deletedCount = 0
    if (testRecords.length > 0) {
      console.log('===== TEST RECORD CLEANUP (Danilo prospect) =====')
    }
    for (let i = 0; i < testRecords.length; i++) {
      const rec = testRecords[i]
      const dataContato = rec.getString('data_contato') || ''
      if (dataContato.indexOf('2026-07-29') !== -1) {
        console.log('Found test record ID:', rec.id)
        console.log('  descricao:', rec.getString('descricao'))
        console.log('  tipo:', rec.getString('tipo'))
        console.log('  resultado:', rec.getString('resultado'))
        console.log('  data_contato:', dataContato)
        app.delete(rec)
        deletedCount++
      }
    }
    console.log('Test records deleted:', deletedCount)

    // =========================================================================
    // 3. Restore Julia's login by targeting the ACTIVE account directly by ID.
    //    Active account ID: 0o2s2jo1d7xjktt
    //    Duplicate (do NOT touch): n37q9hu5progi2h
    // =========================================================================
    const JULIA_ACTIVE_ID = '0o2s2jo1d7xjktt'
    const NEW_PASSWORD = 'Julia@Skip2026'

    let juliaRecord = null
    try {
      juliaRecord = app.findRecordById('users', JULIA_ACTIVE_ID)
    } catch (_) {
      juliaRecord = null
    }

    console.log('===== JULIA LOGIN FIX =====')
    if (!juliaRecord) {
      console.log('ERROR: Active Julia account not found with ID:', JULIA_ACTIVE_ID)
    } else {
      const currentEmail = juliaRecord.getString('email') || ''
      const wasActive = juliaRecord.getBool('active')
      const role = juliaRecord.getString('role') || ''

      console.log('Active Julia account located:')
      console.log('  ID:', juliaRecord.id)
      console.log('  Email:', currentEmail)
      console.log('  Role:', role)
      console.log('  Was active before fix:', wasActive)

      // Set new known password (hashed via setPassword).
      juliaRecord.setPassword(NEW_PASSWORD)

      // Ensure the account is active and verified.
      if (!juliaRecord.getBool('active')) {
        juliaRecord.set('active', true)
      }
      juliaRecord.setVerified(true)

      app.save(juliaRecord)

      console.log('Password successfully updated for Julia.')
      console.log('  New password:', NEW_PASSWORD)
      console.log('  Active: true')
      console.log('  Verified: true')
      console.log('--- Relay these credentials to Julia ---')
      console.log('  Login URL: /login')
      console.log('  Email:', currentEmail)
      console.log('  Password:', NEW_PASSWORD)
      console.log('----------------------------------------')
    }
  },
  (app) => {
    // Revert contatos listRule / viewRule to the pre-0076 state
    // (portfolio-only access from migration 0057).
    const contatos = app.findCollectionByNameOrId('contatos')
    const prevRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || (@request.auth.role = 'vendedor' && @request.auth.codigos_vendedor ~ cliente_id.vendedor)))"
    contatos.listRule = prevRule
    contatos.viewRule = prevRule
    app.save(contatos)

    // Julia password: cannot reliably restore the previous hash.
    // Test record: already deleted, cannot restore.
  },
)
