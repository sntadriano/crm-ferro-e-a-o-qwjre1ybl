migrate(
  (app) => {
    // =========================================================================
    // 0078 — Fix data leakage between vendedores caused by substring matching
    // =========================================================================
    //
    // Background:
    //   Migration 0057 introduced `@request.auth.codigos_vendedor ~ vendedor`
    //   to scope vendedor visibility to their own portfolio. The `~` operator
    //   performs a text "contains" match. Because `codigos_vendedor` is a JSON
    //   field (not a native multi-value select), `~` coerces both sides to
    //   text and does substring matching.
    //
    //   Concrete leak: Vinicius has `codigos_vendedor = [13]`. With `~`,
    //   the rule checks whether the text "[13]" contains the client's
    //   `vendedor` number as a substring — so codes `1` and `3` match
    //   ("13" contains "1" and "3"), leaking 226 extra clients to him.
    //
    // Fix:
    //   Replace `~` with `?=` (PocketBase "array contains — exact" operator).
    //   `?=` checks whether the left array contains an element exactly equal
    //   to the right value. Applied to `clientes`, `leads`, and `contatos`
    //   rules wherever `codigos_vendedor` is compared against a vendedor code.
    //
    //   Admin / gerente / julia bypass paths are unchanged.
    // =========================================================================

    // --- clientes -------------------------------------------------------------
    // listRule / viewRule: swap `~` for `?=` (exact array membership).
    const clientes = app.findCollectionByNameOrId('clientes')
    const clienteRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && @request.auth.codigos_vendedor ?= vendedor)))"
    clientes.listRule = clienteRule
    clientes.viewRule = clienteRule
    app.save(clientes)

    // --- leads ----------------------------------------------------------------
    // listRule / viewRule: `codigos_vendedor ?= cliente_id.vendedor`
    // (expanded relation field on the lead's linked cliente).
    const leads = app.findCollectionByNameOrId('leads')
    const leadRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && @request.auth.codigos_vendedor ?= cliente_id.vendedor)))"
    leads.listRule = leadRule
    leads.viewRule = leadRule
    app.save(leads)

    // --- contatos -------------------------------------------------------------
    // listRule / viewRule (migration 0076 shape): vendedor sees own
    // "possivel_cliente" records (usuario_id = self) OR portfolio records —
    // portfolio branch now uses `?=` instead of `~`.
    const contatos = app.findCollectionByNameOrId('contatos')
    const contatoListRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || (@request.auth.role = 'vendedor' && (possivel_cliente = true && usuario_id = @request.auth.id || @request.auth.codigos_vendedor ?= cliente_id.vendedor))))"
    contatos.listRule = contatoListRule
    contatos.viewRule = contatoListRule

    // createRule (migration 0075 shape): vendedor may create for portfolio
    // client (exact match) OR for a "possivel_cliente" prospect.
    contatos.createRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || (@request.auth.role = 'vendedor' && (possivel_cliente = true || @request.auth.codigos_vendedor ?= cliente_id.vendedor)))"

    // updateRule (migration 0057 shape): portfolio only — exact match.
    contatos.updateRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || (@request.auth.role = 'vendedor' && @request.auth.codigos_vendedor ?= cliente_id.vendedor))"

    // deleteRule unchanged (admin / gerente only).
    app.save(contatos)

    console.log('===== MIGRATION 0078 — EXACT ARRAY MEMBERSHIP FIX =====')
    console.log('clientes list/view: codigos_vendedor ?= vendedor')
    console.log('leads   list/view: codigos_vendedor ?= cliente_id.vendedor')
    console.log('contatos list/view/create/update: ?= applied to portfolio branches')
    console.log('Leak via substring match on JSON codigos_vendedor is closed.')
  },
  (app) => {
    // Revert to the pre-0078 `~` (substring) rules. This restores the
    // documented state from migrations 0057 / 0075 / 0076 — including the
    // known leak, since the fix is intentionally opt-in.
    const clientes = app.findCollectionByNameOrId('clientes')
    const clienteRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && @request.auth.codigos_vendedor ~ vendedor)))"
    clientes.listRule = clienteRule
    clientes.viewRule = clienteRule
    app.save(clientes)

    const leads = app.findCollectionByNameOrId('leads')
    const leadRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || @request.auth.role = 'julia' || (@request.auth.role = 'vendedor' && @request.auth.codigos_vendedor ~ cliente_id.vendedor)))"
    leads.listRule = leadRule
    leads.viewRule = leadRule
    app.save(leads)

    const contatos = app.findCollectionByNameOrId('contatos')
    const contatoListRule =
      "@request.auth.role = 'admin' || (@request.auth.active = true && (@request.auth.role = 'gerente' || (@request.auth.role = 'vendedor' && (possivel_cliente = true && usuario_id = @request.auth.id || @request.auth.codigos_vendedor ~ cliente_id.vendedor))))"
    contatos.listRule = contatoListRule
    contatos.viewRule = contatoListRule
    contatos.createRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || (@request.auth.role = 'vendedor' && (possivel_cliente = true || @request.auth.codigos_vendedor ~ cliente_id.vendedor)))"
    contatos.updateRule =
      "@request.auth.active = true && (@request.auth.role = 'admin' || @request.auth.role = 'gerente' || (@request.auth.role = 'vendedor' && @request.auth.codigos_vendedor ~ cliente_id.vendedor))"
    app.save(contatos)
  },
)
