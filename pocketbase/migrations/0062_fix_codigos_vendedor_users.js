migrate(
  (app) => {
    const TARGET_CODES_ALEX = [1, 5, 6, 10, 11, 999]
    const TARGET_CODES_ADMIRANO = [1, 3, 5, 6, 10, 11, 999]
    const TARGET_CODES_JULIA = [1, 5, 6, 10, 11, 999]

    const setCodesIfDifferent = (record, codes) => {
      const current = record.get('codigos_vendedor')
      const same =
        Array.isArray(current) &&
        current.length === codes.length &&
        codes.every((c) => current.indexOf(c) !== -1)
      if (!same) {
        record.set('codigos_vendedor', codes)
        return true
      }
      return false
    }

    // --- Alex (active, admin) ---
    let alexUpdated = false
    let alexRecord = null
    try {
      const alexRecords = app.findRecordsByFilter(
        'users',
        "name ?~ 'Alex' && role = 'admin' && active = true",
        'created',
        10,
        0,
      )
      if (alexRecords.length > 0) {
        alexRecord = alexRecords[0]
        if (setCodesIfDifferent(alexRecord, TARGET_CODES_ALEX)) {
          app.save(alexRecord)
          alexUpdated = true
        }
      }
    } catch (_) {}

    // --- Adriano (admin) ---
    let adrianoUpdated = false
    let adrianoRecord = null
    try {
      const adrianoRecords = app.findRecordsByFilter(
        'users',
        "name ?~ 'Adriano' && role = 'admin'",
        'created',
        10,
        0,
      )
      if (adrianoRecords.length > 0) {
        adrianoRecord = adrianoRecords[0]
        if (setCodesIfDifferent(adrianoRecord, TARGET_CODES_ADMIRANO)) {
          app.save(adrianoRecord)
          adrianoUpdated = true
        }
      }
    } catch (_) {}

    // --- Julia accounts ---
    let juliaRealRecord = null
    let juliaDuplicateRecord = null
    let juliaRealUpdated = false
    let juliaDuplicateDeactivated = false
    try {
      const juliaRecords = app.findRecordsByFilter('users', "role = 'julia'", 'created', 50, 0)
      for (const rec of juliaRecords) {
        const email = rec.getString('email')
        if (email && email.trim() !== '') {
          if (!juliaRealRecord) juliaRealRecord = rec
        } else {
          if (!juliaDuplicateRecord) juliaDuplicateRecord = rec
        }
      }
      if (juliaRealRecord) {
        if (setCodesIfDifferent(juliaRealRecord, TARGET_CODES_JULIA)) {
          app.save(juliaRealRecord)
          juliaRealUpdated = true
        }
      }
      if (juliaDuplicateRecord) {
        if (juliaDuplicateRecord.getBool('active')) {
          juliaDuplicateRecord.set('active', false)
          app.save(juliaDuplicateRecord)
          juliaDuplicateDeactivated = true
        }
      }
    } catch (_) {}

    // --- Duplicate inactive Alex verification (no changes) ---
    let inactiveAlexRecord = null
    let inactiveAlexInPermissoes = false
    try {
      const inactiveAlexRecords = app.findRecordsByFilter(
        'users',
        "name ?~ 'Alex' && role = 'admin' && active = false",
        'created',
        10,
        0,
      )
      if (inactiveAlexRecords.length > 0) {
        inactiveAlexRecord = inactiveAlexRecords[0]
        try {
          const permRefs = app.findRecordsByFilter(
            'permissoes',
            "usuario_id = '" + inactiveAlexRecord.id + "'",
            '',
            1,
            0,
          )
          inactiveAlexInPermissoes = permRefs.length > 0
        } catch (_) {
          inactiveAlexInPermissoes = false
        }
      }
    } catch (_) {}

    // --- Final report ---
    const report = []
    try {
      const reportRecords = app.findRecordsByFilter(
        'users',
        "role = 'admin' || role = 'julia' || role = 'vendedor'",
        'name',
        500,
        0,
      )
      for (const u of reportRecords) {
        report.push({
          id: u.id,
          name: u.getString('name'),
          email: u.getString('email'),
          role: u.getString('role'),
          active: u.getBool('active'),
          codigos_vendedor: u.get('codigos_vendedor') || [],
        })
      }
    } catch (_) {}

    console.log('===== MIGRATION 0062 — USER CODES FIX REPORT =====')
    console.log('Alex updated: ' + alexUpdated)
    console.log('Adriano updated: ' + adrianoUpdated)
    console.log('Julia real updated: ' + juliaRealUpdated)
    console.log('Julia duplicate deactivated: ' + juliaDuplicateDeactivated)
    console.log(
      'Inactive Alex found: ' +
        (inactiveAlexRecord ? inactiveAlexRecord.id : 'NO') +
        ' | referenced in permissoes: ' +
        inactiveAlexInPermissoes,
    )
    console.log('FINAL REPORT (admin | julia | vendedor):')
    console.log(JSON.stringify(report, null, 2))
  },
  (app) => {
    // Revert is intentionally minimal: the prior state contained invalid codes
    // (91, 49, 44, 51, 93) that should not be restored. We only re-activate
    // the duplicate Julia record so the rollback is safe to run.
    try {
      const juliaRecords = app.findRecordsByFilter(
        'users',
        "role = 'julia' && active = false",
        'created',
        50,
        0,
      )
      for (const rec of juliaRecords) {
        const email = rec.getString('email')
        if (!email || email.trim() === '') {
          rec.set('active', true)
          app.save(rec)
        }
      }
    } catch (_) {}
  },
)
