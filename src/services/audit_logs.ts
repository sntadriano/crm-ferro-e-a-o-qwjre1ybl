import pb from '@/lib/pocketbase/client'

export interface AuditLogDetail {
  campo: string
  valor_anterior: any
  valor_novo: any
}

export interface AuditLog {
  id: string
  usuario_id: string
  usuario_nome: string
  acao: string
  tabela: string
  registro_id: string
  detalhes: AuditLogDetail[]
  created: string
  updated: string
  timestamp: string
}

export const getAuditLogs = async (params?: {
  tabela?: string
  usuario?: string
  startDate?: string
  endDate?: string
  page?: number
  perPage?: number
}) => {
  const filters: string[] = []

  if (params?.tabela && params.tabela !== 'all') {
    filters.push(`tabela = '${params.tabela}'`)
  }
  if (params?.usuario) {
    filters.push(`usuario_nome ~ '${params.usuario}'`)
  }
  if (params?.startDate) {
    filters.push(`created >= '${params.startDate} 00:00:00'`)
  }
  if (params?.endDate) {
    filters.push(`created <= '${params.endDate} 23:59:59'`)
  }

  const filterString = filters.join(' && ')

  return pb.collection('audit_logs').getList<AuditLog>(params?.page || 1, params?.perPage || 20, {
    filter: filterString,
    sort: '-created',
  })
}

export const getRecordAuditLogs = (registroId: string, tabela: string) => {
  return pb.collection('audit_logs').getFullList<AuditLog>({
    filter: `registro_id = '${registroId}' && tabela = '${tabela}'`,
    sort: '-created',
  })
}

export const getLeadAuditLogs = (leadId: string) => {
  return pb.collection('audit_logs').getFullList<AuditLog>({
    filter: `registro_id = '${leadId}' || detalhes ?~ '${leadId}'`,
    sort: '-created',
  })
}

export const getProducaoAuditLogs = (producaoId: string) => {
  return pb.collection('audit_logs').getFullList<AuditLog>({
    filter: `registro_id = '${producaoId}' && tabela = 'producao'`,
    sort: '-created',
  })
}
