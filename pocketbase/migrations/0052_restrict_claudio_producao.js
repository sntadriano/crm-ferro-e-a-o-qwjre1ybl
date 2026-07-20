migrate(
  (app) => {
    // 1. Add 'gerente_producao' to the users role select field values
    var usersCol = app.findCollectionByNameOrId('users')
    var roleField = usersCol.fields.getByName('role')
    if (roleField && roleField.values && roleField.values.indexOf('gerente_producao') === -1) {
      roleField.values = roleField.values.concat(['gerente_producao'])
    }
    app.save(usersCol)

    // 2. Change Claudio's role from 'gerente' to 'gerente_producao'
    var claudio = null
    try {
      claudio = app.findAuthRecordByEmail('users', 'soaresclaudio@gmail.com')
    } catch (_) {}
    if (!claudio) {
      try {
        claudio = app.findAuthRecordByEmail('users', 'soaresclaudio65@gmail.com')
      } catch (_) {}
    }
    if (!claudio) {
      try {
        var matches = app.findRecordsByFilter('users', "name = 'Claudio'", '-created', 10, 0)
        if (matches && matches.length > 0) {
          claudio = matches[0]
        }
      } catch (_) {}
    }
    if (claudio) {
      claudio.set('role', 'gerente_producao')
      app.save(claudio)
    }

    // 3. Update itens_producao collection rules to include gerente_producao
    var itensCol = app.findCollectionByNameOrId('itens_producao')
    var listRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'gerente_producao' || @request.auth.role = 'paulo' || @request.auth.role = 'julia'))"
    var writeRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'gerente_producao' || @request.auth.role = 'paulo')"
    itensCol.listRule = listRule
    itensCol.viewRule = listRule
    itensCol.createRule = writeRule
    itensCol.updateRule = writeRule
    itensCol.deleteRule = writeRule
    app.save(itensCol)
  },
  (app) => {
    // Revert Claudio's role back to 'gerente'
    var claudio = null
    try {
      claudio = app.findAuthRecordByEmail('users', 'soaresclaudio@gmail.com')
    } catch (_) {}
    if (!claudio) {
      try {
        claudio = app.findAuthRecordByEmail('users', 'soaresclaudio65@gmail.com')
      } catch (_) {}
    }
    if (claudio) {
      claudio.set('role', 'gerente')
      app.save(claudio)
    }

    // Revert itens_producao rules
    var itensCol = app.findCollectionByNameOrId('itens_producao')
    var listRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'paulo' || @request.auth.role = 'julia'))"
    var writeRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'paulo')"
    itensCol.listRule = listRule
    itensCol.viewRule = listRule
    itensCol.createRule = writeRule
    itensCol.updateRule = writeRule
    itensCol.deleteRule = writeRule
    app.save(itensCol)
  },
)
