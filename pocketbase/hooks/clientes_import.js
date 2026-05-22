routerAdd(
  'POST',
  '/backend/v1/clientes/import',
  (e) => {
    const body = e.requestInfo().body

    if (!body || !body.fileText) {
      return e.badRequestError('Arquivo não enviado na requisição.')
    }

    const text = body.fileText

    // Basic CSV parser
    const parseCSV = (str) => {
      const result = []
      let row = []
      let inQuotes = false
      let val = ''
      for (let i = 0; i < str.length; i++) {
        const char = str[i]
        if (inQuotes) {
          if (char === '"') {
            if (i + 1 < str.length && str[i + 1] === '"') {
              val += '"'
              i++
            } else {
              inQuotes = false
            }
          } else {
            val += char
          }
        } else {
          if (char === '"') {
            inQuotes = true
          } else if (char === ',' || char === ';') {
            // support both comma and semicolon
            row.push(val)
            val = ''
          } else if (char === '\n' || char === '\r') {
            row.push(val)
            val = ''
            // Only push row if it has content (avoids empty lines)
            if (row.some((c) => c !== '')) result.push(row)
            row = []
            if (char === '\r' && i + 1 < str.length && str[i + 1] === '\n') {
              i++
            }
          } else {
            val += char
          }
        }
      }
      if (val !== '' || row.length > 0) {
        row.push(val)
        if (row.some((c) => c !== '')) result.push(row)
      }
      return result
    }

    const parsed = parseCSV(text)
    if (parsed.length < 2) {
      return e.badRequestError('Planilha vazia ou sem cabeçalhos.')
    }

    const headers = parsed[0].map((h) => h.trim().toLowerCase())
    const rows = parsed.slice(1).map((row) => {
      const obj = {}
      headers.forEach((h, i) => {
        obj[h] = row[i] ? row[i].trim() : ''
      })
      return obj
    })

    let created = 0
    let skipped = 0
    let errors = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      const getVal = (keys) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
            return row[k]
          }
        }
        return ''
      }

      const descricao = getVal(['descricao', 'descricao_', 'nome'])
      const fantasia = getVal(['fantasia', 'fantasia_'])
      let cnpj_cpf = getVal(['cnpj_cpf', 'cnpj', 'cpf', 'cnpj_cpf_'])
      cnpj_cpf = String(cnpj_cpf).replace(/\D/g, '')

      const codigo = getVal(['codigo', 'codigo_'])
      const insc_estadual = getVal(['insc_estadual', 'ie', 'insc_estadual_'])
      const fone = getVal(['fone', 'telefone', 'fone_'])
      const celular = getVal(['celular', 'celular_'])
      const email = getVal(['email'])
      const endereco = getVal(['endereco', 'endereco_'])
      const bairro = getVal(['bairro', 'bairro_'])
      const cidade = getVal(['cidade', 'cidade_'])
      const uf = getVal(['uf'])
      const cep = getVal(['cep', 'cep_'])
      const tipo = getVal(['tipo'])
      const vendedor = getVal(['vendedor'])
      const status = getVal(['status'])

      if (!descricao) {
        errors.push({ row: i + 2, reason: 'Descrição (nome) é obrigatória' })
        skipped++
        continue
      }

      if (!cnpj_cpf) {
        errors.push({ row: i + 2, reason: 'CNPJ/CPF é obrigatório' })
        skipped++
        continue
      }

      try {
        let existingRecord
        try {
          existingRecord = $app.findFirstRecordByData('clientes', 'cnpj_cpf', cnpj_cpf)
        } catch (err) {}

        if (existingRecord) {
          skipped++
          errors.push({ row: i + 2, reason: `CNPJ/CPF ${cnpj_cpf} já existe` })
        } else {
          const collection = $app.findCollectionByNameOrId('clientes')
          const newRecord = new Record(collection)

          newRecord.set('descricao', String(descricao))
          newRecord.set('fantasia', String(fantasia))
          newRecord.set('cnpj_cpf', cnpj_cpf)
          newRecord.set('insc_estadual', String(insc_estadual))
          newRecord.set('fone', String(fone))
          newRecord.set('celular', String(celular))

          const emailStr = String(email)
          if (emailStr && emailStr.includes('@')) {
            newRecord.set('email', emailStr)
          }

          newRecord.set('endereco', String(endereco))
          newRecord.set('bairro', String(bairro))
          newRecord.set('cidade', String(cidade))
          newRecord.set('uf', String(uf).substring(0, 2).toUpperCase())
          newRecord.set('cep', String(cep))
          newRecord.set('tipo', String(tipo))
          newRecord.set('status', String(status) || 'ativo')

          if (codigo) {
            const num = Number(codigo)
            if (!isNaN(num)) newRecord.set('codigo', num)
          }

          if (vendedor) {
            const vendedorNum = Number(vendedor)
            if (!isNaN(vendedorNum)) {
              newRecord.set('vendedor', vendedorNum)
            }
          }

          $app.save(newRecord)
          created++
        }
      } catch (err) {
        skipped++
        errors.push({ row: i + 2, reason: err.message || 'Erro ao salvar no banco' })
      }
    }

    try {
      const auditCollection = $app.findCollectionByNameOrId('audit_logs')
      const auditRecord = new Record(auditCollection)
      auditRecord.set('usuario_id', e.auth?.id || '')
      auditRecord.set(
        'usuario_nome',
        e.auth ? e.auth.getString('name') || e.auth.getString('email') : 'Sistema',
      )
      auditRecord.set('acao', 'importacao_clientes_csv')
      auditRecord.set('detalhes', {
        total_linhas: rows.length,
        sucesso: created,
        ignorados: skipped,
        erros: errors.length,
      })
      $app.save(auditRecord)
    } catch (auditErr) {
      $app
        .logger()
        .error('Erro ao registrar log de auditoria na importacao', 'erro', auditErr.message)
    }

    return e.json(200, {
      total: rows.length,
      created,
      skipped,
      errors,
    })
  },
  $apis.requireAuth(),
)
