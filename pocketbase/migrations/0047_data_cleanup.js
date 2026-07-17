migrate(
  (app) => {
    function reassignRecords(collection, field, oldId, newId) {
      try {
        var records = app.findRecordsByFilter(collection, field + " = '" + oldId + "'", '', 1000, 0)
        for (var i = 0; i < records.length; i++) {
          records[i].set(field, newId)
          app.save(records[i])
        }
      } catch (_) {}
    }

    function sortByCreatedDesc(a, b) {
      var da = new Date(a.getString('created')).getTime()
      var db = new Date(b.getString('created')).getTime()
      return db - da
    }

    function mergeUsers(primary, duplicates) {
      for (var i = 0; i < duplicates.length; i++) {
        var dup = duplicates[i]
        reassignRecords('leads', 'usuario_id', dup.id, primary.id)
        reassignRecords('contatos', 'usuario_id', dup.id, primary.id)
        reassignRecords('producao', 'usuario_id', dup.id, primary.id)
        reassignRecords('notificacoes', 'usuario_id', dup.id, primary.id)
        reassignRecords('contatos', 'validado_por', dup.id, primary.id)
        try {
          app.delete(dup)
        } catch (_) {}
      }
    }

    function mergeClients(primary, duplicates) {
      for (var i = 0; i < duplicates.length; i++) {
        var dup = duplicates[i]
        reassignRecords('leads', 'cliente_id', dup.id, primary.id)
        reassignRecords('contatos', 'cliente_id', dup.id, primary.id)
        try {
          app.delete(dup)
        } catch (_) {}
      }
    }

    // === Users: deduplicate records named "Alex" ===
    var alexUsers = []
    try {
      alexUsers = app.findRecordsByFilter('users', "name = 'Alex'", '-created', 100, 0)
    } catch (_) {}

    // Group by email — same email = same person
    var byEmail = {}
    for (var i = 0; i < alexUsers.length; i++) {
      var email = (alexUsers[i].getString('email') || '').toLowerCase()
      if (!email) continue
      if (!byEmail[email]) byEmail[email] = []
      byEmail[email].push(alexUsers[i])
    }
    for (var em in byEmail) {
      var grp = byEmail[em]
      if (grp.length <= 1) continue
      grp.sort(sortByCreatedDesc)
      mergeUsers(grp[0], grp.slice(1))
    }

    // Re-fetch after email-based merges
    try {
      alexUsers = app.findRecordsByFilter('users', "name = 'Alex'", '-created', 100, 0)
    } catch (_) {}

    // Group by codigo — same internal code = same person
    var byCodigo = {}
    for (var j = 0; j < alexUsers.length; j++) {
      var code = alexUsers[j].getInt('codigo')
      if (code === 0) continue
      if (!byCodigo[code]) byCodigo[code] = []
      byCodigo[code].push(alexUsers[j])
    }
    for (var cd in byCodigo) {
      var cgrp = byCodigo[cd]
      if (cgrp.length <= 1) continue
      cgrp.sort(sortByCreatedDesc)
      mergeUsers(cgrp[0], cgrp.slice(1))
    }

    // === Clientes: deduplicate "3B LTDA" records sharing the same CNPJ/CPF ===
    var b3Clients = []
    try {
      b3Clients = app.findRecordsByFilter(
        'clientes',
        "fantasia = '3B LTDA' || descricao = '3B LTDA'",
        '-created',
        100,
        0,
      )
    } catch (_) {}

    var byCnpj = {}
    for (var k = 0; k < b3Clients.length; k++) {
      var doc = b3Clients[k].getString('cnpj_cpf')
      if (!doc) continue
      if (!byCnpj[doc]) byCnpj[doc] = []
      byCnpj[doc].push(b3Clients[k])
    }
    for (var dc in byCnpj) {
      var dgrp = byCnpj[dc]
      if (dgrp.length <= 1) continue
      dgrp.sort(sortByCreatedDesc)
      mergeClients(dgrp[0], dgrp.slice(1))
    }
  },
  (app) => {
    // Cannot reliably reverse deduplication — merged records were deleted
  },
)
