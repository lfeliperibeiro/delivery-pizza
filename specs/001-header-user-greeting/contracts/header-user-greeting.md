# Contract: Header User Greeting

## Scope

Documenta o contrato esperado entre o fluxo de autenticacao do frontend e o
header protegido para exibir `Ola, {nome do usuario}`.

## Input Contracts

### Login request

- **Endpoint**: `POST /auth/login`
- **Auth**: publica
- **Payload esperado**:

```json
{
  "email": "operador@pizzaria.com",
  "password": "senha"
}
```

### Login response accepted by the frontend

O frontend deve continuar aceitando o contrato atual e normalizar qualquer um
dos formatos abaixo sem quebrar o fluxo de login:

```json
{
  "access_token": "<jwt>"
}
```

```json
{
  "access_token": "<jwt>",
  "user": {
    "name": "Nome do Usuario"
  }
}
```

```json
{
  "access_token": "<jwt>",
  "name": "Nome do Usuario"
}
```

## Normalization Rules

- O frontend deve priorizar `user.name`, depois `name`, depois claims comuns do
  JWT como `name`, `username`, `full_name`, `email` e `sub`.
- O valor final deve ser aparado com `trim()`.
- Se nenhum nome legivel for encontrado, o frontend deve usar um fallback como
  `Usuario`.

## Local Session Contract

- **Storage key obrigatoria**: `access_token`
- **Storage key adicional planejada**: `auth_user`
- **Shape planejado**:

```json
{
  "displayName": "Nome do Usuario",
  "source": "login-response"
}
```

## Presentation Contract

- O header protegido deve renderizar `Ola, {displayName}`.
- O header deve continuar exibindo a data atual ja presente no layout.
- O header nao deve mostrar `undefined`, `null` ou string vazia.

## Logout and Invalid Token Contract

- `logout()` deve remover `access_token` e `auth_user`.
- O listener de `auth:invalid-token` deve continuar chamando `logout()` para
  limpar a saudacao junto da sessao.
