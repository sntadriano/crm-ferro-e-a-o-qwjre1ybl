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

    var totalValor = 0
    var pedidoIdSet = {}
    var vendedorStats = {}

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
        vendedorStats[v] = { vendedor: v, totalPedidos: 0, valorTotal: 0 }
      }
      vendedorStats[v].totalPedidos++
      vendedorStats[v].valorTotal += valor
    }

    // Fetch all pedido_itens and sum quantities for matching pedidos
    var totalItensQty = 0
    var allItens = []
    try {
      allItens = $app.findRecordsByFilter('pedido_itens', 'id != ""', '', 0, 0)
    } catch (_) {}

    for (var j = 0; j < allItens.length; j++) {
      var pid = allItens[j].getString('pedido_id')
      if (pedidoIdSet[pid]) {
        totalItensQty += allItens[j].getFloat('quantidade') || 0
      }
    }

    var totalPedidos = pedidos.length
    var ticketMedio = totalPedidos > 0 ? totalValor / totalPedidos : 0

    var vendedorBreakdown = []
    var keys = Object.keys(vendedorStats)
    for (var k = 0; k < keys.length; k++) {
      vendedorBreakdown.push(vendedorStats[keys[k]])
    }
    vendedorBreakdown.sort(function (a, b) {
      return b.valorTotal - a.valorTotal
    })

    return e.json(200, {
      totalPedidos: totalPedidos,
      valorTotal: totalValor,
      quantidadeItens: totalItensQty,
      ticketMedio: ticketMedio,
      vendedorBreakdown: vendedorBreakdown,
    })
  },
  $apis.requireAuth(),
)
