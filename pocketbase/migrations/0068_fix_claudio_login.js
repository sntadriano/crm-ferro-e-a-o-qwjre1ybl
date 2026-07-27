migrate(
  (app) => {
    // Root cause:
    //  - Migration 0049 changed Claudio's email to 'soaresclaudio65@gmail.com'.
    //  - Migration 0067 tried to reset Claudio's password by looking up
    //    'soaresclaudio@gmail.com' (the OLD email). findAuthRecordByEmail
    //    threw, the catch swallowed it, and the password was NEVER reset.
    //  - Net effect: Claudio's password hash is stale (from migration 0035,
    //    '010365CF') AND the login page's email normalization (lowercase
    //    'soaresclaudio@gmail.com') doesn't match the stored '...65@gmail.com'.
    //
    // Fix: locate Claudio by either email (or by name as a last resort),
    // restore the canonical lowercase email, reset the password to the
    // case-sensitive value 'pass_claudio', and ensure active + verified.

    const TARGET_EMAIL = 'soaresclaudio@gmail.com'
    const TARGET_PASSWORD = 'pass_claudio'

    let record = null

    // Try the canonical email first.
    try {
      record = app.findAuthRecordByEmail('users', TARGET_EMAIL)
    } catch (_) {
      record = null
    }

    // Fall back to the migration-0049 variant.
    if (!record) {
      try {
        record = app.findAuthRecordByEmail('users', 'soaresclaudio65@gmail.com')
      } catch (_) {
        record = null
      }
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
      // Cannot proceed without a Claudio record — skip safely (idempotent).
      return
    }

    let dirty = false

    // 1. Restore canonical lowercase email so the login form's normalization
    //    (email.toLowerCase()) matches the stored value.
    const currentEmail = record.getString('email') || ''
    if (currentEmail !== TARGET_EMAIL) {
      record.setEmail(TARGET_EMAIL)
      try {
        record.set('username', TARGET_EMAIL)
      } catch (_) {
        /* username field may not exist — ignore */
      }
      record.setVerified(true)
      try {
        record.set('emailVisibility', true)
      } catch (_) {
        /* field may not exist — ignore */
      }
      dirty = true
    }

    // 2. Reset password to the case-sensitive value 'pass_claudio'.
    //    setPassword hashes verbatim — NO .toLowerCase() conversion.
    record.setPassword(TARGET_PASSWORD)
    dirty = true

    // 3. Ensure account is active.
    if (!record.getBool('active')) {
      record.set('active', true)
      dirty = true
    }

    // 4. Ensure role is 'gerente' (Claudio's intended role).
    try {
      const role = record.get('role')
      if (role !== 'gerente') {
        record.set('role', 'gerente')
        dirty = true
      }
    } catch (_) {
      /* role field may not exist — ignore */
    }

    // 5. Ensure verified flag.
    if (!record.getBool('verified')) {
      record.setVerified(true)
      dirty = true
    }

    if (dirty) {
      app.save(record)
    }
  },
  (app) => {
    // Revert: we cannot reliably restore the previous password hash or the
    // migration-0049 email variant. Leaving the down migration empty for safety.
  },
)
