import pb from '@/lib/pocketbase/client'

export const getLeadAuditLogs = (leadId: string) => {
  return pb.collection('audit_logs').getFullList({
    // Using text contains for the json field to be safe across PB versions
    filter: `detalhes ?~ '${leadId}'`,
    sort: '-timestamp',
  })
}
