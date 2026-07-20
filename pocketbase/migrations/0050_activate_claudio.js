migrate(
  (app) => {
    // Step 1: Identify the primary account for "Claudio"
    let primary = null
    try {
      primary = app.findAuthRecordByEmail('users', 'soaresclaudio65@gmail.com')
    } catch (_) {
      try {
        primary = app.findAuthRecordByEmail('users', 'soaresclaudio@gmail.com')
      } catch (_) {
        // Fallback: find by name "Claudio" (excluding the duplicate email)
        try {
          const matches = app.findRecordsByFilter(
            'users',
            "name = 'Claudio' && email != 'claudio@ferroeacoeldorado.com.br'",
            '-created',
            10,
            0,
          )
          if (matches && matches.length > 0) {
            primary = matches[0]
          }
        } catch (_) {}
      }
    }

    if (!primary) {
      // Cannot proceed without a primary account — skip safely
      return
    }

    // Step 2: Activate the primary account if not already active
    if (!primary.getBool('active')) {
      primary.set('active', true)
      app.save(primary)
    }

    // Step 3: Identify the duplicate/obsolete account
    let duplicate = null
    try {
      duplicate = app.findAuthRecordByEmail('users', 'claudio@ferroeacoeldorado.com.br')
    } catch (_) {
      // Duplicate already deleted — nothing more to do
      return
    }

    const primaryId = primary.id
    const duplicateId = duplicate.id

    // Safety: if primary and duplicate are the same record, nothing to merge
    if (primaryId === duplicateId) {
      return
    }

    // Step 4: Reassign all records from duplicate to primary
    const reassignments = [
      { collection: 'leads', field: 'usuario_id' },
      { collection: 'contatos', field: 'usuario_id' },
      { collection: 'contatos', field: 'validado_por' },
      { collection: 'producao', field: 'usuario_id' },
      { collection: 'notificacoes', field: 'usuario_id' },
    ]

    for (let i = 0; i < reassignments.length; i++) {
      const cfg = reassignments[i]
      try {
        const records = app.findRecordsByFilter(
          cfg.collection,
          cfg.field + " = '" + duplicateId + "'",
          '',
          1000,
          0,
        )
        for (let j = 0; j < records.length; j++) {
          try {
            records[j].set(cfg.field, primaryId)
            app.save(records[j])
          } catch (_) {
            // Skip records that fail to save
          }
        }
      } catch (_) {
        // Filter error or collection issue — skip
      }
    }

    // Step 5: Delete the duplicate account
    try {
      app.delete(duplicate)
    } catch (_) {
      // Already deleted or deletion blocked — ignore
    }
  },
  (app) => {
    // Revert: we cannot reliably recreate the deleted duplicate account
    // or reverse the record reassignment without data loss risk.
    // Leaving down migration empty for safety.
  },
)
