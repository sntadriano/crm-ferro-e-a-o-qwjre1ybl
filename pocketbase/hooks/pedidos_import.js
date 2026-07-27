routerAdd(
  'POST',
  '/backend/v1/pedidos/import',
  (e) => {
    const body = e.requestInfo().body
    let rows = []

    if (body.rows && Array.isArray(body.rows)) {
      rows = body.rows
    } else {
      return e.badRequestError('Formato inválido. Envie um CSV (rows).')
    }

    if (!rows || rows.length < 2) {
      return e.badRequestError('Arquivo vazio ou sem dados válidos.')
    }

    const normalizeHeader = (h) => {
      if (!h) return ''
      let s = String(h).toUpperCase().trim()
      const accents = {
        Á: 'A',
        À: 'A',
        Â: 'A',
        Ã: 'A',
        Ä: 'A',
        É: 'E',
        È: 'E',
        Ê: 'E',
        Ë: 'E',
        Í: 'I',
        Ì: 'I',
        Î: 'I',
        Ï: 'I',
        Ó: 'O',
        Ò: 'O',
        Ô: 'O',
        Õ: 'O',
        Ö: 'O',
        Ú: 'U',
        Ù: 'U',
        Û: 'U',
        Ü: 'U',
        Ç: 'C',
        Ñ: 'N',
      }
      return s
        .replace(/[ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ]/g, (m) => accents[m] || m)
        .replace(/[^A-Z0-9]/g, '')
    }

    const headerRow = rows[0].map(normalizeHeader)

    const findCol = (names) => {
      for (const name of names) {
        const idx = headerRow.indexOf(normalizeHeader(name))
        if (idx !== -1) return idx
      }
      return -1
    }

    const idxPedido = findCol(['NUMERO', 'PEDIDO', 'NUMERO PEDIDO', 'COD PEDIDO'])
    const idxData = findCol(['DATA', 'DATA PEDIDO', 'EMISSAO'])
    const idxCodigoCliente = findCol(['CODIGO CLIENTE', 'CLIENTE', 'CODIGO'])
    const idxVendedor = findCol(['VENDEDOR', 'COD VENDEDOR'])
    const idxCp = findCol(['CP', 'CONDICAO PAGAMENTO'])
    const idxValorPedido = findCol(['VALOR PEDIDO', 'VALOR'])
    const idxEntradaDinheiro = findCol(['ENTRADA DINHEIRO', 'ENTRADA'])
    const idxEntradaPix = findCol(['ENTRADA PIX', 'PIX'])
    const idxEntradaCartao = findCol(['ENTRADA CARTAO', 'CARTAO'])
    const idxValorAprazo = findCol(['VALOR APRAZO', 'APRAZO'])
    const idxQtdItens = findCol(['QTD ITENS', 'QTD', 'ITENS'])
    const idxFrete = findCol(['FRETE'])
    const idxStatus = findCol(['STATUS', 'SITUACAO'])
    const idxTotalMercadorias = findCol(['TOTAL MERCADORIAS', 'TOTAL'])
    const idxDescontoAcrescimo = findCol(['DESCONTO ACRESCIMO', 'DESCONTO'])

    if (idxPedido === -1) {
      return e.badRequestError(`O arquivo deve conter a coluna 'NUMERO'.`)
    }

    const pedidosCol = $app.findCollectionByNameOrId('pedidos')
    const itensCol = $app.findCollectionByNameOrId('pedido_itens')

    let total = 0
    let created = 0
    let updated = 0
    let skipped = 0
    const errors = []

    const parseNum = (v) => {
      if (v === undefined || v === null || v === '') return 0
      const s = String(v)
        .replace(/[^\d,.-]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
      const n = parseFloat(s)
      return Number.isFinite(n) ? n : 0
    }

    const parseDate = (raw) => {
      if (!raw && raw !== 0) return ''
      if (typeof raw === 'number') {
        const d = new Date((raw - 25569) * 86400 * 1000)
        return d.toISOString().replace('T', ' ').replace('Z', '000Z')
      }
      const s = String(raw).trim()
      const parts = s.split('/')
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]} 12:00:00.000Z`
      }
      if (s.match(/^\d{4}-\d{2}-\d{2}/)) return s
      return ''
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (
        !row ||
        row.length === 0 ||
        row.every((c) => c === undefined || c === null || String(c).trim() === '')
      ) {
        continue
      }
      total++

      const get = (idx) =>
        idx !== -1 && row[idx] !== undefined && row[idx] !== null && row[idx] !== ''
          ? String(row[idx]).trim()
          : ''

      const numeroRaw = get(idxPedido)
      if (!numeroRaw) {
        skipped++
        errors.push({ row: i + 1, reason: 'NUMERO ausente' })
        continue
      }
      const numero = parseInt(numeroRaw.replace(/[^\d]/g, ''), 10)
      if (!numero) {
        skipped++
        errors.push({ row: i + 1, reason: 'NUMERO inválido' })
        continue
      }

      const data = parseDate(idxData !== -1 ? row[idxData] : '')
      const codigoCliente = parseInt(get(idxCodigoCliente).replace(/[^\d]/g, ''), 10) || 0
      const vendedor = parseInt(get(idxVendedor).replace(/[^\d]/g, ''), 10) || 0
      const cp = get(idxCp)
      const valorPedido = parseNum(get(idxValorPedido))
      const entradaDinheiro = parseNum(get(idxEntradaDinheiro))
      const entradaPix = parseNum(get(idxEntradaPix))
      const entradaCartao = parseNum(get(idxEntradaCartao))
      const valorAprazo = parseNum(get(idxValorAprazo))
      const qtdItens = parseInt(get(idxQtdItens).replace(/[^\d]/g, ''), 10) || 0
      const frete = parseNum(get(idxFrete))
      const statusRaw = get(idxStatus).toLowerCase()
      const status = statusRaw.indexOf('cancel') !== -1 ? 'cancelado' : 'normal'
      const totalMercadorias = parseNum(get(idxTotalMercadorias))
      const descontoAcrescimo = parseNum(get(idxDescontoAcrescimo))

      let pedido
      let isNew = false
      try {
        pedido = $app.findFirstRecordByFilter('pedidos', 'numero = {:n}', { n: numero })
      } catch (_) {
        pedido = new Record(pedidosCol)
        isNew = true
      }

      pedido.set('numero', numero)
      if (data) pedido.set('data', data)
      if (codigoCliente) pedido.set('codigo_cliente', codigoCliente)
      if (vendedor) pedido.set('vendedor', vendedor)
      pedido.set('cp', cp)
      pedido.set('valor_pedido', valorPedido)
      pedido.set('entrada_dinheiro', entradaDinheiro)
      pedido.set('entrada_pix', entradaPix)
      pedido.set('entrada_cartao', entradaCartao)
      pedido.set('valor_aprazo', valorAprazo)
      pedido.set('qtd_itens', qtdItens)
      pedido.set('frete', frete)
      pedido.set('status', status)
      pedido.set('total_mercadorias', totalMercadorias)
      pedido.set('desconto_acrescimo', descontoAcrescimo)

      try {
        $app.save(pedido)
      } catch (saveErr) {
        skipped++
        errors.push({ row: i + 1, reason: saveErr.message || 'Erro ao salvar pedido' })
        continue
      }

      const pedidoId = pedido.id

      // Delete existing pedido_itens for this pedido (idempotent reimport)
      try {
        const existingItens = $app.findRecordsByFilter(
          'pedido_itens',
          'pedido_id = {:pid}',
          '-created',
          1000,
          0,
          { pid: pedidoId },
        )
        for (const item of existingItens) {
          try {
            $app.delete(item)
          } catch (_) {}
        }
      } catch (_) {}

      // Items provided inline via "itens" array on the row
      const itensRaw =
        body.itens && Array.isArray(body.itens) && body.itens[i - 1]
          ? body.itens[i - 1]
          : row.__itens || null

      if (itensRaw && Array.isArray(itensRaw)) {
        for (const item of itensRaw) {
          try {
            const itemRecord = new Record(itensCol)
            itemRecord.set('pedido_id', pedidoId)
            itemRecord.set('codigo_produto', item.codigo_produto || '')
            itemRecord.set('descricao', item.descricao || '')
            itemRecord.set('unidade', item.unidade || '')
            itemRecord.set('quantidade', parseFloat(item.quantidade) || 0)
            itemRecord.set('valor_unitario', parseFloat(item.valor_unitario) || 0)
            itemRecord.set('valor_total', parseFloat(item.valor_total) || 0)
            $app.save(itemRecord)
          } catch (itemErr) {
            errors.push({
              row: i + 1,
              reason: 'Erro ao salvar item: ' + (itemErr.message || ''),
            })
          }
        }
      }

      if (isNew) created++
      else updated++
    }

    return e.json(200, { total, created, updated, skipped, errors })
  },
  $apis.requireAuth(),
)
