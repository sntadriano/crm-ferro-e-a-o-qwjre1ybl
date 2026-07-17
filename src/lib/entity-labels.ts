function normalizeClientName(c: any): string {
  return c?.tradeName || c?.fantasia || c?.descricao || c?.name || ''
}

function normalizeClientDoc(c: any): string {
  return c?.cnpj_cpf || c?.document || ''
}

export function formatUserLabel(user: any, allUsers: any[]): string {
  const name = user?.name || user?.email || 'Desconhecido'
  const email = user?.email || ''
  if (!email) return name
  const dups = allUsers.filter((x) => (x.name || x.email) === name)
  if (dups.length > 1) {
    return `${name} (${email})`
  }
  return name
}

export function formatClientDisplayName(client: any, allClients: any[]): string {
  const name = normalizeClientName(client) || 'Desconhecido'
  const doc = normalizeClientDoc(client)
  if (!doc) return name
  const dups = allClients.filter((x) => normalizeClientName(x) === name)
  if (dups.length > 1) {
    return `${name} (${doc})`
  }
  return name
}
