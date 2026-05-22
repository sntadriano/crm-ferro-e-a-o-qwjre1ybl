routerAdd(
  'POST',
  '/backend/v1/clientes/import',
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

    const idxCodigo = findCol(['CODIGO'])
    const idxDescricao = findCol(['DESCRICAO', 'NOME', 'CLIENTE', 'RAZAO SOCIAL'])
    const idxFantasia = findCol(['FANTASIA', 'NOME FANTASIA'])
    const idxEndereco = findCol(['ENDERECO', 'RUA', 'LOGRADOURO'])
    const idxBairro = findCol(['BAIRRO'])
    const idxCidade = findCol(['CIDADE', 'MUNICIPIO'])
    const idxUf = findCol(['UF', 'ESTADO'])
    const idxCep = findCol(['CEP'])
    const idxFone = findCol(['FONE', 'TELEFONE', 'TELEFONE1'])
    const idxCelular = findCol(['CELULAR', 'TELEFONE2', 'WHATSAPP'])
    const idxVendedor = findCol(['VENDEDOR', 'COD VENDEDOR'])
    const idxCadastro = findCol(['CADASTRO', 'DATA CADASTRO', 'CRIADO EM'])
    const idxTipo = findCol(['TIPO', 'TIPO CLIENTE'])
    const idxCnpjCpf = findCol(['CNPJ/CPF', 'CNPJ CPF', 'CNPJ', 'CPF', 'CNPJ_CPF', 'DOCUMENTO'])
    const idxInscEstadual = findCol(['INSC ESTADUAL', 'IE', 'INSCRICAO ESTADUAL'])
    const idxEmail = findCol(['EMAIL', 'E-MAIL'])
    const idxStatus = findCol(['STATUS', 'SITUACAO'])

    if (idxDescricao === -1 || idxCnpjCpf === -1) {
      return e.badRequestError(`O arquivo deve conter as colunas 'DESCRICAO' e 'CNPJ/CPF'.`)
    }

    let total = 0
    let created = 0
    let updated = 0
    let skipped = 0
    const errors = []

    const col = $app.findCollectionByNameOrId('clientes')

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (
        !row ||
        row.length === 0 ||
        row.every((c) => c === undefined || c === null || String(c).trim() === '')
      )
        continue
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
        idx !== -1 && row[idx] !== undefined && row[idx] !== null && row[idx] !== ''
          ? String(row[idx]).trim()
          : ''

      const codigoVal = getValue(idxCodigo)
      const codigo = codigoVal ? parseInt(codigoVal.replace(/[^\d]/g, ''), 10) : 0
      const fantasia = getValue(idxFantasia)
      const endereco = getValue(idxEndereco)
      const bairro = getValue(idxBairro)
      const cidade = getValue(idxCidade)
      const uf = getValue(idxUf)
      const cep = getValue(idxCep)
      const fone = getValue(idxFone)
      const celular = getValue(idxCelular)
      const vendedorVal = getValue(idxVendedor)
      const vendedor = vendedorVal ? parseInt(vendedorVal.replace(/[^\d]/g, ''), 10) : 0
      const tipo = getValue(idxTipo)
      const insc_estadual = getValue(idxInscEstadual)
      const email = getValue(idxEmail)
      const status = getValue(idxStatus)

      let cadastroDate = ''
      if (idxCadastro !== -1 && row[idxCadastro]) {
        if (typeof row[idxCadastro] === 'number') {
          const date = new Date((row[idxCadastro] - 25569) * 86400 * 1000)
          cadastroDate = date.toISOString().replace('T', ' ').replace('Z', '000Z')
        } else {
          const s = String(row[idxCadastro]).trim()
          const parts = s.split('/')
          if (parts.length === 3) {
            cadastroDate = `${parts[2]}-${parts[1]}-${parts[0]} 12:00:00.000Z`
          } else if (s.match(/^\d{4}-\d{2}-\d{2}/)) {
            cadastroDate = s
          }
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
      if (status) record.set('status', status)
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
