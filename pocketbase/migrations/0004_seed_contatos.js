migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let admin
    try {
      admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ferroeacoeldorado@hotmail.com')
    } catch (_) {
      return // skip if no admin
    }

    const clientes = app.findCollectionByNameOrId('clientes')
    const contatos = app.findCollectionByNameOrId('contatos')

    const seedClientes = [
      { descricao: '3B LTDA', cnpj_cpf: '00000000000101', codigo: 'CLI-001' },
      { descricao: 'COM. RIBEIRO', cnpj_cpf: '00000000000102', codigo: 'CLI-002' },
      { descricao: 'FERRAGISTA BORJAO', cnpj_cpf: '00000000000103', codigo: 'CLI-003' },
    ]

    const createdClientes = {}

    for (const c of seedClientes) {
      let rec
      try {
        rec = app.findFirstRecordByData('clientes', 'cnpj_cpf', c.cnpj_cpf)
      } catch (_) {
        rec = new Record(clientes)
        rec.set('descricao', c.descricao)
        rec.set('cnpj_cpf', c.cnpj_cpf)
        rec.set('codigo', c.codigo)
        app.save(rec)
      }
      createdClientes[c.descricao] = rec
    }

    const seedContatos = [
      {
        cliente: '3B LTDA',
        tipo: 'whatsapp',
        data: '2024-12-01 14:30:00.000Z',
        descricao: 'Cliente solicitou orçamento para 50 toneladas de vergalhão',
        resultado: 'sucesso',
      },
      {
        cliente: 'COM. RIBEIRO',
        tipo: 'visita',
        data: '2024-11-28 10:00:00.000Z',
        descricao: 'Visita de prospecção, cliente interessado em treliças',
        resultado: 'pendente',
      },
      {
        cliente: 'FERRAGISTA BORJAO',
        tipo: 'email',
        data: '2024-11-25 09:15:00.000Z',
        descricao: 'Envio de proposta comercial',
        resultado: 'sucesso',
      },
    ]

    for (const s of seedContatos) {
      try {
        app.findFirstRecordByData('contatos', 'descricao', s.descricao)
      } catch (_) {
        const rec = new Record(contatos)
        rec.set('cliente_id', createdClientes[s.cliente].id)
        rec.set('usuario_id', admin.id)
        rec.set('tipo', s.tipo)
        rec.set('data_contato', s.data)
        rec.set('descricao', s.descricao)
        rec.set('resultado', s.resultado)
        app.save(rec)
      }
    }
  },
  (app) => {
    // empty down
  },
)
