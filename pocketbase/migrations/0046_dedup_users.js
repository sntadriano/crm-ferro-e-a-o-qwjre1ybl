migrate(
  (app) => {
    const allUsers = app.findRecordsByFilter('users', '', '', 1000, 0)

    const byName = {}
    for (let i = 0; i < allUsers.length; i++) {
      const u = allUsers[i]
      const name = u.getString('name')
      if (!name) continue
      if (!byName[name]) byName[name] = []
      byName[name].push(u)
    }

    for (const name in byName) {
      const group = byName[name]
      if (group.length <= 1) continue

      for (let j = 0; j < group.length; j++) {
        const user = group[j]
        let hasRecords = false

        try {
          const leads = app.findRecordsByFilter('leads', "usuario_id = '" + user.id + "'", '', 1, 0)
          if (leads.length > 0) hasRecords = true
        } catch (_) {}

        if (!hasRecords) {
          try {
            const contatos = app.findRecordsByFilter(
              'contatos',
              "usuario_id = '" + user.id + "'",
              '',
              1,
              0,
            )
            if (contatos.length > 0) hasRecords = true
          } catch (_) {}
        }

        if (!hasRecords && user.getBool('active')) {
          user.set('active', false)
          app.save(user)
        }
      }

      const activeUsers = []
      for (let k = 0; k < group.length; k++) {
        if (group[k].getBool('active')) activeUsers.push(group[k])
      }

      const usedCodes = {}
      for (let m = 0; m < activeUsers.length; m++) {
        const u2 = activeUsers[m]
        const code = u2.getInt('codigo')
        if (code === 0 || usedCodes[code]) {
          let newCode = 1
          while (usedCodes[newCode]) newCode++
          u2.set('codigo', newCode)
          usedCodes[newCode] = true
          app.save(u2)
        } else {
          usedCodes[code] = true
        }
      }
    }
  },
  (app) => {
    // Cannot reliably reverse deactivation and code reassignment
  },
)
