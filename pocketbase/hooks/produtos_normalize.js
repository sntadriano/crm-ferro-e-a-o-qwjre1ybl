routerAdd(
  'POST',
  '/backend/v1/produtos/normalize-codes',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'admin') {
      return e.forbiddenError('Acesso restrito a administradores.')
    }

    var HYPHEN_PATTERN = /^\d+-\d+$/
    var normalize = function (s) {
      return String(s).replace(/-/g, '')
    }

    var allProdutos = $app.findRecordsByFilter('produtos', 'id != ""', 'codigo', 0, 0)

    var byFinalCode = {}
    var toUpdateProdutos = []

    for (var i = 0; i < allProdutos.length; i++) {
      var p = allProdutos[i]
      var codigo = p.getString('codigo')
      if (!codigo) continue
      var isHyphen = HYPHEN_PATTERN.test(codigo)
      var finalCode = isHyphen ? normalize(codigo) : codigo

      if (!byFinalCode[finalCode]) byFinalCode[finalCode] = []
      byFinalCode[finalCode].push({
        id: p.id,
        original: codigo,
        descricao: p.getString('descricao'),
      })

      if (isHyphen) toUpdateProdutos.push({ record: p, original: codigo, final: finalCode })
    }

    var collisions = []
    var keys = Object.keys(byFinalCode)
    for (var k = 0; k < keys.length; k++) {
      var fc = keys[k]
      var group = byFinalCode[fc]
      if (group.length > 1) {
        collisions.push({ normalized: fc, items: group })
      }
    }

    if (collisions.length > 0) {
      return e.json(200, {
        success: false,
        message: 'Colisão detectada. Migração não realizada para os registros conflitantes.',
        produtosUpdated: 0,
        itensUpdated: 0,
        collisions: collisions,
      })
    }

    var produtosUpdated = 0
    for (var j = 0; j < toUpdateProdutos.length; j++) {
      var item = toUpdateProdutos[j]
      try {
        item.record.set('codigo', item.final)
        $app.save(item.record)
        produtosUpdated++
      } catch (err) {
        // skip save errors
      }
    }

    var allItens = $app.findRecordsByFilter('pedido_itens', 'id != ""', '', 0, 0)
    var itensUpdated = 0
    for (var m = 0; m < allItens.length; m++) {
      var it = allItens[m]
      var codProd = it.getString('codigo_produto')
      if (!codProd || !HYPHEN_PATTERN.test(codProd)) continue
      try {
        it.set('codigo_produto', normalize(codProd))
        $app.save(it)
        itensUpdated++
      } catch (err) {
        // skip save errors
      }
    }

    return e.json(200, {
      success: true,
      message: 'Normalização concluída com sucesso.',
      produtosUpdated: produtosUpdated,
      itensUpdated: itensUpdated,
      collisions: [],
    })
  },
  $apis.requireAuth(),
)
