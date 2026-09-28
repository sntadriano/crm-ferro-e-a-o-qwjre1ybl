migrate(
  (app) => {
    const diretrizesCategorias = app.findCollectionByNameOrId('diretrizes_categorias')
    const diretrizes = app.findCollectionByNameOrId('diretrizes')

    // Helper: obter ou criar categoria
    const getOrCreateCategory = (nome, descricao, icone, ordem) => {
      try {
        return app.findFirstRecordByData('diretrizes_categorias', 'nome', nome)
      } catch (_) {
        const record = new Record(diretrizesCategorias)
        record.set('nome', nome)
        if (descricao) record.set('descricao', descricao)
        if (icone) record.set('icone', icone)
        if (ordem !== undefined) record.set('ordem', ordem)
        app.save(record)
        return record
      }
    }

    // Helper: criar ou atualizar diretriz (idempotente por categoria + titulo)
    const upsertDiretriz = (categoriaRecord, titulo, conteudo, ordem) => {
      try {
        const existingRecords = app.findRecordsByFilter(
          'diretrizes',
          `categoria = '${categoriaRecord.id}' && titulo = '${titulo.replace(/'/g, "\\'")}'`,
          '-created',
          1,
          0,
        )

        if (existingRecords && existingRecords.length > 0) {
          const existing = existingRecords[0]
          existing.set('conteudo', conteudo)
          if (ordem !== undefined) existing.set('ordem', ordem)
          app.save(existing)
          return existing
        }
      } catch (_) {}

      const newRecord = new Record(diretrizes)
      newRecord.set('categoria', categoriaRecord.id)
      newRecord.set('titulo', titulo)
      newRecord.set('conteudo', conteudo)
      if (ordem !== undefined) newRecord.set('ordem', ordem)
      app.save(newRecord)
      return newRecord
    }

    // 1. Obter/Garantir categorias necessárias
    const catGeral = getOrCreateCategory(
      'Geral',
      'Diretrizes gerais e comunicados da organização',
      'FileText',
      6,
    )
    const catProducao = getOrCreateCategory(
      'Produção',
      'Diretrizes sobre lançamentos de produção e fabricação',
      'Factory',
      3,
    )

    // 2. Diretrizes Comerciais na categoria "Geral"
    const itensGeral = [
      {
        titulo: 'Diretriz Comercial — Boas Práticas de Escritório',
        conteudo:
          'Diretrizes comerciais e boas práticas de escritório para o dia a dia da equipe.\n\n*(Conteúdo a detalhar)*',
        ordem: 4,
      },
      {
        titulo: 'Política de Follow-up',
        conteudo:
          'Prazos e cadência obrigatória para realização de follow-up com clientes e orçamentos em aberto:\n\n- 1ª tentativa: entre 3 e 5 horas após o envio da proposta/orçamento.\n- 2ª tentativa: 24 horas após o envio.\n- 3ª tentativa: 3 dias após a proposta.\n- 4ª tentativa: 7 dias após a proposta.\n- 5ª tentativa: 10 dias após a proposta.\n\nTodo contato ou retorno deve ser devidamente registrado no CRM para acompanhamento de métricas de conversão.',
        ordem: 5,
      },
      {
        titulo: 'Fluxo de Pedido',
        conteudo:
          'Fluxo operacional padrão para tramitação e atendimento de pedidos:\n\n1. Vendedor: captação, negociação, alinhamento técnico e inclusão do pedido no sistema.\n2. Escritório: conferência cadastral, validação financeira/crédito e liberação documental.\n3. Expedição: programação de separação, corte/dobra (quando aplicável), conferência e carregamento.\n\nObservação: o fluxo pode variar a depender da especificação do material e da modalidade de fornecimento (retirada no balcão ou entrega programada).',
        ordem: 6,
      },
      {
        titulo: 'Rotas Intermunicipais — Horário de Fechamento de Carga',
        conteudo:
          'Regra de fechamento de cargas destinadas a rotas intermunicipais:\n\n- O fechamento da carga deve ocorrer impreterivelmente até as 12h00 (meio-dia) do dia do carregamento.\n- Esta regra aplica-se mesmo quando o carregamento físico do caminhão estiver programado apenas para o período da tarde.\n- Pedidos incluídos ou liberados após o horário limite serão alocados automaticamente na rota subsequente.',
        ordem: 7,
      },
    ]

    for (let i = 0; i < itensGeral.length; i++) {
      const item = itensGeral[i]
      upsertDiretriz(catGeral, item.titulo, item.conteudo, item.ordem)
    }

    // 3. Diretrizes na categoria "Produção"
    const itensProducao = [
      {
        titulo: 'Prazo de Lançamento de Produção',
        conteudo:
          'Todas as produções realizadas no chão de fábrica e setores operacionais devem ser obrigatoriamente lançadas no sistema até o fim do dia de sua execução.\n\nO lançamento tempestivo garante a acurácia imediata dos saldos de estoque e a visibilidade para a equipe comercial sobre materiais prontos.',
        ordem: 1,
      },
      {
        titulo: 'Acompanhamento de Estoque e Produção',
        conteudo:
          'Acompanhamento contínuo e rigoroso dos níveis de estoque e das ordens de produção em andamento:\n\n- Realizar conferência sistemática entre produção lançada e estoque físico.\n- Prevenir desvios, falhas de apontamento, duplicidades e lançamentos errados.\n- Comunicar imediatamente divergências identificadas aos responsáveis de cada turno.',
        ordem: 2,
      },
    ]

    for (let i = 0; i < itensProducao.length; i++) {
      const item = itensProducao[i]
      upsertDiretriz(catProducao, item.titulo, item.conteudo, item.ordem)
    }
  },
  (app) => {
    // Reversão não-destrutiva
  },
)
