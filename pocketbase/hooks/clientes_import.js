// @deps xlsx@0.18.5
routerAdd(
  'POST',
  '/backend/v1/clientes/import',
  (e) => {
    const xlsx = require('xlsx')
    const body = e.requestInfo().body

    if (!body || !body.fileBase64) {
      return e.badRequestError('Arquivo não enviado na requisição.')
    }

    let workbook
    try {
      workbook = xlsx.read(body.fileBase64, { type: 'base64' })
    } catch (err) {
      return e.badRequestError('Falha ao ler o arquivo Excel. Verifique o formato.')
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return e.badRequestError('Planilha vazia.')
    }

    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' })

    let created = 0
    let skipped = 0
    let errors = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Helper to read multiple possible column names
      const getVal = (keys) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
            return row[k]
          }
        }
        return ''
      }

      const descricao = getVal([
        'descricao',
        'Descricao',
        'DESCRICAO',
        'descricao_',
        'nome',
        'Nome',
        'NOME',
      ])
      const fantasia = getVal(['fantasia', 'Fantasia', 'FANTASIA', 'fantasia_'])
      let cnpj_cpf = getVal([
        'cnpj_cpf',
        'CNPJ_CPF',
        'CnpjCpf',
        'CNPJ',
        'CPF',
        'cnpj_cpf_',
        'cnpj',
        'cpf',
      ])
      cnpj_cpf = String(cnpj_cpf).replace(/\D/g, '')

      const codigo = getVal(['codigo', 'Codigo', 'CODIGO', 'codigo_'])
      const insc_estadual = getVal([
        'insc_estadual',
        'InscEstadual',
        'INSC_ESTADUAL',
        'insc_estadual_',
        'ie',
        'IE',
      ])
      const fone = getVal(['fone', 'Fone', 'FONE', 'telefone', 'Telefone', 'fone_'])
      const celular = getVal(['celular', 'Celular', 'CELULAR', 'celular_'])
      const email = getVal(['email', 'Email', 'EMAIL'])
      const endereco = getVal(['endereco', 'Endereco', 'ENDERECO', 'endereco_'])
      const bairro = getVal(['bairro', 'Bairro', 'BAIRRO', 'bairro_'])
      const cidade = getVal(['cidade', 'Cidade', 'CIDADE', 'cidade_'])
      const uf = getVal(['uf', 'Uf', 'UF'])
      const cep = getVal(['cep', 'Cep', 'CEP', 'cep_'])
      const tipo = getVal(['tipo', 'Tipo', 'TIPO'])
      const vendedor = getVal(['vendedor', 'Vendedor', 'VENDEDOR'])
      const status = getVal(['status', 'Status', 'STATUS'])

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
        } catch (err) {
          // Not found
        }

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
      auditRecord.set('usuario_id', e.auth.id || '')
      auditRecord.set(
        'usuario_nome',
        e.auth ? e.auth.getString('name') || e.auth.getString('email') : 'Sistema',
      )
      auditRecord.set('acao', 'importacao_clientes_excel')
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
