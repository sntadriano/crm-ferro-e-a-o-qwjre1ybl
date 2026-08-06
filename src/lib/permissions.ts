const RESTRICTED_CLIENTES_EMAILS = new Set([
  'danilovendas88@hotmail.com',
  'julia.carmona159@gmail.com',
  'viniciusmamedes00@gmail.com',
])

export function isRestrictedFromClientes(email?: string): boolean {
  if (!email) return false
  return RESTRICTED_CLIENTES_EMAILS.has(email.toLowerCase())
}

export function canExport(role?: string, module?: string, email?: string): boolean {
  if (!role) return false
  if (role === 'admin' || email === 'Alex' || email?.toLowerCase().includes('alex')) return true
  if (role === 'julia' && (module === 'leads' || module === 'contatos')) return true
  if (role === 'gerente' && module === 'producao') return true
  return false
}

export function canViewAudit(role?: string, email?: string): boolean {
  if (!role) return false
  if (role === 'admin' || email === 'Alex' || email?.toLowerCase().includes('alex')) return true
  if (role === 'julia') return true
  if (role === 'gerente') return true
  return false
}

export function canUseFilters(role?: string, module?: string, email?: string): boolean {
  if (!role) return false
  if (role === 'admin' || email === 'Alex' || email?.toLowerCase().includes('alex')) return true
  if (role === 'julia' && (module === 'leads' || module === 'contatos')) return true
  if (role === 'gerente' && module === 'producao') return true
  return false
}

export function canViewProducaoHistorico(role?: string, email?: string): boolean {
  // Production history is available to every authenticated, active user.
  // Active status is enforced server-side via the collection API rules
  // (`@request.auth.active = true`) and by the auth guard on the client.
  if (!role) return false
  return true
}

export function isProductionOnlyUser(email?: string, role?: string): boolean {
  if (!role && !email) return false
  if (role && ['julia', 'paulo', 'gerente_producao'].includes(role)) return true
  // Claudio's account (soaresclaudio65@gmail.com) is now `gerente_producao`,
  // so the role check above already covers it. Keep the email fallback as a
  // defensive guard in case the role is ever reset to `gerente` accidentally.
  if (email && email.toLowerCase() === 'soaresclaudio65@gmail.com') return true
  return false
}
