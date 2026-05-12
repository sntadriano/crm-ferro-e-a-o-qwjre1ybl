migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.createRule = "@request.auth.role = 'admin'"
    users.updateRule = "id = @request.auth.id || @request.auth.role = 'admin'"
    users.deleteRule = "@request.auth.role = 'admin'"

    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'julia', 'vendedor', 'paulo', 'gerente'],
          maxSelect: 1,
        }),
      )
    }
    if (!users.fields.getByName('active')) {
      users.fields.add(new BoolField({ name: 'active' }))
    }
    if (!users.fields.getByName('codigo')) {
      users.fields.add(new NumberField({ name: 'codigo' }))
    }
    app.save(users)

    const clientes = new Collection({
      name: 'clientes',
      type: 'base',
      listRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && vendedor = @request.auth.codigo))",
      viewRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && vendedor = @request.auth.codigo))",
      createRule: '@request.auth.active = true',
      updateRule: '@request.auth.active = true',
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'codigo', type: 'number' },
        { name: 'descricao', type: 'text', required: true },
        { name: 'fantasia', type: 'text' },
        { name: 'cnpj_cpf', type: 'text', required: true },
        { name: 'insc_estadual', type: 'text' },
        { name: 'fone', type: 'text' },
        { name: 'celular', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'endereco', type: 'text' },
        { name: 'bairro', type: 'text' },
        { name: 'cidade', type: 'text' },
        { name: 'uf', type: 'text' },
        { name: 'cep', type: 'text' },
        { name: 'tipo', type: 'text' },
        { name: 'vendedor', type: 'number' },
        { name: 'cadastro', type: 'date' },
        { name: 'status', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_clientes_cnpj_cpf ON clientes (cnpj_cpf) WHERE cnpj_cpf != ''",
        'CREATE UNIQUE INDEX idx_clientes_codigo ON clientes (codigo) WHERE codigo IS NOT NULL',
      ],
    })
    app.save(clientes)

    const leads = new Collection({
      name: 'leads',
      type: 'base',
      listRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id))",
      viewRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id))",
      createRule: '@request.auth.active = true',
      updateRule: '@request.auth.active = true',
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'cliente_id', type: 'relation', collectionId: clientes.id, maxSelect: 1 },
        { name: 'usuario_id', type: 'relation', collectionId: users.id, maxSelect: 1 },
        {
          name: 'status',
          type: 'select',
          values: ['novo', 'proposta_enviada', 'fechado', 'perdido'],
          maxSelect: 1,
        },
        { name: 'valor_estimado', type: 'number' },
        { name: 'data_criacao', type: 'date' },
        { name: 'proximo_followup', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(leads)

    const contatos = new Collection({
      name: 'contatos',
      type: 'base',
      listRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id))",
      viewRule:
        "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id))",
      createRule: '@request.auth.active = true',
      updateRule: '@request.auth.active = true',
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'cliente_id', type: 'relation', collectionId: clientes.id, maxSelect: 1 },
        { name: 'usuario_id', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'tipo', type: 'select', values: ['whatsapp', 'visita', 'email'], maxSelect: 1 },
        { name: 'descricao', type: 'text' },
        { name: 'resultado', type: 'text' },
        { name: 'data_contato', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(contatos)

    const permissoes = new Collection({
      name: 'permissoes',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'usuario_id', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'recurso', type: 'text' },
        { name: 'acao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(permissoes)

    const audit_logs = new Collection({
      name: 'audit_logs',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: '',
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'usuario_id', type: 'text' },
        { name: 'usuario_nome', type: 'text' },
        { name: 'acao', type: 'text' },
        { name: 'detalhes', type: 'json' },
        { name: 'timestamp', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(audit_logs)
  },
  (app) => {},
)
