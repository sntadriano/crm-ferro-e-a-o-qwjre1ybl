migrate(
  (app) => {
    const contatosCol = app.findCollectionByNameOrId('contatos')
    const clientesCol = app.findCollectionByNameOrId('clientes')

    const getOrCreateCliente = (nome) => {
      try {
        return app.findFirstRecordByData('clientes', 'descricao', nome)
      } catch (_) {
        const record = new Record(clientesCol)
        record.set('descricao', nome)
        record.set('cnpj_cpf', '00000000000' + Math.floor(Math.random() * 1000))
        record.set('status', 'Ativo')
        record.set('tipo', 'J')
        app.save(record)
        return record
      }
    }

    const c1 = getOrCreateCliente('3B LTDA')
    const c2 = getOrCreateCliente('COM. RIBEIRO')
    const c3 = getOrCreateCliente('FERRAGISTA BORJAO')

    const seedContato = (cliente, tipo, data_contato, descricao, resultado) => {
      try {
        app.findFirstRecordByData('contatos', 'descricao', descricao)
      } catch (_) {
        const record = new Record(contatosCol)
        record.set('cliente_id', cliente.id)
        record.set('tipo', tipo)
        record.set('data_contato', data_contato)
        record.set('descricao', descricao)
        record.set('resultado', resultado)

        try {
          const admin = app.findFirstRecordByFilter('_pb_users_auth_', "role = 'admin'")
          record.set('usuario_id', admin.id)
        } catch (e) {}

        app.save(record)
      }
    }

    seedContato(
      c1,
      'whatsapp',
      '2024-12-01 14:30:00.000Z',
      'Cliente solicitou orçamento para 50 toneladas de vergalhão',
      'sucesso',
    )
    seedContato(
      c2,
      'visita',
      '2024-11-28 10:00:00.000Z',
      'Visita de prospecção, cliente interessado em treliças',
      'pendente',
    )
    seedContato(c3, 'email', '2024-11-25 09:15:00.000Z', 'Envio de proposta comercial', 'sucesso')
  },
  (app) => {
    try {
      const contatosCol = app.findCollectionByNameOrId('contatos')
      app
        .db()
        .newQuery(
          "DELETE FROM contatos WHERE descricao IN ('Cliente solicitou orçamento para 50 toneladas de vergalhão', 'Visita de prospecção, cliente interessado em treliças', 'Envio de proposta comercial')",
        )
        .execute()
    } catch (e) {}
  },
)
