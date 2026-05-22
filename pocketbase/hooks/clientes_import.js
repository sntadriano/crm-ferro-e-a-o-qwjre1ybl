routerAdd(
  'POST',
  '/backend/v1/clientes/import',
  (e) => {
    const body = e.requestInfo().body

    if (!body.rows || !Array.isArray(body.rows)) {
      return e.badRequestError('Arquivo não enviado ou formato inválido.')
    }

    const rows = body.rows
    if (rows.length < 2) {
      return e.badRequestError('Arquivo vazio ou sem dados.')
    }

    const headerRow = rows[0].map((h) => (h ? String(h).toUpperCase().trim() : ''))

    const idxCodigo = headerRow.indexOf('CODIGO')
    const idxDescricao = headerRow.indexOf('DESCRICAO')
    const idxFantasia = headerRow.indexOf('FANTASIA')
    const idxEndereco = headerRow.indexOf('ENDERECO')
    const idxBairro = headerRow.indexOf('BAIRRO')
    const idxCidade = headerRow.indexOf('CIDADE')
    const idxUf = headerRow.indexOf('UF')
    const idxCep = headerRow.indexOf('CEP')
    const idxFone = headerRow.indexOf('FONE')
    const idxCelular = headerRow.indexOf('CELULAR')
    const idxVendedor = headerRow.indexOf('VENDEDOR')
    const idxCadastro = headerRow.indexOf('CADASTRO')
    const idxTipo = headerRow.indexOf('TIPO')
    const idxCnpjCpf = headerRow.indexOf('CNPJ/CPF')
    const idxInscEstadual = headerRow.indexOf('INSC ESTADUAL')
    const idxEmail = headerRow.indexOf('EMAIL')

    if (idxDescricao === -1 || idxCnpjCpf === -1) {
      return e.badRequestError('O arquivo deve conter as colunas DESCRICAO e CNPJ/CPF.')
    }

    let total = 0
    let created = 0
    let updated = 0
    let skipped = 0
    const errors = []

    const col = $app.findCollectionByNameOrId('clientes')

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0 || row.every((c) => !c)) continue
      total++

      const rawDescricao = idxDescricao !== -1 ? row[idxDescricao] : ''
      const rawCnpjCpf = idxCnpjCpf !== -1 ? row[idxCnpjCpf] : ''

      let descricao = rawDescricao ? String(rawDescricao).trim() : ''
      let cnpj_cpf_raw = rawCnpjCpf ? String(rawCnpjCpf).trim() : ''

      if (!descricao || !cnpj_cpf_raw) {
        skipped++
        errors.push({ row: i + 1, reason: 'DESCRICAO ou CNPJ/CPF ausente' })
        continue
      }

      const cnpj_cpf = cnpj_cpf_raw.replace(/[^\d]/g, '')
      if (!cnpj_cpf) {
        skipped++
        errors.push({ row: i + 1, reason: 'CNPJ/CPF inválido após limpeza' })
        continue
      }

      const getValue = (idx) =>
        idx !== -1 && row[idx] !== undefined && row[idx] !== '' ? String(row[idx]).trim() : ''

      const codigoVal = getValue(idxCodigo)
      const codigo = codigoVal ? parseInt(codigoVal, 10) : 0
      const fantasia = getValue(idxFantasia)
      const endereco = getValue(idxEndereco)
      const bairro = getValue(idxBairro)
      const cidade = getValue(idxCidade)
      const uf = getValue(idxUf)
      const cep = getValue(idxCep)
      const fone = getValue(idxFone)
      const celular = getValue(idxCelular)
      const vendedorVal = getValue(idxVendedor)
      const vendedor = vendedorVal ? parseInt(vendedorVal, 10) : 0
      const tipo = getValue(idxTipo)
      const insc_estadual = getValue(idxInscEstadual)
      const email = getValue(idxEmail)

      let cadastroDate = ''
      if (idxCadastro !== -1 && row[idxCadastro]) {
        const s = String(row[idxCadastro]).trim()
        const parts = s.split('/')
        if (parts.length === 3) {
          cadastroDate = `${parts[2]}-${parts[1]}-${parts[0]} 12:00:00.000Z`
        } else if (s.match(/^\d{4}-\d{2}-\d{2}/)) {
          cadastroDate = s
        }
      }

      let record
      let isNew = false
      try {
        record = $app.findFirstRecordByFilter('clientes', 'cnpj_cpf = {:cnpj}', { cnpj: cnpj_cpf })
      } catch (_) {
        record = new Record(col)
        isNew = true
      }

      if (codigo) record.set('codigo', codigo)
      record.set('descricao', descricao)
      record.set('fantasia', fantasia)
      record.set('cnpj_cpf', cnpj_cpf)
      record.set('insc_estadual', insc_estadual)
      record.set('fone', fone)
      record.set('celular', celular)
      if (email) record.set('email', email)
      record.set('endereco', endereco)
      record.set('bairro', bairro)
      record.set('cidade', cidade)
      record.set('uf', uf)
      record.set('cep', cep)
      record.set('tipo', tipo)
      if (vendedor) record.set('vendedor', vendedor)
      if (cadastroDate) {
        try {
          record.set('cadastro', cadastroDate)
        } catch (e) {}
      }

      try {
        $app.save(record)
        if (isNew) created++
        else updated++
      } catch (saveErr) {
        skipped++
        errors.push({ row: i + 1, reason: saveErr.message || 'Erro de validação ao salvar' })
      }
    }

    return e.json(200, { total, created, updated, skipped, errors })
  },
  $apis.requireAuth(),
)
