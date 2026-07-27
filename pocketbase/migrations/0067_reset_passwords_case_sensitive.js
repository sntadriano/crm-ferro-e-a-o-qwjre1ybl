migrate(
  (app) => {
    // Reset passwords for all active users using case-sensitive values.
    // NO forced lowercasing — passwords are set verbatim as the user typed them.
    // This fixes the root cause of login failures caused by the previous
    // case-insensitive normalization (toLowerCase) in the login page, which
    // mismatched against stored (mixed-case) password hashes.

    const users = [
      { email: 'adriano_santos_09@hotmail.com', password: 'pass_adriano_2026' },
      { email: 'alexsilvasantos23@hotmail.com', password: 'pass_alex_2026' },
      { email: 'julia.carmona159@gmail.com', password: 'Julia2025' },
      { email: 'danilovendas88@hotmail.com', password: 'eldorado2026' },
      { email: 'Viniciusmamedes00@gmail.com', password: 'mamedes00' },
      { email: 'soaresclaudio@gmail.com', password: 'pass_claudio' },
      { email: 'ferroeacoeldorado@hotmail.com', password: 'Eldorado@Admin' },
      { email: 'geovangarcia@gmail.com', password: 'pass_geovan' },
    ]

    for (let i = 0; i < users.length; i++) {
      const u = users[i]
      try {
        const record = app.findAuthRecordByEmail('users', u.email)
        record.setPassword(u.password)
        app.save(record)
      } catch (_) {
        // User not found — skip safely (idempotent)
      }
    }

    // Correct Vinicius's email to all-lowercase so it matches the login form's
    // email normalization (safeEmail = email.toLowerCase()).
    // findAuthRecordByEmail is case-insensitive, so this finds the record
    // regardless of the currently stored casing.
    try {
      const vinicius = app.findAuthRecordByEmail('users', 'Viniciusmamedes00@gmail.com')
      const currentEmail = vinicius.getString('email') || ''
      if (currentEmail !== 'viniciusmamedes00@gmail.com') {
        vinicius.setEmail('viniciusmamedes00@gmail.com')
        app.save(vinicius)
      }
    } catch (_) {
      // Vinicius not found — skip safely
    }
  },
  (app) => {
    // Cannot reliably revert passwords to their previous hashed state.
  },
)
