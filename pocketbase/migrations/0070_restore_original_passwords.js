migrate(
  (app) => {
    // Restore the original passwords for Adriano, Alex, Claudio, and Geovan
    // (converted to lowercase). The login page normalizes the typed password
    // with toLowerCase() before authenticating, so storing the lowercase form
    // makes login accept any casing (e.g. "@DRI1234", "@Dri1234", "@dri1234").
    //
    // Only these four users are touched — Julia, Danilo, Vinicius, and the
    // Admin (Eldorado) keep their current passwords unchanged.

    const users = [
      { email: 'adriano_santos_09@hotmail.com', password: '@dri1234' },
      { email: 'alexsilvasantos23@hotmail.com', password: 'skip@2026' },
      { email: 'soaresclaudio@gmail.com', password: '010365cf' },
      { email: 'geovangarcia@gmail.com', password: '29042003' },
    ]

    for (let i = 0; i < users.length; i++) {
      const u = users[i]
      try {
        // findAuthRecordByEmail is case-insensitive — locates the record
        // regardless of the currently stored casing.
        const record = app.findAuthRecordByEmail('users', u.email)
        // setPassword hashes verbatim — pass the exact lowercase value so
        // the login form's toLowerCase() normalization matches the hash.
        record.setPassword(u.password)
        // Ensure Claudio's account is active + verified so he can log in.
        if (!record.getBool('active')) {
          record.set('active', true)
        }
        if (!record.getBool('verified')) {
          record.setVerified(true)
        }
        app.save(record)
      } catch (_) {
        // User not found — skip safely (idempotent)
      }
    }
  },
  (app) => {
    // Cannot reliably revert passwords to their previous hashed state.
  },
)
