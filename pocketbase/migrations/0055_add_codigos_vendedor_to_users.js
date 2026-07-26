migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('codigos_vendedor')) {
      users.fields.add(new JSONField({ name: 'codigos_vendedor' }))
    }
    app.save(users)

    // Migrate existing `codigo` values into the new `codigos_vendedor` array.
    // Only backfill users that don't already have a populated array so the
    // migration is idempotent and never clobbers manually-edited values.
    const allUsers = app.findRecordsByFilter('_pb_users_auth_', "id != ''", 'created', 1000, 0)
    for (const u of allUsers) {
      const codigo = u.getInt('codigo')
      if (!codigo || codigo <= 0) continue

      const existing = u.get('codigos_vendedor')
      const hasValues =
        Array.isArray(existing) &&
        existing.length > 0 &&
        existing.some((n) => typeof n === 'number')
      if (hasValues) continue

      u.set('codigos_vendedor', [codigo])
      app.save(u)
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (users.fields.getByName('codigos_vendedor')) {
      users.fields.removeByName('codigos_vendedor')
    }
    app.save(users)
  },
)
