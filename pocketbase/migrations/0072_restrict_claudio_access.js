migrate(
  (app) => {
    // 1. Find Claudio's user record (try new email first, then old)
    var claudio = null
    try {
      claudio = app.findAuthRecordByEmail('users', 'soaresclaudio65@gmail.com')
    } catch (_) {
      try {
        claudio = app.findAuthRecordByEmail('users', 'soaresclaudio@gmail.com')
      } catch (_) {
        claudio = null
      }
    }

    if (claudio) {
      var claudioId = claudio.id
      var productionResources = ['producao', 'itens_producao', 'fotos_producao', 'maquinas']

      // 2. Remove non-production permissoes for Claudio
      var allPerms = []
      try {
        allPerms = app.findRecordsByFilter(
          'permissoes',
          "usuario_id = '" + claudioId + "'",
          '',
          500,
          0,
        )
      } catch (_) {
        allPerms = []
      }

      for (var i = 0; i < allPerms.length; i++) {
        var recurso = allPerms[i].getString('recurso')
        if (productionResources.indexOf(recurso) === -1) {
          app.delete(allPerms[i])
        }
      }

      // 3. Add production permissoes for Claudio (idempotent)
      var permCol = app.findCollectionByNameOrId('permissoes')
      var actions = ['list', 'view', 'create', 'update']
      for (var r = 0; r < productionResources.length; r++) {
        for (var a = 0; a < actions.length; a++) {
          var existing = []
          try {
            existing = app.findRecordsByFilter(
              'permissoes',
              "usuario_id = '" +
                claudioId +
                "' && recurso = '" +
                productionResources[r] +
                "' && acao = '" +
                actions[a] +
                "'",
              '',
              1,
              0,
            )
          } catch (_) {
            existing = []
          }
          if (existing.length === 0) {
            var record = new Record(permCol)
            record.set('usuario_id', claudioId)
            record.set('recurso', productionResources[r])
            record.set('acao', actions[a])
            app.save(record)
          }
        }
      }
    }

    // 4. Update vendedores API rules to exclude gerente_producao
    var vendedores = app.findCollectionByNameOrId('vendedores')
    vendedores.listRule = "@request.auth.id != '' && @request.auth.role != 'gerente_producao'"
    vendedores.viewRule = "@request.auth.id != '' && @request.auth.role != 'gerente_producao'"
    app.save(vendedores)

    // 5. Update notificacoes API rules to exclude gerente_producao
    var notificacoes = app.findCollectionByNameOrId('notificacoes')
    var notifReadRule =
      "@request.auth.id != '' && @request.auth.role != 'gerente_producao' && (@request.auth.role = 'admin' || @request.auth.role = 'julia' || usuario_id = @request.auth.id)"
    var notifUpdateRule =
      "@request.auth.id != '' && @request.auth.role != 'gerente_producao' && (@request.auth.role = 'admin' || @request.auth.role = 'julia' || usuario_id = @request.auth.id)"
    notificacoes.listRule = notifReadRule
    notificacoes.viewRule = notifReadRule
    notificacoes.updateRule = notifUpdateRule
    app.save(notificacoes)
  },
  (app) => {
    // Revert vendedores rules
    var vendedores = app.findCollectionByNameOrId('vendedores')
    vendedores.listRule = "@request.auth.id != ''"
    vendedores.viewRule = "@request.auth.id != ''"
    app.save(vendedores)

    // Revert notificacoes rules
    var notificacoes = app.findCollectionByNameOrId('notificacoes')
    var notifReadRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'julia' || usuario_id = @request.auth.id)"
    var notifUpdateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'julia' || usuario_id = @request.auth.id)"
    notificacoes.listRule = notifReadRule
    notificacoes.viewRule = notifReadRule
    notificacoes.updateRule = notifUpdateRule
    app.save(notificacoes)
  },
)
