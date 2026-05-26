migrate(
  (app) => {
    const producao = app.findCollectionByNameOrId('producao')
    producao.addIndex('idx_producao_data_producao', false, 'data_producao', '')
    producao.addIndex('idx_producao_status', false, 'status', '')
    producao.addIndex('idx_producao_created', false, 'created', '')
    producao.addIndex('idx_producao_item_id', false, 'item_id', '')
    app.save(producao)

    const contatos = app.findCollectionByNameOrId('contatos')
    contatos.addIndex('idx_contatos_status_validacao', false, 'status_validacao', '')
    contatos.addIndex('idx_contatos_data_contato', false, 'data_contato', '')
    app.save(contatos)
  },
  (app) => {
    const producao = app.findCollectionByNameOrId('producao')
    producao.removeIndex('idx_producao_data_producao')
    producao.removeIndex('idx_producao_status')
    producao.removeIndex('idx_producao_created')
    producao.removeIndex('idx_producao_item_id')
    app.save(producao)

    const contatos = app.findCollectionByNameOrId('contatos')
    contatos.removeIndex('idx_contatos_status_validacao')
    contatos.removeIndex('idx_contatos_data_contato')
    app.save(contatos)
  },
)
