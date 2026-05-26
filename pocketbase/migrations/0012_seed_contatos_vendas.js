migrate(
  (app) => {
    const clientes = app.findCollectionByNameOrId('clientes')
    const contatos = app.findCollectionByNameOrId('contatos')

    let admin
    try {
      admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ferroeacoeldorado@hotmail.com')
    } catch (e) {
      return
    }

    let cliente
    try {
      cliente = app.findFirstRecordByFilter('clientes', '')
    } catch (e) {
      cliente = new Record(clientes)
      cliente.set('descricao', 'Cliente Exemplo')
      cliente.set('cnpj_cpf', '00.000.000/0001-00')
      app.save(cliente)
    }

    const data = [
      {
        tipo: 'visita_presencial',
        resultado: 'Visitado com sucesso',
        teve_pedido: true,
        valor_pedido: 1500.5,
        status_aprovacao: 'aprovado',
      },
      {
        tipo: 'visita_presencial',
        resultado: 'Visitado com sucesso',
        teve_pedido: true,
        valor_pedido: 2800.0,
        status_aprovacao: 'aprovado',
      },
      {
        tipo: 'telefone',
        resultado: 'Não estava',
        teve_pedido: false,
        valor_pedido: 0,
        status_aprovacao: 'aprovado',
      },
      {
        tipo: 'visita_presencial',
        resultado: 'Tentou mas não encontrou',
        teve_pedido: false,
        valor_pedido: 0,
        status_aprovacao: 'pendente',
        past: true,
      },
      {
        tipo: 'telefone',
        resultado: 'Outro',
        descricao: 'Ligação caiu',
        teve_pedido: false,
        valor_pedido: 0,
        status_aprovacao: 'aprovado',
      },
    ]

    for (const item of data) {
      try {
        const record = new Record(contatos)
        record.set('usuario_id', admin.id)
        record.set('cliente_id', cliente.id)
        record.set('tipo', item.tipo)
        record.set('resultado', item.resultado)
        record.set('teve_pedido', item.teve_pedido)
        record.set('valor_pedido', item.valor_pedido)
        record.set('status_aprovacao', item.status_aprovacao)
        if (item.descricao) record.set('descricao', item.descricao)

        const d = new Date()
        if (item.past) d.setDate(d.getDate() - 2)
        record.set('data_contato', d.toISOString().replace('T', ' '))

        app.save(record)
      } catch (e) {}
    }
  },
  (app) => {},
)
