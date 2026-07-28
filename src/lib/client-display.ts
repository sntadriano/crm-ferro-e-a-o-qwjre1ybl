import { RecordModel } from 'pocketbase'

export function getClienteDisplayName(record: RecordModel | undefined | null): string {
  if (!record) return 'Sem Cliente'
  if (record.cliente_id && record.expand?.cliente_id) {
    return record.expand.cliente_id.descricao || 'Cliente sem nome'
  }
  if (record.nome_possivel_cliente && String(record.nome_possivel_cliente).trim() !== '') {
    return String(record.nome_possivel_cliente).trim()
  }
  if (record.possivel_cliente) {
    return 'Possível Cliente (nome não informado)'
  }
  return 'Sem Cliente'
}

export function isPossivelCliente(record: RecordModel | undefined | null): boolean {
  return !!record?.possivel_cliente
}
