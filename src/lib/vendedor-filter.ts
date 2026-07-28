import pb from '@/lib/pocketbase/client'

export function buildVendedorFilter(): string {
  const user = pb.authStore.record as any
  if (!user || user.role !== 'vendedor') return ''

  const codes: number[] = Array.isArray(user.codigos_vendedor)
    ? user.codigos_vendedor.filter((c: unknown) => typeof c === 'number' && c > 0)
    : []

  if (codes.length === 0 && typeof user.codigo === 'number' && user.codigo > 0) {
    codes.push(user.codigo)
  }

  if (codes.length === 0) return 'vendedor = 0'
  if (codes.length === 1) return `vendedor = ${codes[0]}`

  return `(${codes.map((c) => `vendedor = ${c}`).join(' || ')})`
}
