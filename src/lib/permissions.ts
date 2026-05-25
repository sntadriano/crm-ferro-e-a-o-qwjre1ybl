export function canExport(role?: string, module?: string, email?: string): boolean {
  if (!role) return false
  if (role === 'admin' || email === 'Alex') return true
  if (role === 'julia' && (module === 'leads' || module === 'contatos')) return true
  if (role === 'gerente' && module === 'producao') return true
  return false
}
