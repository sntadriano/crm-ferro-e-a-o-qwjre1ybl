routerAdd(
  'POST',
  '/backend/v1/vendas/resumo',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'admin') {
      return e.forbiddenError('Acesso restrito a administradores.')
    }

    const body = e.requestInfo().body || {}

    var parts = ["status != 'cancelado'"]
    if (body.dateStart) {
      parts.push('data >= "' + body.dateStart + 'T00:00:00.000Z"')
    }
    if (body.dateEnd) {
      parts.push('data <= "' + body.dateEnd + 'T23:59:59.999Z"')
    }
    if (
      body.vendedor !== undefined &&
      body.vendedor !== null &&
      body.vendedor !== '' &&
      body.vendedor !== 'all'
    ) {
      parts.push('vendedor = ' + Number(body.vendedor))
    }

    var filter = parts.join(' && ')

    var pedidos = []
    try {
      pedidos = $app.findRecordsByFilter('pedidos', filter, '-data', 0, 0)
    } catch (_) {}

    // Fetch all active users and build codigo -> user map for per-person consolidation
    var users = []
    try {
      users = $app.findRecordsByFilter('users', 'active = true', 'name', 0, 0)
    } catch (_) {}

    var codeToUser = {}
    var usuarioStats = {}
    for (var u = 0; u < users.length; u++) {
      var usr = users[u]
      var codigosRaw = usr.get('codigos_vendedor')
      var codigos = []
      if (Array.isArray(codigosRaw)) {
        codigos = codigosRaw
      } else if (codigosRaw !== null && codigosRaw !== undefined && codigosRaw !== '') {
        try {
          var parsed = JSON.parse(typeof codigosRaw === 'string' ? codigosRaw : '[]')
          if (Array.isArray(parsed)) codigos = parsed
        } catch (_) {}
      }
      if (!codigos.length) continue
      var userId = usr.id
      var userName = usr.getString('name') || usr.getString('email') || 'Sem nome'
      usuarioStats[userId] = {
        userId: userId,
        nome: userName,
        email: usr.getString('email') || '',
        codigos: [],
        totalPedidos: 0,
        valorTotal: 0,
        quantidadeItens: 0,
      }
      for (var c = 0; c < codigos.length; c++) {
        var numCode = Number(codigos[c])
        if (!Number.isFinite(numCode)) continue
        codeToUser[numCode] = userId
        if (usuarioStats[userId].codigos.indexOf(numCode) === -1) {
          usuarioStats[userId].codigos.push(numCode)
        }
      }
    }

    var totalValor = 0
    var pedidoIdSet = {}
    var vendedorStats = {}
    var pedidoItemCounts = {}

    for (var i = 0; i < pedidos.length; i++) {
      var p = pedidos[i]
      var valorPedido = p.getFloat('valor_pedido') || 0
      var totalMercadorias = p.getFloat('total_mercadorias') || 0
      var desconto = p.getFloat('desconto_acrescimo') || 0
      var valor = valorPedido > 0 ? valorPedido : totalMercadorias + desconto
      totalValor += valor
      pedidoIdSet[p.id] = true

      var v = p.getInt('vendedor') || 0
      if (!vendedorStats[v]) {
        vendedorStats[v] = {
          vendedor: v,
          totalPedidos: 0,
          valorTotal: 0,
          quantidadeItens: 0,
          mapeado: codeToUser[v] !== undefined,
        }
      }
      vendedorStats[v].totalPedidos++
      vendedorStats[v].valorTotal += valor

      // Per-user consolidation
      var usrId = codeToUser[v]
      if (usrId && usuarioStats[usrId]) {
        usuarioStats[usrId].totalPedidos++
        usuarioStats[usrId].valorTotal += valor
      }
    }

    // Fetch all pedido_itens and sum quantities for matching pedidos
    var totalItensQty = 0
    var allItens = []
    try {
      allItens = $app.findRecordsByFilter('pedido_itens', 'id != ""', '', 0, 0)
    } catch (_) {}

    for (var j = 0; j < allItens.length; j++) {
      var item = allItens[j]
      var pid = item.getString('pedido_id')
      if (pedidoIdSet[pid]) {
        var qty = item.getFloat('quantidade') || 0
        totalItensQty += qty
        // Find the pedido's vendedor to attribute itens to code/user
        // We need to look up the pedido - build a map of pedido id -> vendedor
        if (!pedidoItemCounts[pid]) pedidoItemCounts[pid] = 0
        pedidoItemCounts[pid] += qty
      }
    }

    // Attribute pedido itens to vendedor codes and users
    var pedidoVendedorMap = {}
    for (var pi = 0; pi < pedidos.length; pi++) {
      var ped = pedidos[pi]
      var pedV = ped.getInt('vendedor') || 0
      pedidoVendedorMap[ped.id] = pedV
      var itemQty = pedidoItemCounts[ped.id] || 0
      if (vendedorStats[pedV]) vendedorStats[pedV].quantidadeItens += itemQty
      var uId = codeToUser[pedV]
      if (uId && usuarioStats[uId]) usuarioStats[uId].quantidadeItens += itemQty
    }

    var totalPedidos = pedidos.length
    var ticketMedio = totalPedidos > 0 ? totalValor / totalPedidos : 0

    var vendedorBreakdown = []
    var keys = Object.keys(vendedorStats)
    for (var k = 0; k < keys.length; k++) {
      var stat = vendedorStats[keys[k]]
      var codeNum = stat.vendedor
      stat.label = stat.mapeado ? String(codeNum) : 'Código ' + codeNum + ' (não mapeado)'
      stat.ticketMedio = stat.totalPedidos > 0 ? stat.valorTotal / stat.totalPedidos : 0
      vendedorBreakdown.push(stat)
    }
    vendedorBreakdown.sort(function (a, b) {
      return b.valorTotal - a.valorTotal
    })

    var usuarioBreakdown = []
    var uKeys = Object.keys(usuarioStats)
    for (var uk = 0; uk < uKeys.length; uk++) {
      var uStat = usuarioStats[uKeys[uk]]
      uStat.ticketMedio = uStat.totalPedidos > 0 ? uStat.valorTotal / uStat.totalPedidos : 0
      uStat.percentual = totalValor > 0 ? (uStat.valorTotal / totalValor) * 100 : 0
      usuarioBreakdown.push(uStat)
    }
    usuarioBreakdown.sort(function (a, b) {
      return b.valorTotal - a.valorTotal
    })

    return e.json(200, {
      totalPedidos: totalPedidos,
      valorTotal: totalValor,
      quantidadeItens: totalItensQty,
      ticketMedio: ticketMedio,
      vendedorBreakdown: vendedorBreakdown,
      usuarioBreakdown: usuarioBreakdown,
    })
  },
  $apis.requireAuth(),
)
