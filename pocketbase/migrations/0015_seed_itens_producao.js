migrate(
  (app) => {
    const seeds = [
      { nome: 'Armação tipo A', tipo: 'Armações', unidade: 'Unidades', status: true },
      { nome: 'Arame 1kg', tipo: 'Arame 1kg', unidade: 'Rolos', status: true },
      { nome: 'Corte e dobra', tipo: 'Corte e dobra', unidade: 'Kg', status: true },
      { nome: 'Barras 6m', tipo: 'Barras 6m', unidade: 'Barras', status: true },
      { nome: 'Barras 12m', tipo: 'Barras 12m', unidade: 'Barras', status: true },
    ]

    const col = app.findCollectionByNameOrId('itens_producao')

    for (let i = 0; i < seeds.length; i++) {
      const item = seeds[i]
      try {
        app.findFirstRecordByData('itens_producao', 'nome', item.nome)
      } catch (_) {
        const record = new Record(col)
        record.set('nome', item.nome)
        record.set('tipo', item.tipo)
        record.set('unidade', item.unidade)
        record.set('status', item.status)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('itens_producao')
      app.truncateCollection(col)
    } catch (_) {}
  },
)
