/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// 0090 — Restaura o acesso da Julia (conta única, ativa e com username 'julia')
// =============================================================================
//
// POR QUE A JULIA FICOU SEM ACESSO (resumo do histórico de migrations):
//   - A senha dela foi regravada 15+ vezes (0021, 0024, 0025, 0032-0034, 0051,
//     0067, 0069, 0076, 0079, 0081...), cada vez que se pediu ao Skip para
//     "consertar o login". A última senha gravada (julia@skip2026) nunca foi
//     informada a ela, e a anterior (Julia1102.) foi sobrescrita.
//   - Existem 2+ contas da Julia (julia.carmona159@gmail.com e
//     julia@ferroeacoeldorado.com.br). Migrations 0046/0062/0063 desativaram
//     "duplicadas" por critérios fracos e 0081 deu o username "julia" para
//     a conta mais recentemente atualizada, que pode não ser a que ela usa.
//   - O formulário de login só aceita senha com >= 8 caracteres e converte
//     tudo para minúsculas; hash gravado com maiúscula nunca bate.
//
// O QUE ESTA MIGRATION FAZ (idempotente, nunca lança erro para não derrubar o
// boot do PocketBase):
//   1. Localiza todas as contas da Julia (e-mails conhecidos, role 'julia' ou
//      username contendo 'julia').
//   2. Escolhe a conta "oficial": a que tem mais registros dela (leads,
//      contatos, produção); empate -> e-mail gmail dela, depois verificada,
//      depois a mais antiga.
//   3. Na conta oficial: username = 'julia', role 'julia', active e verified.
//      A SENHA NÃO É DEFINIDA AQUI de propósito: segredos não devem ficar em
//      texto puro no repositório. Defina-a em Admin > Senhas (já grava em
//      minúsculas e sincroniza user_credentials).
//   4. Nas outras contas dela: libera o username 'julia' (vira
//      julia_antigo_<id>) e deixa inativas as duplicadas sem nenhum registro.
// =============================================================================
migrate(
  (app) => {
    const USERNAME = 'julia'
    const EMAILS = ['julia.carmona159@gmail.com', 'julia@ferroeacoeldorado.com.br']
    const PREFERRED_EMAIL = 'julia.carmona159@gmail.com'
    const TARGET_CODES = [1, 5, 6, 10, 11, 999]

    try {
      console.log('===== MIGRATION 0090 — RESTAURAR LOGIN DA JULIA =====')

      // ---------------------------------------------------------------------
      // 1. Reunir contas candidatas
      // ---------------------------------------------------------------------
      const seen = {}
      const candidates = []
      const add = (rec) => {
        if (rec && !seen[rec.id]) {
          seen[rec.id] = true
          candidates.push(rec)
        }
      }

      for (let i = 0; i < EMAILS.length; i++) {
        try {
          add(app.findAuthRecordByEmail('users', EMAILS[i]))
        } catch (_) {}
      }
      try {
        const byRole = app.findRecordsByFilter('users', "role = 'julia'", '', 50, 0)
        for (let i = 0; i < byRole.length; i++) add(byRole[i])
      } catch (_) {}
      try {
        const byUsername = app.findRecordsByFilter('users', "username ~ 'julia'", '', 50, 0)
        for (let i = 0; i < byUsername.length; i++) add(byUsername[i])
      } catch (_) {}

      if (candidates.length === 0) {
        console.log('AVISO: nenhuma conta da Julia encontrada. Nada a fazer.')
        return
      }

      // ---------------------------------------------------------------------
      // 2. Escolher a conta oficial
      // ---------------------------------------------------------------------
      const countOwned = (userId) => {
        let total = 0
        const collections = ['leads', 'contatos', 'producao']
        for (let c = 0; c < collections.length; c++) {
          try {
            const rows = app.findRecordsByFilter(
              collections[c],
              "usuario_id = '" + userId + "'",
              '',
              1000,
              0,
            )
            total += rows.length
          } catch (_) {}
        }
        return total
      }

      const info = candidates.map((rec) => ({
        rec: rec,
        owned: countOwned(rec.id),
        preferred: rec.getString('email').toLowerCase() === PREFERRED_EMAIL ? 1 : 0,
        verified: rec.getBool('verified') ? 1 : 0,
        created: rec.getString('created'),
      }))

      info.sort((a, b) => {
        if (b.owned !== a.owned) return b.owned - a.owned
        if (b.preferred !== a.preferred) return b.preferred - a.preferred
        if (b.verified !== a.verified) return b.verified - a.verified
        return a.created < b.created ? -1 : a.created > b.created ? 1 : 0
      })

      console.log('Contas encontradas (' + info.length + '):')
      for (let i = 0; i < info.length; i++) {
        const x = info[i]
        console.log(
          '  [' +
            (i + 1) +
            '] ID: ' +
            x.rec.id +
            ' | Email: ' +
            x.rec.getString('email') +
            ' | Username: ' +
            x.rec.getString('username') +
            ' | Active: ' +
            x.rec.getBool('active') +
            ' | Registros: ' +
            x.owned,
        )
      }

      const official = info[0].rec

      // ---------------------------------------------------------------------
      // 3. Liberar o username 'julia' das outras contas (antes de gravar)
      // ---------------------------------------------------------------------
      for (let i = 1; i < info.length; i++) {
        const other = info[i].rec
        let changed = false
        if (other.getString('username') === USERNAME) {
          other.set('username', USERNAME + '_antigo_' + other.id)
          changed = true
        }
        // Duplicada sem nenhum registro vinculado: deixa inativa (como a 0063).
        if (info[i].owned === 0 && other.getBool('active')) {
          other.set('active', false)
          changed = true
        }
        if (changed) {
          try {
            app.save(other)
            console.log('Conta duplicada ajustada: ' + other.id)
          } catch (err) {
            console.log('Falha ao ajustar conta duplicada ' + other.id + ':', err)
          }
        }
      }

      // ---------------------------------------------------------------------
      // 4. Gravar conta oficial
      // ---------------------------------------------------------------------
      official.set('username', USERNAME)
      official.set('role', 'julia')
      official.set('active', true)
      official.setVerified(true)

      const codes = official.get('codigos_vendedor')
      if (!Array.isArray(codes) || codes.length === 0) {
        official.set('codigos_vendedor', TARGET_CODES)
      }
      app.save(official)

      console.log(
        'SUCESSO: conta oficial da Julia = ' + official.id + ' (' + official.getString('email') + ')',
      )
      console.log('  Login: usuário "julia" (ou o e-mail da conta oficial)')
    } catch (err) {
      // Nunca derrubar o boot do PocketBase por causa desta correção.
      console.log('ERRO na migration 0090 (ignorado para não travar o boot):', err)
    }
  },
  (app) => {
    // Sem reversão: username/ativação da conta oficial são o estado desejado.
  },
)
