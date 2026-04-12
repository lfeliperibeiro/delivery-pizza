# Research: Saudacao com Nome no Header

## Decision 1: Manter o nome do usuario no estado global de autenticacao

**Decision**: Estender o `AuthContext` para expor um snapshot minimo do usuario
autenticado com `displayName`, preservando `access_token` como fonte primaria da
sessao.

**Rationale**: O header protegido e compartilhado por varias rotas e precisa
acessar a identidade do usuario sem duplicar logica em paginas. Centralizar o
nome no contexto evita prop drilling, respeita a arquitetura atual e simplifica
logout e refresh.

**Alternatives considered**:

- Ler o nome diretamente no `Layout` por pagina. Rejeitado porque espalha
  logica de sessao fora do contexto central.
- Salvar apenas o token e recalcular tudo no componente do header. Rejeitado
  porque nem todo token garante um nome amigavel e isso aumenta o acoplamento do
  layout com detalhes do contrato de autenticacao.

## Decision 2: Resolver o nome sem depender de nova rota bloqueante

**Decision**: Normalizar o nome a partir do resultado de login quando existir
informacao de usuario no payload e, na ausencia dela, aplicar fallback local a
partir de claims comuns do JWT ou de um texto padrao legivel.

**Rationale**: O inventario de endpoints conhecido no projeto nao inclui uma
rota dedicada para "usuario atual". Evitar uma chamada extra no carregamento do
layout preserva responsividade e reduz risco de regressao no shell protegido.

**Alternatives considered**:

- Buscar `/users/user/:id` apos o login. Rejeitado porque o fluxo atual nao
  expoe o `id` do usuario autenticado de forma garantida.
- Criar dependencia obrigatoria de um novo endpoint backend. Rejeitado porque o
  escopo atual e um plano frontend e a feature deve aproveitar o contrato ja
  existente sempre que possivel.
- Exibir o email digitado no login como nome. Rejeitado porque o pedido do
  usuario e mostrar o nome do usuario, nao o identificador de login.

## Decision 3: Persistencia e limpeza do nome exibido

**Decision**: Persistir o snapshot minimo do usuario autenticado em
`localStorage` junto do token e limpa-lo em `logout()` e no fluxo
`auth:invalid-token`.

**Rationale**: O projeto ja restaura a sessao a partir de `localStorage`; manter
o nome no mesmo nivel garante que a saudacao reapareca apos refresh e seja
removida imediatamente ao encerrar a sessao.

**Alternatives considered**:

- Nao persistir o nome. Rejeitado porque o header perderia a identidade apos
  recarregar a pagina.
- Persistir todos os dados do usuario. Rejeitado porque a feature exige apenas o
  minimo necessario para identificacao visual no header.
