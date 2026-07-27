routerAdd(
  'POST',
  '/backend/v1/clientes/popular-vendedor',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'admin') {
      return e.forbiddenError('Acesso restrito a administradores.')
    }

    var body = e.requestInfo().body || {}
    var apply = body.apply === true

    var clientes = []
    try {
      clientes = $app.findRecordsByFilter('clientes', 'id != ""', 'codigo', 0, 0)
    } catch (_) {}

    var pedidos = []
    try {
      pedidos = $app.findRecordsByFilter('pedidos', 'id != ""', '-data', 0, 0)
    } catch (_) {}

    // Group pedidos by codigo_cliente
    var pedidosByCliente = {}
    for (var i = 0; i < pedidos.length; i++) {
      var codigo = pedidos[i].getInt('codigo_cliente')
      if (!codigo) continue
      if (!pedidosByCliente[codigo]) pedidosByCliente[codigo] = []
      pedidosByCliente[codigo].push({
        vendedor: pedidos[i].getInt('vendedor') || 0,
        data: pedidos[i].getString('data') || '',
      })
    }

    var resolved = 0
    var unresolved = 0
    var updated = 0
    var wouldUpdate = 0
    var details = []

    for (var ci = 0; ci < clientes.length; ci++) {
      var cliente = clientes[ci]
      var cliCodigo = cliente.getInt('codigo')
      var pedidosForCliente = pedidosByCliente[cliCodigo] || []

      if (pedidosForCliente.length === 0) {
        unresolved++
        continue
      }

      // Find most frequent vendedor (mode)
      var counts = {}
      for (var pi = 0; pi < pedidosForCliente.length; pi++) {
        var vend = pedidosForCliente[pi].vendedor
        if (!counts[vend]) counts[vend] = { count: 0, lastData: '' }
        counts[vend].count++
        if (pedidosForCliente[pi].data > counts[vend].lastData) {
          counts[vend].lastData = pedidosForCliente[pi].data
        }
      }

      // Sort by count desc, then lastData desc, then vendedor asc
      var sorted = Object.keys(counts)
        .map(function (k) {
          return { vendedor: Number(k), count: counts[k].count, lastData: counts[k].lastData }
        })
        .sort(function (a, b) {
          if (b.count !== a.count) return b.count - a.count
          if (b.lastData !== a.lastData) return b.lastData > a.lastData ? 1 : -1
          return a.vendedor - b.vendedor
        })

      var mostFrequent = sorted[0].vendedor
      resolved++

      var currentVendedor = cliente.getInt('vendedor') || 0
      if (currentVendedor !== mostFrequent) {
        if (apply) {
          cliente.set('vendedor', mostFrequent)
          try {
            $app.save(cliente)
            updated++
          } catch (_) {}
        } else {
          wouldUpdate++
        }
        if (details.length < 100) {
          details.push({
            cliente_id: cliente.id,
            codigo: cliCodigo,
            descricao: cliente.getString('descricao'),
            vendedor_anterior: currentVendedor,
            vendedor_novo: mostFrequent,
            total_pedidos: pedidosForCliente.length,
          })
        }
      }
    }

    return e.json(200, {
      apply: apply,
      totalClientes: clientes.length,
      resolved: resolved,
      unresolved: unresolved,
      updated: apply ? updated : 0,
      wouldUpdate: apply ? 0 : wouldUpdate,
      details: details,
    })
  },
  $apis.requireAuth(),
)
