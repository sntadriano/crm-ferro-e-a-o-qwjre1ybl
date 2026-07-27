migrate(
  (app) => {
    // Ensure Danilo and Vinicius have lowercase-stored passwords so the
    // login form's case-insensitive normalization (lowercase) matches.
    // The login form lowercases the input before authWithPassword, so
    // stored passwords MUST also be lowercase for auth to succeed.

    const updates = [
      { email: 'danilovendas88@hotmail.com', password: 'eldorado2026' },
      { email: 'Viniciusmamedes00@gmail.com', password: 'mamedes00' },
    ]

    for (const u of updates) {
      try {
        const record = app.findAuthRecordByEmail('users', u.email)
        record.setPassword(u.password.toLowerCase())
        app.save(record)
      } catch (_) {
        // User not found, skip safely
      }
    }

    // Ensure Vinicius has codigos_vendedor = [13] (only code 13)
    try {
      const vinicius = app.findAuthRecordByEmail('users', 'Viniciusmamedes00@gmail.com')
      const current = vinicius.get('codigos_vendedor')
      const same = Array.isArray(current) && current.length === 1 && current[0] === 13
      if (!same) {
        vinicius.set('codigos_vendedor', [13])
        app.save(vinicius)
      }
    } catch (_) {
      // Vinicius not found, skip safely
    }

    // Ensure Danilo remains active and has correct codes [2, 4]
    try {
      const danilo = app.findAuthRecordByEmail('users', 'danilovendas88@hotmail.com')
      const current = danilo.get('codigos_vendedor')
      const same =
        Array.isArray(current) &&
        current.length === 2 &&
        current.indexOf(2) !== -1 &&
        current.indexOf(4) !== -1
      if (!same) {
        danilo.set('codigos_vendedor', [2, 4])
        app.save(danilo)
      }
    } catch (_) {
      // Danilo not found, skip safely
    }
  },
  (app) => {
    // Cannot reliably revert passwords to their previous hashed state.
  },
)
