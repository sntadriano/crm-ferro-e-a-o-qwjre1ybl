migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contatos')

    const tipoField = col.fields.getByName('tipo')
    if (tipoField) {
      tipoField.values = ['whatsapp', 'visita', 'email', 'visita_presencial', 'telefone']
    }

    if (!col.fields.getByName('teve_pedido')) {
      col.fields.add(new BoolField({ name: 'teve_pedido' }))
    }
    if (!col.fields.getByName('valor_pedido')) {
      col.fields.add(new NumberField({ name: 'valor_pedido' }))
    }
    if (!col.fields.getByName('status_aprovacao')) {
      col.fields.add(
        new SelectField({
          name: 'status_aprovacao',
          values: ['pendente', 'aprovado'],
          maxSelect: 1,
        }),
      )
    }

    col.listRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.role = 'julia' || @request.auth.name ?~ 'Alex' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id))"
    col.createRule = '@request.auth.active = true'
    col.updateRule =
      "@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.name ?~ 'Alex'"

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contatos')
    col.fields.removeByName('teve_pedido')
    col.fields.removeByName('valor_pedido')
    col.fields.removeByName('status_aprovacao')

    const tipoField = col.fields.getByName('tipo')
    if (tipoField) {
      tipoField.values = ['whatsapp', 'visita', 'email']
    }

    col.listRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && cliente_id.vendedor = @request.auth.codigo))"
    col.createRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && cliente_id.vendedor = @request.auth.codigo))"
    col.updateRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && cliente_id.vendedor = @request.auth.codigo))"

    app.save(col)
  },
)
