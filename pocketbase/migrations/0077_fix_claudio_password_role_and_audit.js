migrate(
  (app) => {
    // =========================================================================
    // 0077 — Definitive fix for Claudio's account + audit of all user passwords
    // =========================================================================
    //
    // Background:
    //   - Migration 0068 set Claudio's password to `pass_claudio`.
    //   - Migration 0070 silently overwrote it back to the old `010365cf`
    //     (lowercase), so the password communicated to Claudio stopped working.
    //   - Migration 0072 restricted Claudio's access to production resources
    //     but left his role as `gerente`, which:
    //       * does NOT trigger the `/producao` redirect in App.tsx (only
    //         `gerente_producao` does), and
    //       * still grants broad visibility over clientes/leads/contatos.
    //
    // This migration:
    //   1. Sets a definitive, known password for Claudio by account ID
    //      (lnebsgzn9tb9jxq) using setPassword — NO .toLowerCase() applied.
    //   2. Updates Claudio's role to `gerente_producao`.
    //   3. Audits every other user account and re-affirms each password to its
    //      documented value, so any other silent overwrite is corrected.
    //
    // Final Claudio credentials (to be communicated):
    //   Email:    soaresclaudio65@gmail.com
    //   Password: Claudio@Skip2026
    // =========================================================================

    // -------------------------------------------------------------------------
    // 1. Claudio — fix by ID (not email) to guarantee we touch the right account
    // -------------------------------------------------------------------------
    const CLAUDIO_ID = 'lnebsgzn9tb9jxq'
    const CLAUDIO_PASSWORD = 'Claudio@Skip2026' // case-sensitive — no lowercasing

    console.log('===== MIGRATION 0077 — CLAUDIO FIX =====')

    let claudio = null
    try {
      claudio = app.findRecordById('users', CLAUDIO_ID)
    } catch (_) {
      claudio = null
    }

    if (!claudio) {
      console.log('ERROR: Claudio account not found with ID:', CLAUDIO_ID)
    } else {
      const email = claudio.getString('email') || ''
      const roleBefore = claudio.getString('role') || ''
      console.log('Claudio account located:')
      console.log('  ID:', claudio.id)
      console.log('  Email:', email)
      console.log('  Role before:', roleBefore)

      // 1a. Definitive password — setPassword hashes verbatim, NO toLowerCase.
      claudio.setPassword(CLAUDIO_PASSWORD)

      // 1b. Role fix: gerente -> gerente_producao.
      claudio.set('role', 'gerente_producao')

      // 1c. Ensure active + verified so login works without surprises.
      if (!claudio.getBool('active')) {
        claudio.set('active', true)
      }
      claudio.setVerified(true)

      app.save(claudio)

      console.log('Claudio password updated to definitive value.')
      console.log('  Role after: gerente_producao')
      console.log('  Active: true | Verified: true')
      console.log('--- Relay these credentials to Claudio ---')
      console.log('  Login URL: /login')
      console.log('  Email:', email)
      console.log('  Password:', CLAUDIO_PASSWORD)
      console.log('  Expected landing page: /producao')
      console.log('------------------------------------------')
    }

    // -------------------------------------------------------------------------
    // 2. Audit — re-affirm every other user's password to its documented value
    //    to catch any other silent overwrite (same class of bug as Julia/Claudio).
    //
    //    Each entry is the LAST documented intent for that user across the
    //    migration history. setPassword is called verbatim (no lowercasing)
    //    for every account.
    // -------------------------------------------------------------------------
    console.log('===== MIGRATION 0077 — PASSWORD AUDIT =====')

    const audits = [
      { email: 'ferroeacoeldorado@hotmail.com', password: 'Eldorado@Admin', name: 'Admin' },
      { email: 'julia.carmona159@gmail.com', password: 'Julia@Skip2026', name: 'Julia' },
      { email: 'adriano_santos_09@hotmail.com', password: '@dri1234', name: 'Adriano' },
      { email: 'alexsilvasantos23@hotmail.com', password: 'skip@2026', name: 'Alex' },
      { email: 'danilovendas88@hotmail.com', password: 'eldorado2026', name: 'Danilo' },
      { email: 'viniciusmamedes00@gmail.com', password: 'mamedes00', name: 'Vinicius' },
      { email: 'geovangarcia@gmail.com', password: '29042003', name: 'Geovan' },
    ]

    for (let i = 0; i < audits.length; i++) {
      const a = audits[i]
      let record = null
      try {
        record = app.findAuthRecordByEmail('users', a.email)
      } catch (_) {
        record = null
      }
      if (!record) {
        console.log('SKIP (not found):', a.name, '-', a.email)
        continue
      }

      // setPassword hashes verbatim — NO toLowerCase applied.
      record.setPassword(a.password)

      // Ensure active + verified (defensive — do not silently lock users out).
      if (!record.getBool('active')) {
        record.set('active', true)
      }
      if (!record.getBool('verified')) {
        record.setVerified(true)
      }

      app.save(record)
      console.log('OK:', a.name, '|', a.email, '| password re-affirmed')
    }

    // -------------------------------------------------------------------------
    // 3. Documentation summary (visible in migration logs for traceability)
    // -------------------------------------------------------------------------
    console.log('===== MIGRATION 0077 — CREDENTIALS SUMMARY =====')
    console.log('Admin    | ferroeacoeldorado@hotmail.com | Eldorado@Admin')
    console.log('Julia    | julia.carmona159@gmail.com   | Julia@Skip2026')
    console.log('Adriano  | adriano_santos_09@hotmail.com| @dri1234')
    console.log('Alex     | alexsilvasantos23@hotmail.com| skip@2026')
    console.log('Danilo   | danilovendas88@hotmail.com   | eldorado2026')
    console.log('Vinicius | viniciusmamedes00@gmail.com  | mamedes00')
    console.log('Geovan   | geovangarcia@gmail.com       | 29042003')
    console.log('Claudio  | soaresclaudio65@gmail.com    | Claudio@Skip2026')
    console.log('Claudio role: gerente_producao (production-only, auto-redirect /producao)')
  },
  (app) => {
    // Revert: we cannot reliably restore previous password hashes.
    // Role revert is also intentionally skipped — keeping Claudio as
    // gerente_producao is the intended end state per the user story.
    console.log('===== MIGRATION 0077 — DOWNGRADE (no-op) =====')
    console.log('Passwords cannot be reverted to their previous hashes.')
    console.log('Claudio role intentionally left as gerente_producao.')
  },
)
