migrate(
  (app) => {
    const OLD_EMAIL = 'soaresclaudio@gmail.com'
    const NEW_EMAIL = 'soaresclaudio65@gmail.com'

    let record = null

    // Idempotent: if already at the target email, nothing to do.
    try {
      record = app.findAuthRecordByEmail('users', NEW_EMAIL)
    } catch (_) {
      record = null
    }

    if (record) {
      // Already migrated — ensure username matches and verified flags are set.
      let dirty = false
      if (record.getString('email') !== NEW_EMAIL) {
        record.setEmail(NEW_EMAIL)
        dirty = true
      }
      try {
        if (record.getString('username') !== NEW_EMAIL) {
          record.set('username', NEW_EMAIL)
          dirty = true
        }
      } catch (_) {}
      if (!record.getBool('verified')) {
        record.setVerified(true)
        dirty = true
      }
      try {
        if (!record.getBool('emailVisibility')) {
          record.set('emailVisibility', true)
          dirty = true
        }
      } catch (_) {}
      if (dirty) app.save(record)
      return
    }

    // Locate by the old email.
    try {
      record = app.findAuthRecordByEmail('users', OLD_EMAIL)
    } catch (_) {
      record = null
    }

    // Last resort: find by name 'Claudio'.
    if (!record) {
      try {
        const matches = app.findRecordsByFilter('users', "name = 'Claudio'", '-created', 10, 0)
        if (matches && matches.length > 0) {
          record = matches[0]
        }
      } catch (_) {
        record = null
      }
    }

    if (!record) {
      console.log('[0071] Nenhum usuário Claudio encontrado — migração pulada (idempotente).')
      return
    }

    // Only update the email — password is left untouched.
    record.setEmail(NEW_EMAIL)
    try {
      record.set('username', NEW_EMAIL)
    } catch (_) {}
    if (!record.getBool('verified')) {
      record.setVerified(true)
    }
    try {
      record.set('emailVisibility', true)
    } catch (_) {}
    if (!record.getBool('active')) {
      record.set('active', true)
    }

    app.save(record)
  },
  (app) => {
    // Revert: restore the original email so the down-migration is safe.
    const OLD_EMAIL = 'soaresclaudio@gmail.com'
    const NEW_EMAIL = 'soaresclaudio65@gmail.com'

    try {
      const record = app.findAuthRecordByEmail('users', NEW_EMAIL)
      if (!record) return
      record.setEmail(OLD_EMAIL)
      try {
        record.set('username', OLD_EMAIL)
      } catch (_) {}
      record.setVerified(true)
      try {
        record.set('emailVisibility', true)
      } catch (_) {}
      app.save(record)
    } catch (_) {
      // Already reverted or user not found — idempotent.
    }
  },
)
