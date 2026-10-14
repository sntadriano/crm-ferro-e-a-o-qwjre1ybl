// =============================================================================
// 0091 — Alinha a senha real da Julia com a "Senha atual" do painel
// =============================================================================
//
// PROBLEMA: a coluna "Senha atual" (coleção user_credentials) foi preenchida
// pelas migrations com a senha que elas pretendiam gravar, mas as migrations
// 0076, 0079 e 0081 gravaram senhas diferentes em contas diferentes da Julia.
// Resultado: a senha exibida no painel não é a senha real da conta oficial,
// então nem o login nem a troca de senha pelo painel (que envia a senha atual
// como oldPassword) funcionam.
//
// CORREÇÃO: na conta oficial da Julia (username 'julia', definida na 0090),
// grava como senha real exatamente o valor que está em user_credentials.
// Nenhuma senha fica escrita neste arquivo. Afeta somente a Julia.
// =============================================================================
migrate(
  (app) => {
    try {
      let julia = null
      try {
        julia = app.findFirstRecordByData('users', 'username', 'julia')
      } catch (_) {
        julia = null
      }
      if (!julia) {
        console.log('0091: conta com username "julia" não encontrada. Nada a fazer.')
        return
      }

      let cred = null
      try {
        cred = app.findFirstRecordByData('user_credentials', 'user', julia.id)
      } catch (_) {
        cred = null
      }
      const plain = cred ? cred.getString('password_plain') : ''
      if (!plain || plain.length < 8) {
        console.log('0091: senha registrada da Julia ausente ou curta demais. Nada a fazer.')
        return
      }

      julia.setPassword(plain)
      julia.set('active', true)
      julia.setVerified(true)
      app.save(julia)
      console.log('0091: senha da Julia (' + julia.id + ') alinhada com user_credentials.')
    } catch (err) {
      // Nunca derrubar o boot do PocketBase por causa desta correção.
      console.log('ERRO na migration 0091 (ignorado para não travar o boot):', err)
    }
  },
  (app) => {
    // Sem reversão: não há como restaurar o hash anterior da senha.
  },
)
