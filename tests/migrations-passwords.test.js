// Garante que nenhuma migration nova volte a resetar senhas de usuários.
// Histórico: dezenas de migrations "de correção de login" trocaram senhas sem
// aviso e deixaram usuários sem acesso. Ver pocketbase/migrations/README.md.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const dir = path.join(import.meta.dirname, '..', 'pocketbase', 'migrations')
// Última migration autorizada a mexer em senha.
const LAST_ALLOWED = 91

const newer = fs
  .readdirSync(dir)
  .filter((f) => /^\d+_.*\.js$/.test(f))
  .filter((f) => parseInt(f, 10) > LAST_ALLOWED)

test('migrations novas não alteram senhas de usuários', () => {
  const offenders = newer.filter((f) => {
    const src = fs.readFileSync(path.join(dir, f), 'utf8')
    return /setPassword\s*\(|password_plain|passwordConfirm/.test(src)
  })
  assert.deepEqual(
    offenders,
    [],
    `Migrations que alteram senha (proibido, use o painel Gerenciar Senhas): ${offenders.join(', ')}`,
  )
})
