# Testing

This document explains how to run automated tests for the CRM Ferro e Aço backend.

## Running Tests

```bash
npm test
```

This runs all unit tests in the `tests/` directory using Node.js's built-in test runner (`node --test`).

To run tests in watch mode during development:

```bash
npm run test:watch
```

## Test Structure

### Unit Tests (run by default)

- **`tests/pedidos-parsing.test.js`** — Tests the parsing/normalization functions used by the `pedidos_import` hook (`parseNum`, `parseIntSafe`, `normalizeStatus`, `normalizeCodigo`). These functions are duplicated from the hook source because PocketBase hooks run in a JSVM and cannot be imported in Node.js. Keep them in sync with the hook source when modifying the hook.

- **`tests/contatos-rules.test.js`** — Tests the `contatos` `createRule` expression to verify that:
  - A vendedor with `codigos_vendedor = [2,4]` is blocked from creating a contato for a client with `vendedor = 7`
  - A vendedor with `codigos_vendedor = [2,4]` can create a contato for a client with `vendedor = 2`
  - Admin and gerente roles are unrestricted
  - Inactive users are blocked

- **`tests/lead-cascade.test.js`** — Verifies that migration 0064 set `cascadeDelete = true` on `notificacoes.lead_id`, ensuring that deleting a lead automatically removes linked notifications. Also tests pedidos import record counting logic.

### Integration Tests

Integration tests that require a running PocketBase instance can be added as separate files in `tests/`. To run them against a test instance:

1. Start a test PocketBase instance
2. Set the `TEST_POCKETBASE_URL` environment variable
3. Create a test file that uses the `pocketbase` SDK to connect and verify behavior

## Adding New Tests

1. Create a new file in `tests/` with a `.test.js` extension
2. Use `import { describe, it } from 'node:test'` and `import assert from 'node:assert/strict'`
3. The file will be automatically picked up by `node --test tests/`

## What's Tested

| Area                                  | Test File                 | Type |
| ------------------------------------- | ------------------------- | ---- |
| Pedidos import parsing                | `pedidos-parsing.test.js` | Unit |
| Contatos createRule isolation         | `contatos-rules.test.js`  | Unit |
| Lead cascade delete + import counting | `lead-cascade.test.js`    | Unit |
