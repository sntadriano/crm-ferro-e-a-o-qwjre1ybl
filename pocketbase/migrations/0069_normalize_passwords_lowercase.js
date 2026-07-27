migrate(
  (app) => {
    // Normalize all active user passwords to their lowercase forms so the
    // login page's case-insensitive password normalization (toLowerCase)
    // matches the stored hashes. This makes login accept passwords in any
    // case (upper, lower, mixed) without requiring the user to remember
    // the exact capitalization.

    const users = [
      { email: 'adriano_santos_09@hotmail.com', password: 'pass_adriano_2026' },
      { email: 'alexsilvasantos23@hotmail.com', password: 'pass_alex_2026' },
      { email: 'julia.carmona159@gmail.com', password: 'julia2025' },
      { email: 'danilovendas88@hotmail.com', password: 'eldorado2026' },
      { email: 'viniciusmamedes00@gmail.com', password: 'mamedes00' },
      { email: 'soaresclaudio@gmail.com', password: 'pass_claudio' },
      { email: 'ferroeacoeldorado@hotmail.com', password: 'eldorado@admin' },
      { email: 'geovangarcia@gmail.com', password: 'pass_geovan' },
    ]

    for (let i = 0; i < users.length; i++) {
      const u = users[i]
      try {
        const record = app.findAuthRecordByEmail('users', u.email)
        // setPassword hashes verbatim — pass the exact lowercase value.
        record.setPassword(u.password)
        app.save(record)
      } catch (_) {
        // User not found — skip safely (idempotent)
      }
    }

    // Confirm Claudio's email is the canonical lowercase form.
    // Migration 0068 already restored it, but verify defensively.
    let claudio = null
    try {
      claudio = app.findAuthRecordByEmail('users', 'soaresclaudio@gmail.com')
    } catch (_) {
      // Fall back to the migration-0049 variant if the canonical lookup fails.
      try {
        claudio = app.findAuthRecordByEmail('users', 'soaresclaudio65@gmail.com')
      } catch (_) {
        claudio = null
      }
    }

    if (claudio) {
      const currentEmail = claudio.getString('email') || ''
      if (currentEmail !== 'soaresclaudio@gmail.com') {
        claudio.setEmail('soaresclaudio@gmail.com')
        try {
          claudio.set('username', 'soaresclaudio@gmail.com')
        } catch (_) {
          /* username field may not exist — ignore */
        }
        claudio.setVerified(true)
        claudio.set('active', true)
        app.save(claudio)
      }
    }
  },
  (app) => {
    // Cannot reliably revert passwords to their previous hashed state.
  },
)
