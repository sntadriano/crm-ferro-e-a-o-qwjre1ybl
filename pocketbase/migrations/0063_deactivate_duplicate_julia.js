migrate(
  (app) => {
    let juliaRecords = []
    try {
      juliaRecords = app.findRecordsByFilter('users', "role = 'julia'", 'created', 50, 0)
    } catch (_) {
      return
    }

    if (juliaRecords.length <= 1) return

    // Priority 1: verified with non-empty email (real login credential)
    // Priority 2: has non-empty email
    // Priority 3: first record by created date
    let realJulia = null

    for (const rec of juliaRecords) {
      const email = rec.getString('email').trim()
      const verified = rec.getBool('verified')
      if (email && verified && !realJulia) {
        realJulia = rec
      }
    }

    if (!realJulia) {
      for (const rec of juliaRecords) {
        const email = rec.getString('email').trim()
        if (email && !realJulia) {
          realJulia = rec
        }
      }
    }

    if (!realJulia) realJulia = juliaRecords[0]

    const duplicates = []
    for (const rec of juliaRecords) {
      if (rec.id !== realJulia.id) {
        duplicates.push(rec)
      }
    }

    // Ensure real Julia has correct codigos_vendedor and active=true
    const TARGET_CODES = [1, 5, 6, 10, 11, 999]
    const currentCodes = realJulia.get('codigos_vendedor')
    const sameCodes =
      Array.isArray(currentCodes) &&
      currentCodes.length === TARGET_CODES.length &&
      TARGET_CODES.every(function (c) {
        return currentCodes.indexOf(c) !== -1
      })

    let needsSave = false
    if (!sameCodes) {
      realJulia.set('codigos_vendedor', TARGET_CODES)
      needsSave = true
    }
    if (!realJulia.getBool('active')) {
      realJulia.set('active', true)
      needsSave = true
    }
    if (needsSave) app.save(realJulia)

    // Deactivate all duplicates — linked records remain intact
    let deactivatedCount = 0
    for (const dup of duplicates) {
      if (dup.getBool('active')) {
        dup.set('active', false)
        app.save(dup)
        deactivatedCount++
      }
    }

    console.log('===== MIGRATION 0063 — JULIA DUPLICATE RESOLUTION =====')
    console.log('Real Julia:', realJulia.id, realJulia.getString('email'))
    console.log(
      'Duplicates deactivated:',
      deactivatedCount,
      duplicates
        .map(function (d) {
          return d.id
        })
        .join(', '),
    )
  },
  (app) => {
    // Revert: re-activate duplicate Julia accounts (safe rollback)
    try {
      const juliaRecords = app.findRecordsByFilter(
        'users',
        "role = 'julia' && active = false",
        'created',
        50,
        0,
      )
      for (const rec of juliaRecords) {
        rec.set('active', true)
        app.save(rec)
      }
    } catch (_) {}
  },
)
