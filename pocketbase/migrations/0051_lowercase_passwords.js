// CONVENTION: All future migrations or password updates must use lowercase strings for consistency.
// This ensures case-insensitive password authentication works correctly across the application.
// Note: The superuser account (ferroeacoeldorado@hotmail.com) in _superusers is NOT modified here.
migrate(
  (app) => {
    var accountsToUpdate = [
      { email: 'adriano_santos_09@hotmail.com', password: '@dri1234' },
      { email: 'alexsilvasantos23@hotmail.com', password: '23081994' },
      { email: 'julia.carmona159@gmail.com', password: 'julia1102.' },
      { email: 'soaresclaudio@gmail.com', password: '010365cf' },
      { email: 'soaresclaudio65@gmail.com', password: '010365cf' },
      { email: 'geovangarcia@gmail.com', password: '29042003' },
    ]

    for (var i = 0; i < accountsToUpdate.length; i++) {
      var account = accountsToUpdate[i]
      try {
        var record = app.findAuthRecordByEmail('users', account.email)
        record.setPassword(account.password.toLowerCase())
        app.save(record)
      } catch (_) {
        // User not found, skip safely
      }
    }
  },
  (app) => {
    // Cannot reliably revert passwords to their previous hashed state.
  },
)
