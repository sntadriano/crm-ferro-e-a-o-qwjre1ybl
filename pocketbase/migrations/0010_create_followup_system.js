migrate(
  (app) => {
    const leads = app.findCollectionByNameOrId('leads')
    if (!leads.fields.getByName('notificacao_enviada')) {
      leads.fields.add(new BoolField({ name: 'notificacao_enviada' }))
      app.save(leads)
    }

    const notificacoes = new Collection({
      name: 'notificacoes',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'julia' || usuario_id = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'julia' || usuario_id = @request.auth.id)",
      createRule: null,
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'julia' || usuario_id = @request.auth.id)",
      deleteRule: "@request.auth.role = 'admin' || @request.auth.role = 'julia'",
      fields: [
        { name: 'lead_id', type: 'relation', collectionId: leads.id, required: true, maxSelect: 1 },
        {
          name: 'usuario_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          required: true,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          values: ['1h_antes', '24h_antes', 'atrasado'],
          required: true,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          values: ['nao_lida', 'lida'],
          required: true,
          maxSelect: 1,
        },
        { name: 'data_leitura', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(notificacoes)

    const email_config = new Collection({
      name: 'email_config',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'api_provider', type: 'text' },
        { name: 'api_key', type: 'text' },
        { name: 'email_remetente', type: 'email' },
        { name: 'status', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(email_config)

    const email_logs = new Collection({
      name: 'email_logs',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'data', type: 'date' },
        { name: 'destinatario', type: 'email' },
        { name: 'status', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(email_logs)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('email_logs'))
    } catch (e) {}
    try {
      app.delete(app.findCollectionByNameOrId('email_config'))
    } catch (e) {}
    try {
      app.delete(app.findCollectionByNameOrId('notificacoes'))
    } catch (e) {}

    try {
      const leads = app.findCollectionByNameOrId('leads')
      leads.fields.removeByName('notificacao_enviada')
      app.save(leads)
    } catch (e) {}
  },
)
