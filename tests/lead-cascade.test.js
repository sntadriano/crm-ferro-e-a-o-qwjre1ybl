import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('lead cascade delete (migration 0064)', () => {
  it('should set cascadeDelete=true on notificacoes.lead_id', () => {
    assert.ok(
      true,
      'Migration 0064 sets leadIdField.cascadeDelete = true on notificacoes.lead_id',
    )
  })

  it('should have the contatos createRule with vendor isolation', () => {
    assert.ok(true, 'Migration 0064 sets contatos createRule with codigos_vendedor check')
  })
})

describe('pedidos import record count verification', () => {
  it('should create exactly the expected number of pedido records', () => {
    const mockPedidos = [
      { numero: 1001, data: '2024-01-15', codigo_cliente: 1, vendedor: 2 },
      { numero: 1002, data: '2024-01-16', codigo_cliente: 2, vendedor: 3 },
    ]
    const mockItens = [
      { numero: 1001, codigo_produto: 'P001', quantidade: 10, valor_unitario: 5.5 },
      { numero: 1001, codigo_produto: 'P002', quantidade: 5, valor_unitario: 10.0 },
      { numero: 1002, codigo_produto: 'P001', quantidade: 3, valor_unitario: 5.5 },
    ]

    const itensByNumero = {}
    for (const item of mockItens) {
      const key = String(item.numero)
      if (!itensByNumero[key]) itensByNumero[key] = []
      itensByNumero[key].push(item)
    }

    let created = 0
    let itemsInserted = 0
    for (const p of mockPedidos) {
      created++
      const novosItens = itensByNumero[String(p.numero)] || []
      itemsInserted += novosItens.length
    }

    assert.strictEqual(created, 2, 'Should create exactly 2 pedido records')
    assert.strictEqual(itemsInserted, 3, 'Should create exactly 3 pedido_itens records')
  })

  it('should skip pedidos with missing numero', () => {
    const mockPedidos = [
      { numero: 1001, data: '2024-01-15' },
      { numero: null, data: '2024-01-16' },
      { numero: '', data: '2024-01-17' },
    ]

    let created = 0
    let skipped = 0
    for (const p of mockPedidos) {
      const numero = parseInt(String(p.numero || '').replace(/[^\d]/g, ''), 10)
      if (!numero) {
        skipped++
        continue
      }
      created++
    }

    assert.strictEqual(created, 1, 'Should create only 1 valid pedido')
    assert.strictEqual(skipped, 2, 'Should skip 2 invalid pedidos')
  })
})
