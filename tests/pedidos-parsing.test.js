import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const parseNum = (v) => {
  if (v === undefined || v === null || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const s = String(v)
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

const parseIntSafe = (v) => {
  if (v === undefined || v === null || v === '') return 0
  if (typeof v === 'number') return Math.trunc(v)
  const n = parseInt(String(v).replace(/[^\d]/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

const normalizeStatus = (v) => {
  if (!v) return 'normal'
  const s = String(v).toLowerCase()
  if (s.indexOf('cancel') !== -1) return 'cancelado'
  return 'normal'
}

const normalizeCodigo = (v) => {
  if (v === undefined || v === null) return ''
  const s = String(v).trim()
  if (/^\d+-\d+$/.test(s)) return s.replace(/-/g, '')
  return s
}

describe('pedidos_import parsing functions', () => {
  describe('parseNum', () => {
    it('should parse numeric strings with comma as decimal separator', () => {
      assert.strictEqual(parseNum('1.234,56'), 1234.56)
    })
    it('should parse plain numbers', () => {
      assert.strictEqual(parseNum(42), 42)
      assert.strictEqual(parseNum('42'), 42)
    })
    it('should return 0 for empty/null/undefined', () => {
      assert.strictEqual(parseNum(''), 0)
      assert.strictEqual(parseNum(null), 0)
      assert.strictEqual(parseNum(undefined), 0)
    })
    it('should handle currency-formatted strings', () => {
      assert.strictEqual(parseNum('R$ 1.000,50'), 1000.5)
    })
    it('should return 0 for non-finite results', () => {
      assert.strictEqual(parseNum('abc'), 0)
    })
  })

  describe('parseIntSafe', () => {
    it('should extract digits from strings with non-numeric characters', () => {
      assert.strictEqual(parseIntSafe('PED-123'), 123)
    })
    it('should handle plain numbers', () => {
      assert.strictEqual(parseIntSafe(42), 42)
    })
    it('should return 0 for empty/null/undefined', () => {
      assert.strictEqual(parseIntSafe(''), 0)
      assert.strictEqual(parseIntSafe(null), 0)
      assert.strictEqual(parseIntSafe(undefined), 0)
    })
  })

  describe('normalizeStatus', () => {
    it('should return "cancelado" for cancel-like strings', () => {
      assert.strictEqual(normalizeStatus('Cancelado'), 'cancelado')
      assert.strictEqual(normalizeStatus('CANCELLED'), 'cancelado')
    })
    it('should return "normal" for other values', () => {
      assert.strictEqual(normalizeStatus('Ativo'), 'normal')
      assert.strictEqual(normalizeStatus(''), 'normal')
      assert.strictEqual(normalizeStatus(null), 'normal')
    })
  })

  describe('normalizeCodigo', () => {
    it('should remove hyphens from dash-separated codes', () => {
      assert.strictEqual(normalizeCodigo('123-456'), '123456')
    })
    it('should return trimmed string for normal codes', () => {
      assert.strictEqual(normalizeCodigo('  ABC123  '), 'ABC123')
    })
    it('should return empty string for null/undefined', () => {
      assert.strictEqual(normalizeCodigo(null), '')
      assert.strictEqual(normalizeCodigo(undefined), '')
    })
  })
})
