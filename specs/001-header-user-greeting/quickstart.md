# Quickstart: Saudacao com Nome no Header

## Objetivo

Validar que o header protegido mostra `Ola, {nome do usuario}` sem quebrar
login, navegacao protegida e logout.

## Pre-requisitos

- Backend disponivel em `http://localhost:8000`
- Frontend com dependencias instaladas
- Um usuario valido para login

## Fluxo de validacao

1. Inicie o frontend com `pnpm run dev`.
2. Abra a rota publica `/`.
3. Faca login com um usuario valido.
4. Confirme que a navegacao redireciona para `/home`.
5. Verifique no header a saudacao `Ola, {nome do usuario}` junto da data atual.
6. Navegue para `/orders`, `/users` e `/analytics` e confirme que a mesma
   saudacao permanece visivel.
7. Recarregue a pagina em uma rota protegida e confirme que a saudacao continua
   disponivel.
8. Execute logout pela sidebar e confirme que a aplicacao retorna para `/` sem
   manter o nome anterior.

## Validacoes de fallback

1. Teste um caso em que o payload de autenticacao nao forneca nome amigavel.
2. Confirme que o header exibe um fallback legivel como `Ola, Usuario`.
3. Confirme que o header nao mostra `undefined`, `null` ou quebra de layout em
   telas menores.

## Validacoes tecnicas

1. Rode `pnpm lint`.
2. Rode `pnpm typecheck`.
3. Rode `pnpm build`.
