# Data Model: Saudacao com Nome no Header

## AuthenticatedSession

**Purpose**: Representar o estado global da sessao autenticada usado pelo layout
protegido.

**Fields**:

- `token: string | null` — JWT atual persistido como `access_token`.
- `isAuthenticated: boolean` — indica se existe sessao ativa.
- `displayName: string | null` — nome normalizado a ser exibido no header.
- `identityStatus: "resolved" | "fallback" | "anonymous"` — informa se o nome
  veio do backend, de fallback local ou se ainda nao ha identidade nominal.

**Validation Rules**:

- `isAuthenticated` deve ser `true` apenas quando `token` existir.
- `displayName` deve ser `null` ou uma string aparada sem espacamentos
  desnecessarios.
- `identityStatus` deve ser coerente com a origem do `displayName`.

**State Transitions**:

- `anonymous` -> `resolved`: login ou restore resolve nome valido.
- `anonymous` -> `fallback`: sessao valida sem nome amigavel disponivel.
- `resolved|fallback` -> `anonymous`: logout manual ou token invalido.

## AuthenticatedUserSnapshot

**Purpose**: Snapshot serializavel minimo persistido para manter a saudacao no
header entre navegacoes e refresh.

**Fields**:

- `displayName: string` — nome ou fallback legivel.
- `source: "login-response" | "jwt-claim" | "fallback"` — origem da identidade.

**Validation Rules**:

- `displayName` nao deve ser string vazia.
- `source` deve refletir a estrategia de normalizacao aplicada.

## ProtectedHeaderGreeting

**Purpose**: Representar o estado de apresentacao do header protegido.

**Fields**:

- `greetingText: string` — texto final exibido, por exemplo `Ola, Felipe`.
- `dateText: string` — data localizada ja exibida no layout.
- `isFallback: boolean` — sinaliza quando a saudacao nao veio de um nome
  completo resolvido.

**Validation Rules**:

- `greetingText` nunca deve renderizar `null`, `undefined` ou string vazia.
- `dateText` deve continuar formatado em `pt-BR`.
