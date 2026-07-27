routerAdd(
  'POST',
  '/backend/v1/pedidos/import',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'admin') {
      return e.forbiddenError('Acesso restrito a administradores.')
    }

    const body = e.requestInfo().body || {}
    const pedidosRows = body.pedidos || []
    const itensRows = body.itens || []

    if (!Array.isArray(pedidosRows)) {
      return e.badRequestError("Campo 'pedidos' deve ser um array.")
    }
    if (!Array.isArray(itensRows)) {
      return e.badRequestError("Campo 'itens' deve ser um array.")
    }

    const pedidosCol = $app.findCollectionByNameOrId('pedidos')
    const itensCol = $app.findCollectionByNameOrId('pedido_itens')
    const auditCol = $app.findCollectionByNameOrId('audit_logs')

    var created = 0
    var updated = 0
    var itemsInserted = 0
    var missingClientes = 0
    var missingProdutos = 0
    var errors = []

    var itensByNumero = {}
    for (var i = 0; i < itensRows.length; i++) {
      var item = itensRows[i]
      var num = Number(item.numero || item.pedido_numero)
      if (!num || !Number.isFinite(num)) continue
      if (!itensByNumero[num]) itensByNumero[num] = []
      itensByNumero[num].push(item)
    }

    var numFields = [
      'valor_pedido',
      'entrada_dinheiro',
      'entrada_pix',
      'entrada_cartao',
      'valor_aprazo',
      'qtd_itens',
      'frete',
      'total_mercadorias',
      'desconto_acrescimo',
    ]

    for (var pi = 0; pi < pedidosRows.length; pi++) {
      var row = pedidosRows[pi]
      var numero = Number(row.numero)
      if (!numero || !Number.isFinite(numero)) {
        errors.push({ reason: 'numero invalido ou ausente' })
        continue
      }

      var clienteId = null
      var codigoCliente = Number(row.codigo_cliente)
      if (codigoCliente && Number.isFinite(codigoCliente)) {
        try {
          var cliente = $app.findFirstRecordByFilter('clientes', 'codigo = ?', codigoCliente)
          clienteId = cliente.id
        } catch (_) {
          missingClientes++
        }
      }

      var pedido
      var isNew = false
      try {
        pedido = $app.findFirstRecordByFilter('pedidos', 'numero = ?', numero)
      } catch (_) {
        pedido = new Record(pedidosCol)
        isNew = true
      }

      pedido.set('numero', numero)
      if (row.data) {
        try {
          pedido.set('data', row.data)
        } catch (_) {}
      }
      if (codigoCliente && Number.isFinite(codigoCliente)) {
        pedido.set('codigo_cliente', codigoCliente)
      }
      if (clienteId) pedido.set('cliente_id', clienteId)
      var vendedor = Number(row.vendedor)
      if (Number.isFinite(vendedor)) pedido.set('vendedor', vendedor)
      if (row.cp) pedido.set('cp', String(row.cp))
      for (var nf = 0; nf < numFields.length; nf++) {
        var f = numFields[nf]
        if (row[f] !== undefined && row[f] !== null && row[f] !== '') {
          pedido.set(f, Number(row[f]) || 0)
        }
      }
      if (row.status) pedido.set('status', String(row.status))

      try {
        $app.save(pedido)
        if (isNew) created++
        else updated++

        var existingItems = $app.findRecordsByFilter(
          'pedido_itens',
          'pedido_id = ?',
          '',
          1000,
          0,
          pedido.id,
        )
        for (var ei = 0; ei < existingItems.length; ei++) {
          $app.delete(existingItems[ei])
        }

        var items = itensByNumero[numero] || []
        for (var ii = 0; ii < items.length; ii++) {
          var itemRow = items[ii]
          var produtoId = null
          var codigoProduto = String(itemRow.codigo_produto || '').trim()
          if (codigoProduto) {
            try {
              var produto = $app.findFirstRecordByFilter('produtos', 'codigo = ?', codigoProduto)
              produtoId = produto.id
            } catch (_) {
              missingProdutos++
            }
          }

          var itemRec = new Record(itensCol)
          itemRec.set('pedido_id', pedido.id)
          if (codigoProduto) itemRec.set('codigo_produto', codigoProduto)
          if (produtoId) itemRec.set('produto_id', produtoId)
          if (itemRow.descricao) itemRec.set('descricao', String(itemRow.descricao))
          if (itemRow.unidade) itemRec.set('unidade', String(itemRow.unidade))
          if (itemRow.quantidade !== undefined) {
            itemRec.set('quantidade', Number(itemRow.quantidade) || 0)
          }
          if (itemRow.valor_unitario !== undefined) {
            itemRec.set('valor_unitario', Number(itemRow.valor_unitario) || 0)
          }
          if (itemRow.valor_total !== undefined) {
            itemRec.set('valor_total', Number(itemRow.valor_total) || 0)
          }

          try {
            $app.save(itemRec)
            itemsInserted++
          } catch (saveErr) {
            errors.push({
              reason: 'item save: ' + (saveErr.message || 'erro'),
            })
          }
        }
      } catch (saveErr) {
        errors.push({
          numero: numero,
          reason: saveErr.message || 'Erro ao salvar pedido',
        })
      }
    }

    try {
      var auditRec = new Record(auditCol)
      auditRec.set('usuario_id', e.auth ? e.auth.id : 'system')
      auditRec.set('usuario_nome', e.auth ? e.auth.getString('name') : 'System')
      auditRec.set('acao', 'IMPORT')
      auditRec.set('tabela', 'pedidos')
      auditRec.set('registro_id', '')
      auditRec.set('detalhes', [
        {
          campo: 'import',
          valor_anterior: null,
          valor_novo: {
            created: created,
            updated: updated,
            itemsInserted: itemsInserted,
            missingClientes: missingClientes,
            missingProdutos: missingProdutos,
            errorsCount: errors.length,
          },
        },
      ])
      $app.saveNoValidate(auditRec)
    } catch (_) {}

    return e.json(200, {
      created: created,
      updated: updated,
      itemsInserted: itemsInserted,
      missingClientes: missingClientes,
      missingProdutos: missingProdutos,
      errors: errors,
    })
  },
  $apis.requireAuth(),
)
