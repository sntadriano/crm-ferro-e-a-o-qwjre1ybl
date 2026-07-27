migrate(
  (app) => {
    const vendedores = app.findCollectionByNameOrId('vendedores')

    const legacyCodes = [5, 6, 10, 11, 999]
    for (const codigo of legacyCodes) {
      let rec
      try {
        rec = app.findFirstRecordByData('vendedores', 'codigo', codigo)
      } catch (_) {
        rec = new Record(vendedores)
        rec.set('codigo', codigo)
      }
      rec.set('nome', 'Escritório')
      app.save(rec)
    }

    const newCodes = [5, 6, 10, 11, 999]

    const mergeCodes = (existing) => {
      const arr = Array.isArray(existing) ? existing.slice() : []
      for (const c of newCodes) {
        if (arr.indexOf(c) === -1) arr.push(c)
      }
      return arr
    }

    const adrianoRecords = app.findRecordsByFilter(
      'users',
      "name ?~ 'Adriano' && role = 'admin'",
      '',
      1,
      0,
    )
    if (adrianoRecords.length > 0) {
      const record = adrianoRecords[0]
      const existing = record.get('codigos_vendedor')
      const base = Array.isArray(existing) ? existing.slice() : []
      for (const c of [1, 3]) {
        if (base.indexOf(c) === -1) base.push(c)
      }
      for (const c of newCodes) {
        if (base.indexOf(c) === -1) base.push(c)
      }
      record.set('codigos_vendedor', base)
      record.set('active', true)
      app.save(record)
    }

    const juliaRecords = app.findRecordsByFilter('users', "name ?~ 'Julia'", '', 1, 0)
    if (juliaRecords.length > 0) {
      const record = juliaRecords[0]
      record.set('codigos_vendedor', mergeCodes(record.get('codigos_vendedor')))
      record.set('active', true)
      app.save(record)
    }

    const alexRecords = app.findRecordsByFilter('users', "name ?~ 'Alex'", '', 1, 0)
    if (alexRecords.length > 0) {
      const record = alexRecords[0]
      record.set('codigos_vendedor', mergeCodes(record.get('codigos_vendedor')))
      record.set('active', true)
      app.save(record)
    }
  },
  (app) => {
    const legacyCodes = [5, 6, 10, 11, 999]
    for (const codigo of legacyCodes) {
      try {
        const rec = app.findFirstRecordByData('vendedores', 'codigo', codigo)
        app.delete(rec)
      } catch (_) {}
    }

    const stripCodes = (existing) => {
      const arr = Array.isArray(existing) ? existing.slice() : []
      return arr.filter((n) => legacyCodes.indexOf(n) === -1)
    }

    const adrianoRecords = app.findRecordsByFilter(
      'users',
      "name ?~ 'Adriano' && role = 'admin'",
      '',
      1,
      0,
    )
    if (adrianoRecords.length > 0) {
      const record = adrianoRecords[0]
      const filtered = stripCodes(record.get('codigos_vendedor'))
      const base = filtered.filter((n) => [1, 3].indexOf(n) !== -1)
      const result = []
      for (const c of [1, 3]) {
        if (base.indexOf(c) === -1) result.push(c)
      }
      record.set('codigos_vendedor', result.length > 0 ? result : [1, 3])
      app.save(record)
    }

    const juliaRecords = app.findRecordsByFilter('users', "name ?~ 'Julia'", '', 1, 0)
    if (juliaRecords.length > 0) {
      const record = juliaRecords[0]
      record.set('codigos_vendedor', stripCodes(record.get('codigos_vendedor')))
      app.save(record)
    }

    const alexRecords = app.findRecordsByFilter('users', "name ?~ 'Alex'", '', 1, 0)
    if (alexRecords.length > 0) {
      const record = alexRecords[0]
      record.set('codigos_vendedor', stripCodes(record.get('codigos_vendedor')))
      app.save(record)
    }
  },
)
