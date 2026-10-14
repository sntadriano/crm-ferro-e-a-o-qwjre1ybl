# Regras para migrations — LEIA ANTES DE CRIAR UMA NOVA

## NUNCA altere senhas de usuários em migrations

Entre junho e outubro de 2026, as senhas dos usuários foram regravadas mais de
15 vezes por migrations criadas para "consertar o login" (0021, 0024, 0025,
0027–0029, 0032–0034, 0051, 0066, 0067, 0069, 0070, 0076, 0079, 0081). Cada uma
trocou senhas sem aviso, criou divergência entre a senha real e a exibida no
painel e deixou usuários sem acesso. Por isso:

1. **Não chame `setPassword()` em migrations novas.** A única exceção já feita
   é a 0091, que apenas alinha a senha da Julia com `user_credentials`.
2. **Não escreva senhas em texto puro** em migrations, hooks ou código.
3. **Não grave `password_plain` em `user_credentials` por migration.** Esse
   valor só é atualizado pelo painel, junto com a troca real da senha.
4. **Não mexa em `passwordAuth`, `identityFields`, no campo `username` nem na
   normalização de senha do `LoginPage.tsx`** sem pedido explícito do Adriano.
5. **Não crie, duplique nem desative contas de usuário** para "resolver login".

## Como trocar uma senha

Somente por **Administração → Gerenciar Senhas** no CRM. O painel grava a senha
em minúsculas (igual ao login) e atualiza `user_credentials` ao mesmo tempo.

## Se alguém não consegue entrar

Não crie migration. Verifique, nesta ordem:

1. A versão publicada é a atual? (publicar no Skip depois de sincronizar)
2. A conta está ativa (`active = true`)?
3. O usuário está digitando o `username` mostrado no painel?
4. Troque a senha pelo painel e teste.

O teste `tests/migrations-passwords.test.js` falha se uma migration nova
(depois da 0091) chamar `setPassword` ou gravar `password_plain`.
