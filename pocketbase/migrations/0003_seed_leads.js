migrate(
  (app) => {
    const clientes = app.findCollectionByNameOrId('clientes')
    const leads = app.findCollectionByNameOrId('leads')
    const users = app.findCollectionByNameOrId('users')

    let admin = null
    try {
      admin = app.findFirstRecordByData('users', 'email', 'ferroeacoeldorado@hotmail.com')
    } catch (_) {
      // skip if no admin found to assign
    }

    const ensureCliente = (nome, uniqueId) => {
      try {
        return app.findFirstRecordByData('clientes', 'descricao', nome)
      } catch (_) {
        const record = new Record(clientes)
        record.set('descricao', nome)
        record.set('codigo', uniqueId)
        record.set('cnpj_cpf', uniqueId.toString())
        app.save(record)
        return record
      }
    }

    const ts = Math.floor(Date.now() / 1000)
    const c1 = ensureCliente('3B LTDA', ts + 1)
    const c2 = ensureCliente('COM. RIBEIRO', ts + 2)
    const c3 = ensureCliente('FERRAGISTA BORJAO', ts + 3)

    const seedLead = (cliente, status, valor, data, followup) => {
      try {
        app.findFirstRecordByData('leads', 'cliente_id', cliente.id)
      } catch (_) {
        const record = new Record(leads)
        record.set('cliente_id', cliente.id)
        if (admin) {
          record.set('usuario_id', admin.id)
        }
        record.set('status', status)
        record.set('valor_estimado', valor)
        record.set('data_criacao', data)
        record.set('proximo_followup', followup)
        app.save(record)
      }
    }

    seedLead(c1, 'novo', 15000, '2024-12-01 12:00:00.000Z', '2024-12-10 12:00:00.000Z')
    seedLead(c2, 'proposta_enviada', 8500, '2024-11-28 12:00:00.000Z', '2024-12-05 12:00:00.000Z')
    seedLead(c3, 'fechado', 22000, '2024-11-15 12:00:00.000Z', '2024-12-15 12:00:00.000Z')
  },
  (app) => {
    // no-op down migration
  },
)
