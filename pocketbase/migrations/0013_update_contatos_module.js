migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contatos')

    if (!col.fields.getByName('hora')) {
      col.fields.add(new TextField({ name: 'hora' }))
    }
    if (!col.fields.getByName('observacoes_resultado')) {
      col.fields.add(new TextField({ name: 'observacoes_resultado' }))
    }
    if (!col.fields.getByName('status_validacao')) {
      col.fields.add(
        new SelectField({
          name: 'status_validacao',
          values: ['pendente', 'aprovado', 'rejeitado'],
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('data_validacao')) {
      col.fields.add(new DateField({ name: 'data_validacao' }))
    }
    if (!col.fields.getByName('validado_por')) {
      col.fields.add(
        new RelationField({ name: 'validado_por', collectionId: '_pb_users_auth_', maxSelect: 1 }),
      )
    }

    // Update Rules for strict access control
    col.listRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.name ?~ 'Alex' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id))"
    col.viewRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.name ?~ 'Alex' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id))"
    col.createRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.name ?~ 'Alex' || @request.auth.role = 'vendedor')"
    col.updateRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.name ?~ 'Alex' || (@request.auth.role = 'vendedor' && usuario_id = @request.auth.id))"
    col.deleteRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || @request.auth.name ?~ 'Alex')"

    app.save(col)
  },
  (app) => {
    // Add fallback if necessary
  },
)
