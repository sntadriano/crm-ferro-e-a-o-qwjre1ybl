routerAdd(
  'POST',
  '/backend/v1/pedidos/import',
  (e) => {
    const body = e.requestInfo().body || {}

    if (!Array.isArray(body.pedidos) || !Array.isArray(body.itens)) {
      return e.badRequestError('Formato inválido. Envie um JSON com pedidos e itens.')
    }

    const pedidos = body.pedidos
    const itens = body.itens

    if (pedidos.length === 0) {
      return e.badRequestError('Nenhum pedido para importar.')
    }

    const pedidosCol = $app.findCollectionByNameOrId('pedidos')
    const itensCol = $app.findCollectionByNameOrId('pedido_itens')

    const clientesMap = {}
    try {
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
    } catch (_) {}

    const produtosMap = {}
    try {
      const allProdutos = $app.findRecordsByFilter('produtos', 'id != ""', '', 0, 0)
      for (const p of allProdutos) {
        const codigo = p.getString('codigo')
        if (codigo) produtosMap[codigo] = p.id
      }
    } catch (_) {}

    const itensByNumero = {}
    for (const item of itens) {
      if (item === null || typeof item !== 'object') continue
      const num = item.numero
      if (num === undefined || num === null) continue
      const key = String(num)
      if (!itensByNumero[key]) itensByNumero[key] = []
      itensByNumero[key].push(item)
    }

    const parseNum = (v) => {
      if (v === undefined || v === null || v === '') return 0
      if (typeof v === 'number') return Number.isFinite(v) ? v : 0
      const s = String(v)
        .replace(/[^\d,.-]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
      const n = parseFloat(s)
      return Number.isFinite(n) ? n : 0
    }

    const parseIntSafe = (v) => {
      if (v === undefined || v === null || v === '') return 0
      if (typeof v === 'number') return Math.trunc(v)
      const n = parseInt(String(v).replace(/[^\d]/g, ''), 10)
      return Number.isFinite(n) ? n : 0
    }

    const normalizeStatus = (v) => {
      if (!v) return 'normal'
      const s = String(v).toLowerCase()
      if (s.indexOf('cancel') !== -1) return 'cancelado'
      return 'normal'
    }

    let total = 0
    let created = 0
    let updated = 0
    let skipped = 0
    let itemsInserted = 0
    const errors = []

    for (let i = 0; i < pedidos.length; i++) {
      const p = pedidos[i]
      if (p === null || typeof p !== 'object') {
        skipped++
        errors.push({ index: i, reason: 'Pedido inválido (não é um objeto)' })
        continue
      }
      total++

      const numero = parseIntSafe(p.numero)
      if (!numero) {
        skipped++
        errors.push({ index: i, reason: 'NUMERO ausente ou inválido' })
        continue
      }

      let pedido
      let isNew = false
      try {
        pedido = $app.findFirstRecordByFilter('pedidos', 'numero = {:n}', {
          n: numero,
        })
      } catch (_) {
        pedido = new Record(pedidosCol)
        isNew = true
      }

      if (isNew) {
        pedido.set('numero', numero)
      }

      if (p.data !== undefined && p.data !== null && p.data !== '') {
        pedido.set('data', p.data)
      }
      if (p.codigo_cliente !== undefined) {
        pedido.set('codigo_cliente', parseIntSafe(p.codigo_cliente))
      }
      if (p.cliente_id !== undefined && p.cliente_id !== null && p.cliente_id !== '') {
        pedido.set('cliente_id', p.cliente_id)
      } else {
        const codigoCliente = parseIntSafe(p.codigo_cliente)
        const clienteMatch = codigoCliente ? clientesMap[codigoCliente] : null
        if (clienteMatch) {
          pedido.set('cliente_id', clienteMatch.id)
          const nome = clienteMatch.descricao || clienteMatch.fantasia || ''
          if (nome) pedido.set('cliente_nome', nome)
        } else if (p.cliente_nome !== undefined && p.cliente_nome !== null) {
          pedido.set('cliente_nome', String(p.cliente_nome || ''))
        } else {
          pedido.set('cliente_nome', '')
        }
      }
      if (p.cliente_nome !== undefined && p.cliente_nome !== null) {
        pedido.set('cliente_nome', String(p.cliente_nome || ''))
      }
      if (p.vendedor !== undefined) {
        pedido.set('vendedor', parseIntSafe(p.vendedor))
      }
      if (p.cp !== undefined) {
        pedido.set('cp', p.cp || '')
      }
      if (p.valor_pedido !== undefined) {
        pedido.set('valor_pedido', parseNum(p.valor_pedido))
      }
      if (p.entrada_dinheiro !== undefined) {
        pedido.set('entrada_dinheiro', parseNum(p.entrada_dinheiro))
      }
      if (p.entrada_pix !== undefined) {
        pedido.set('entrada_pix', parseNum(p.entrada_pix))
      }
      if (p.entrada_cartao !== undefined) {
        pedido.set('entrada_cartao', parseNum(p.entrada_cartao))
      }
      if (p.valor_aprazo !== undefined) {
        pedido.set('valor_aprazo', parseNum(p.valor_aprazo))
      }
      if (p.qtd_itens !== undefined) {
        pedido.set('qtd_itens', parseIntSafe(p.qtd_itens))
      }
      if (p.frete !== undefined) {
        pedido.set('frete', parseNum(p.frete))
      }
      if (p.status !== undefined) {
        pedido.set('status', normalizeStatus(p.status))
      }
      if (p.total_mercadorias !== undefined) {
        pedido.set('total_mercadorias', parseNum(p.total_mercadorias))
      }
      if (p.desconto_acrescimo !== undefined) {
        pedido.set('desconto_acrescimo', parseNum(p.desconto_acrescimo))
      }

      try {
        $app.save(pedido)
      } catch (saveErr) {
        skipped++
        errors.push({
          index: i,
          numero,
          reason: saveErr.message || 'Erro ao salvar pedido',
        })
        continue
      }

      const pedidoId = pedido.id

      try {
        const existing = $app.findRecordsByFilter(
          'pedido_itens',
          'pedido_id = {:pid}',
          '-created',
          1000,
          0,
          { pid: pedidoId },
        )
        for (const oldItem of existing) {
          try {
            $app.delete(oldItem)
          } catch (_) {}
        }
      } catch (_) {}

      const novosItens = itensByNumero[String(numero)] || []
      for (const item of novosItens) {
        try {
          const itemRecord = new Record(itensCol)
          itemRecord.set('pedido_id', pedidoId)
          itemRecord.set('codigo_produto', item.codigo_produto || '')

          if (item.produto_id !== undefined && item.produto_id !== null && item.produto_id !== '') {
            itemRecord.set('produto_id', item.produto_id)
          } else {
            const codigoProduto = item.codigo_produto ? String(item.codigo_produto) : ''
            const produtoMatch = codigoProduto ? produtosMap[codigoProduto] : null
            if (produtoMatch) {
              itemRecord.set('produto_id', produtoMatch)
            }
          }

          itemRecord.set('descricao', item.descricao || '')
          itemRecord.set('unidade', item.unidade || '')
          itemRecord.set('quantidade', parseNum(item.quantidade))
          itemRecord.set('valor_unitario', parseNum(item.valor_unitario))
          itemRecord.set('valor_total', parseNum(item.valor_total))
          $app.save(itemRecord)
          itemsInserted++
        } catch (itemErr) {
          errors.push({
            index: i,
            numero,
            reason: 'Erro ao salvar item: ' + (itemErr.message || ''),
          })
        }
      }

      if (isNew) created++
      else updated++
    }

    return e.json(200, {
      total,
      created,
      updated,
      skipped,
      itemsInserted,
      errors,
    })
  },
  $apis.requireAuth(),
)
