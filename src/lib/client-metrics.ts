export const ACTIVE_CLIENT_STATUS = 'Ativo'
export const ACTIVE_CLIENT_FILTER = `status = '${ACTIVE_CLIENT_STATUS}'`
export const INACTIVE_CLIENT_FILTER = `status != '${ACTIVE_CLIENT_STATUS}'`

export function isClientActive(status: string | undefined | null): boolean {
  return status === ACTIVE_CLIENT_STATUS
}

export function countActiveClients(clients: Array<{ status?: string }>): number {
  return clients.filter((c) => isClientActive(c.status)).length
}

export function countInactiveClients(clients: Array<{ status?: string }>): number {
  return clients.filter((c) => !isClientActive(c.status)).length
}
