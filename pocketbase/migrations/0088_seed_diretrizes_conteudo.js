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

    // 1. Garantir existência da categoria "Corte e Dobra" e categorias existentes
    const catCorteDobra = getOrCreateCategory(
      'Corte e Dobra',
      'Diretrizes, orçamentos, prazos e políticas específicas para o setor de Corte e Dobra',
      'Factory',
      7,
    )
    const catEstoqueLogistica = getOrCreateCategory(
      'Estoque e Logística',
      'Diretrizes sobre controle de estoque, separação e transporte',
      'Package',
      4,
    )
    const catAdministrativo = getOrCreateCategory(
      'Administrativo',
      'Diretrizes administrativas, financeiras e internas',
      'Briefcase',
      2,
    )
    const catGeral = getOrCreateCategory(
      'Geral',
      'Diretrizes gerais e comunicados da organização',
      'FileText',
      6,
    )

    // 2. Itens da categoria "Estoque e Logística"
    const itensEstoqueLogistica = [
      {
        titulo: 'Prazo de Entrega',
        conteudo:
          'O prazo padrão para entregas deve ser rigorosamente comunicado e alinhado com o cliente no ato do pedido.\n\n- O agendamento depende da disponibilidade de frota, rota programada e confirmação prévia de pagamento ou aprovação cadastral.\n- Prazos especiais ou urgências devem ser previamente consultados com a equipe de logística antes de serem formalizados na proposta ou pedido.\n- Eventuais imprevistos meteorológicos ou operacionais de tráfego devem ser reportados ao cliente com antecedência.',
        ordem: 1,
      },
      {
        titulo: 'Carregamento para Entregas Locais (Mesma Cidade)',
        conteudo:
          'Para carregamentos destinados a entregas na mesma cidade:\n\n- Respeitar a ordem de saída dos veículos planejada pela expedição.\n- A conferência do material (bitolas, quantidades, etiquetas e amarrações) deve ser realizada conjuntamente pelo expedidor e pelo motorista antes da saída.\n- Horários de saída matutinos e vespertinos devem seguir a escala diária da expedição para otimizar tempo de rota.',
        ordem: 2,
      },
      {
        titulo: 'Carregamento para Rotas Externas (Intermunicipais)',
        conteudo:
          'Entregas intermunicipais ou regionais exigem planejamento prévio e consolidação de carga:\n\n- Os pedidos devem estar totalmente liberados pela área administrativa/financeira e faturados antes do início do carregamento.\n- Distribuição uniforme de peso sobre os eixos dos caminhões e amarração reforçada para viagens em rodovias conforme normas do CONTRAN.\n- Agrupamento de entregas por proximidade geográfica para cumprimento dos horários previstos em cada destino.',
        ordem: 3,
      },
      {
        titulo: 'Alterações em Pedidos',
        conteudo:
          'Alterações solicitadas em pedidos já em andamento:\n\n- Só poderão ser acatadas se o material ainda não tiver sido cortado, dobrado ou carregado no caminhão de rota.\n- Caso a carga já esteja em trânsito ou montada, alterações acarretarão reemissão de pedido e custos adicionais operacionais ou de reentrega.\n- Toda alteração deve ser formalizada imediatamente via sistema com validação da liderança de vendas/logística.',
        ordem: 4,
      },
      {
        titulo: 'Pedido Mínimo para Entrega',
        conteudo:
          'Para usufruir da modalidade de entrega no endereço da obra ou depósito:\n\n- Aplica-se a exigência de pedido mínimo em valor ou peso estipulado para a região correspondente.\n- Pedidos abaixo do piso estipulado devem ser retirados pelo cliente no balcão da empresa ou acrescidos de taxa de frete acordada previamente.',
        ordem: 5,
      },
      {
        titulo: 'Frete e Política de Retirada',
        conteudo:
          'Regras de frete e retirada presencial:\n\n- Frete próprio/FOB/CIF: as condições contratuais do frete devem estar expressas com clareza no pedido de venda.\n- Retirada pelo cliente (Balcão): o cliente ou transportador contratado deve apresentar identificação, número do pedido e veículo adequado para a capacidade e comprimento dos perfis/barras.\n- O carregamento em veículos inadequados ou que desrespeitem as normas de trânsito e segurança poderá ser recusado pela equipe do pátio.',
        ordem: 6,
      },
      {
        titulo: 'Disponibilidade de Material',
        conteudo:
          'A confirmação de entrega vincula-se à real disponibilidade do item em estoque físico:\n\n- Antes do fechamento do pedido, certificar a disponibilidade da bitola, espessura e quantidade requerida.\n- Caso haja necessidade de produção ou encomenda a usinas/fornecedores, o lead time de suprimentos deve ser acrescido ao prazo prometido ao cliente.',
        ordem: 7,
      },
      {
        titulo: 'Condições de Descarga',
        conteudo:
          'Condições obrigatórias para descarga no destino:\n\n- O local de entrega deve possuir acesso compatível com as dimensões do caminhão (ruas transitáveis, ausência de fios baixos, solo estável).\n- A responsabilidade e equipe/equipamento (guindaste, empilhadeira, ajudantes) para a descarga do material no canteiro de obras ou galpão devem ser definidas e acordadas previamente com o cliente.\n- O motorista não está autorizado a realizar descargas manuais perigosas ou subir em estruturas irregulares.',
        ordem: 8,
      },
    ]

    for (let i = 0; i < itensEstoqueLogistica.length; i++) {
      const item = itensEstoqueLogistica[i]
      upsertDiretriz(catEstoqueLogistica, item.titulo, item.conteudo, item.ordem)
    }

    // 3. Itens da categoria "Administrativo"
    const itensAdministrativo = [
      {
        titulo: 'Modalidades de Pagamento',
        conteudo:
          'Formas e condições de pagamento aceitas pela empresa:\n\n- PIX, Boleto Bancário faturado (sujeito à análise de crédito prévia), Cartão de Crédito e Débito, Transferência Bancária.\n- Para vendas a prazo, é indispensável o cadastro completo atualizado, consulta aos órgãos de proteção ao crédito (Serasa/SPC) e aprovação formal pela gerência financeira.\n- Pagamentos via PIX ou transferência devem ser confirmados em conta bancária antes da liberação do carregamento.',
        ordem: 1,
      },
      {
        titulo: 'Política de Descontos — Consumidor Final',
        conteudo:
          'Parâmetros para concessão de descontos e tabelas especiais a consumidores finais:\n\n- Descontos sobre a tabela padrão são permitidos estritamente dentro da margem de alçada de cada vendedor.\n- Percentuais acima da alçada dependem de aprovação expressa da diretoria comercial.\n- Vendas parceladas ou no cartão de crédito devem repassar taxas financeiras conforme a tabela de juros vigente, sendo vedado desconto à vista para prazos longos.',
        ordem: 2,
      },
      {
        titulo: 'Bloqueios e Restrições Financeiras',
        conteudo:
          'Critérios para restrição de novos faturamentos e bloqueio cadastral:\n\n- Clientes com títulos em atraso têm seus cadastros bloqueados automaticamente para novos faturamentos a prazo.\n- A liberação de novos pedidos para clientes em atraso exige a quitação prévia dos débitos pendentes ou pagamento estritamente à vista/PIX.\n- Qualquer exceção de liberação especial requer chancela da diretoria administrativa.',
        ordem: 3,
      },
    ]

    for (let i = 0; i < itensAdministrativo.length; i++) {
      const item = itensAdministrativo[i]
      upsertDiretriz(catAdministrativo, item.titulo, item.conteudo, item.ordem)
    }

    // 4. Itens da categoria "Corte e Dobra"
    const itensCorteDobra = [
      {
        titulo: 'Orçamento',
        conteudo:
          'Procedimentos para elaboração e envio de orçamentos de corte e dobra:\n\n- Os orçamentos devem basear-se no projeto estrutural detalhado (lista de aço/romaneio de armação).\n- Devem ser discriminadas as bitolas, comprimentos, dobras, quantidades e peso nominal total.\n- O orçamento possui prazo de validade determinado (devido à volatilidade de preços de matéria-prima e custos de transformação).',
        ordem: 1,
      },
      {
        titulo: 'Preço e Forma de Pagamento',
        conteudo:
          'Condições comerciais para serviços e fornecimento de corte e dobra:\n\n- O preço é fixado por quilo (kg) ou por conjunto armado/dobrado, conforme complexidade da estrutura e espessuras envolvidas.\n- As formas de pagamento devem ser pactuadas antes do envio do pedido para a linha de produção, com entrada/sinal quando aplicável.',
        ordem: 2,
      },
      {
        titulo: 'Política de Descontos — Cartão de Crédito',
        conteudo:
          'Regras de desconto nas transações com cartão de crédito:\n\n- Não se aplica a política de desconto à vista nas transações parceladas no cartão de crédito.\n- As taxas da operadora devem ser devidamente calculadas na composição de parcelas para preservar a margem operacional de transformação.',
        ordem: 3,
      },
      {
        titulo: 'Desconto à Vista',
        conteudo:
          'Condições para desconto à vista no setor de corte e dobra:\n\n- O percentual de desconto à vista é aplicável somente para pagamentos integrais confirmados via PIX ou dinheiro no momento do fechamento do pedido.\n- O desconto não é cumulativo com outras promoções ou tabelas especiais de construtoras e frotistas.',
        ordem: 4,
      },
      {
        titulo: 'Restrição de Pagamento',
        conteudo:
          'Restrições específicas de pagamento em corte e dobra:\n\n- Por se tratar de material fabricado sob medida e personalizado para o projeto específico do cliente, não é permitida a produção sem a confirmação do sinal financeiro ou garantia bancária/crédito aprovado.\n- Em caso de desistência ou cancelamento pelo cliente após início do corte, os custos de material e transformação serão integralmente cobrados.',
        ordem: 5,
      },
      {
        titulo: 'Prazo de Entrega',
        conteudo:
          'Prazos do setor de Corte e Dobra:\n\n- O prazo de entrega começa a contar a partir da aprovação do romaneio/projeto técnico e confirmação da condição de pagamento.\n- O tempo de fabricação varia de acordo com o volume de toneladas, cronograma da fábrica e fila de dobradeiras/cortadeiras.\n- Entregas parceladas para obras em etapas devem seguir cronograma físico acordado por escrito com o engenheiro/responsável da obra.',
        ordem: 6,
      },
    ]

    for (let i = 0; i < itensCorteDobra.length; i++) {
      const item = itensCorteDobra[i]
      upsertDiretriz(catCorteDobra, item.titulo, item.conteudo, item.ordem)
    }

    // 5. Itens da categoria "Geral"
    const itensGeral = [
      {
        titulo: 'Objetivo destas Diretrizes',
        conteudo:
          'O presente manual de diretrizes tem como objetivo padronizar os processos comerciais, operacionais, logísticos e administrativos da empresa, assegurando a excelência no atendimento, o alinhamento da equipe e a transparência em todas as operações com clientes e parceiros.',
        ordem: 1,
      },
      {
        titulo: 'Observações Gerais',
        conteudo:
          'Todos os colaboradores devem zelar pelo cumprimento estrito destas regras e procedimentos.\n\n- Dúvidas, casos omissos ou situações excepcionais não contempladas neste manual devem ser submetidas à análise e deliberação da gerência geral ou diretoria antes de qualquer compromisso formal com terceiros.\n- As normas operacionais de segurança no trabalho, uso de EPIs no pátio e conformidade regulatória são prioritárias e inegociáveis.',
        ordem: 2,
      },
      {
        titulo: 'Confidencialidade',
        conteudo:
          'AVISO DE CONFIDENCIALIDADE: Este documento e suas informações constituem patrimônio interno e estratégico da empresa.\n\nÉ estritamente vetado o compartilhamento, reprodução, encaminhamento ou envio destas diretrizes a clientes, concorrentes ou terceiros não autorizados. O uso deste conteúdo é exclusivo e restrito ao corpo de colaboradores da empresa.',
        ordem: 3,
      },
    ]

    for (let i = 0; i < itensGeral.length; i++) {
      const item = itensGeral[i]
      upsertDiretriz(catGeral, item.titulo, item.conteudo, item.ordem)
    }
  },
  (app) => {
    // Reversão opcional (não destrutiva ou remoção dos registros criados)
  },
)
