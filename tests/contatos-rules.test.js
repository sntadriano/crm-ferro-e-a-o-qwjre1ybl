import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const CONTATOS_CREATE_RULE =
  "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || (@request.auth.role = 'vendedor' && @request.auth.codigos_vendedor ~ cliente_id.vendedor))"

describe('contatos createRule expression', () => {
  it('should reference codigos_vendedor with array-contains operator', () => {
    assert.ok(
      CONTATOS_CREATE_RULE.includes('@request.auth.codigos_vendedor ~ cliente_id.vendedor'),
      'Rule must check codigos_vendedor against cliente_id.vendedor',
    )
  })

  it('should allow admin role', () => {
    assert.ok(
      CONTATOS_CREATE_RULE.includes("@request.auth.role = 'admin'"),
      'Rule must allow admin role',
    )
  })

  it('should allow gerente role', () => {
    assert.ok(
      CONTATOS_CREATE_RULE.includes("@request.auth.role = 'gerente'"),
      'Rule must allow gerente role',
    )
  })

  it('should require active auth', () => {
    assert.ok(
      CONTATOS_CREATE_RULE.includes('@request.auth.active = true'),
      'Rule must require active auth',
    )
  })

  it('should not allow unrestricted vendedor access', () => {
    assert.ok(
      !CONTATOS_CREATE_RULE.includes("@request.auth.role = 'vendedor')"),
      'Rule must not allow unrestricted vendedor access',
    )
  })

  it('should use cliente_id.vendedor (relation expansion)', () => {
    assert.ok(
      CONTATOS_CREATE_RULE.includes('cliente_id.vendedor'),
      'Rule must check cliente_id.vendedor',
    )
  })
})

function evaluateContatosCreateRule(auth, clienteVendedor) {
  if (!auth.active) return false
  if (auth.role === 'admin') return true
  if (auth.role === 'gerente') return true
  if (auth.role === 'vendedor') {
    const codigos = auth.codigos_vendedor || []
    return codigos.includes(clienteVendedor)
  }
  return false
}

describe('contatos createRule evaluation logic', () => {
  it('should block vendedor with codigos [2,4] from creating contato for cliente with vendedor=7', () => {
    const auth = { active: true, role: 'vendedor', codigos_vendedor: [2, 4] }
    assert.strictEqual(evaluateContatosCreateRule(auth, 7), false)
  })

  it('should allow vendedor with codigos [2,4] to create contato for cliente with vendedor=2', () => {
    const auth = { active: true, role: 'vendedor', codigos_vendedor: [2, 4] }
    assert.strictEqual(evaluateContatosCreateRule(auth, 2), true)
  })

  it('should allow admin regardless of cliente vendedor', () => {
    const auth = { active: true, role: 'admin', codigos_vendedor: [] }
    assert.strictEqual(evaluateContatosCreateRule(auth, 7), true)
  })

  it('should allow gerente regardless of cliente vendedor', () => {
    const auth = { active: true, role: 'gerente', codigos_vendedor: [] }
    assert.strictEqual(evaluateContatosCreateRule(auth, 7), true)
  })

  it('should block inactive users', () => {
    const auth = { active: false, role: 'admin', codigos_vendedor: [] }
    assert.strictEqual(evaluateContatosCreateRule(auth, 1), false)
  })

  it('should block vendedor with empty codigos_vendedor', () => {
    const auth = { active: true, role: 'vendedor', codigos_vendedor: [] }
    assert.strictEqual(evaluateContatosCreateRule(auth, 2), false)
  })
})
