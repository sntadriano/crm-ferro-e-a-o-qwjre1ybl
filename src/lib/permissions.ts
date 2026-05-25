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
