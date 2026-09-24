migrate(
  (app) => {
    // 1. Create diretrizes_categorias collection
    const diretrizesCategorias = new Collection({
      name: 'diretrizes_categorias',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.username = 'adriano' || @request.auth.email = 'adriano_santos_09@hotmail.com'",
      updateRule:
        "@request.auth.username = 'adriano' || @request.auth.email = 'adriano_santos_09@hotmail.com'",
      deleteRule:
        "@request.auth.username = 'adriano' || @request.auth.email = 'adriano_santos_09@hotmail.com'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'icone', type: 'text' },
        { name: 'ordem', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_diretrizes_categorias_ordem ON diretrizes_categorias (ordem)'],
    })
    app.save(diretrizesCategorias)

    // 2. Create diretrizes collection
    const diretrizes = new Collection({
      name: 'diretrizes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.username = 'adriano' || @request.auth.email = 'adriano_santos_09@hotmail.com'",
      updateRule:
        "@request.auth.username = 'adriano' || @request.auth.email = 'adriano_santos_09@hotmail.com'",
      deleteRule:
        "@request.auth.username = 'adriano' || @request.auth.email = 'adriano_santos_09@hotmail.com'",
      fields: [
        {
          name: 'categoria',
          type: 'relation',
          required: true,
          collectionId: diretrizesCategorias.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true },
        { name: 'conteudo', type: 'text' },
        { name: 'ordem', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_diretrizes_categoria ON diretrizes (categoria)',
        'CREATE INDEX idx_diretrizes_ordem ON diretrizes (ordem)',
      ],
    })
    app.save(diretrizes)

    // 3. Seed 6 initial categories
    const initialCategories = [
      {
        nome: 'Vendas',
        descricao: 'Diretrizes, normas e procedimentos de vendas',
        icone: 'TrendingUp',
        ordem: 1,
      },
      {
        nome: 'Administrativo',
        descricao: 'Diretrizes administrativas, financeiras e internas',
        icone: 'Briefcase',
        ordem: 2,
      },
      {
        nome: 'Produção',
        descricao: 'Diretrizes sobre lançamentos de produção e fabricação',
        icone: 'Factory',
        ordem: 3,
      },
      {
        nome: 'Estoque e Logística',
        descricao: 'Diretrizes sobre controle de estoque, separação e transporte',
        icone: 'Package',
        ordem: 4,
      },
      {
        nome: 'Atendimento ao Cliente',
        descricao: 'Diretrizes e boas práticas para atendimento e relacionamento',
        icone: 'Headphones',
        ordem: 5,
      },
      {
        nome: 'Geral',
        descricao: 'Diretrizes gerais e comunicados da organização',
        icone: 'FileText',
        ordem: 6,
      },
    ]

    for (let i = 0; i < initialCategories.length; i++) {
      const catData = initialCategories[i]
      try {
        app.findFirstRecordByData('diretrizes_categorias', 'nome', catData.nome)
      } catch (_) {
        const record = new Record(diretrizesCategorias)
        record.set('nome', catData.nome)
        record.set('descricao', catData.descricao)
        record.set('icone', catData.icone)
        record.set('ordem', catData.ordem)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      const diretrizes = app.findCollectionByNameOrId('diretrizes')
      app.delete(diretrizes)
    } catch (_) {}

    try {
      const diretrizesCategorias = app.findCollectionByNameOrId('diretrizes_categorias')
      app.delete(diretrizesCategorias)
    } catch (_) {}
  },
)
