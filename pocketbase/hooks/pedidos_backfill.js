routerAdd(
  'POST',
  '/backend/v1/pedidos/backfill-relations',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'admin') {
      return e.forbiddenError('Acesso restrito a administradores.')
    }

    const clientesMap = {}
    const allClientes = $app.findRecordsByFilter('clientes', 'id != ""', '', 0, 0)
    for (const c of allClientes) {
      const codigo = c.getInt('codigo')
      if (codigo) {
        clientesMap[codigo] = {
          id: c.id,
          descricao: c.getString('descricao'),
          fantasia: c.getString('fantasia'),
        }
      }
    }

    const produtosMap = {}
    const allProdutos = $app.findRecordsByFilter('produtos', 'id != ""', '', 0, 0)
    for (const p of allProdutos) {
      const codigo = p.getString('codigo')
      if (codigo) produtosMap[codigo] = p.id
    }

    const pedidos = $app.findRecordsByFilter('pedidos', 'id != ""', '-created', 0, 0)

    let pedidosResolved = 0
    let pedidosStillEmpty = 0
    const unmatchedCodigoClienteMap = {}

    for (const pedido of pedidos) {
      const existingClienteId = pedido.getString('cliente_id')
      if (existingClienteId) {
        pedidosResolved++
        continue
      }

      const codigoCliente = pedido.getInt('codigo_cliente')
      const match = codigoCliente ? clientesMap[codigoCliente] : null

      if (match) {
        pedido.set('cliente_id', match.id)
        const nome = match.descricao || match.fantasia || ''
        if (nome) pedido.set('cliente_nome', nome)
        try {
          $app.save(pedido)
        } catch (_) {}
        pedidosResolved++
      } else {
        pedidosStillEmpty++
        const key = String(codigoCliente || '')
        if (!unmatchedCodigoClienteMap[key]) unmatchedCodigoClienteMap[key] = 0
        unmatchedCodigoClienteMap[key]++
      }
    }

    const itens = $app.findRecordsByFilter('pedido_itens', 'id != ""', '-created', 0, 0)

    let itensResolved = 0
    let itensStillEmpty = 0
    const unmatchedCodigoProdutoMap = {}

    for (const item of itens) {
      const existingProdutoId = item.getString('produto_id')
      if (existingProdutoId) {
        itensResolved++
        continue
      }

      const codigoProduto = item.getString('codigo_produto')
      const match = codigoProduto ? produtosMap[codigoProduto] : null

      if (match) {
        item.set('produto_id', match)
        try {
          $app.save(item)
        } catch (_) {}
        itensResolved++
      } else {
        itensStillEmpty++
        const key = String(codigoProduto || '')
        if (!unmatchedCodigoProdutoMap[key]) unmatchedCodigoProdutoMap[key] = 0
        unmatchedCodigoProdutoMap[key]++
      }
    }

    const unmatchedCodigoCliente = []
    const clienteKeys = Object.keys(unmatchedCodigoClienteMap)
    for (const k of clienteKeys) {
      unmatchedCodigoCliente.push({ codigo: k, count: unmatchedCodigoClienteMap[k] })
    }
    unmatchedCodigoCliente.sort((a, b) => b.count - a.count)

    const unmatchedCodigoProduto = []
    const produtoKeys = Object.keys(unmatchedCodigoProdutoMap)
    for (const k of produtoKeys) {
      unmatchedCodigoProduto.push({ codigo: k, count: unmatchedCodigoProdutoMap[k] })
    }
    unmatchedCodigoProduto.sort((a, b) => b.count - a.count)

    return e.json(200, {
      pedidos: {
        total: pedidos.length,
        resolved: pedidosResolved,
        stillEmpty: pedidosStillEmpty,
      },
      itens: {
        total: itens.length,
        resolved: itensResolved,
        stillEmpty: itensStillEmpty,
      },
      unmatchedCodigoCliente: unmatchedCodigoCliente,
      unmatchedCodigoProduto: unmatchedCodigoProduto,
    })
  },
  $apis.requireAuth(),
)
