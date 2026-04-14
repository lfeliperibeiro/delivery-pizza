# OrderCard Product Names Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer `OrderCard` exibir nomes reais de produtos em vez de `Produto #<id>` quando esses nomes puderem ser resolvidos pelas páginas.

**Architecture:** `Home` e `ArchivedOrders` buscarão `/orders/list` além de `/orders/list_order/order_user`, montarão um mapa `product_id -> name` e enriquecerão os itens dos pedidos antes de renderizar `OrderCard`. O `OrderCard` passará a suportar `name?: string` nos itens e usará fallback apenas quando o nome não existir.

**Tech Stack:** React 19, TypeScript, Axios, Vitest, Testing Library

---

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/components/OrderCard.tsx` | Renderiza `item.name` quando disponível |
| `src/components/OrderCard.test.tsx` | Cobre nome real e fallback |
| `src/Pages/Home.tsx` | Busca `/orders/list` e enriquece os itens |
| `src/Pages/Home.test.tsx` | Ajusta mocks para duas chamadas e valida nomes enriquecidos |
| `src/Pages/ArchivedOrders.tsx` | Busca `/orders/list` e enriquece os itens |
| `src/Pages/ArchivedOrders.test.tsx` | Ajusta mocks para duas chamadas e valida nomes enriquecidos |

---

### Task 1: Ajustar `OrderCard` para aceitar nome de produto

**Files:**
- Modify: `src/components/OrderCard.tsx`
- Test: `src/components/OrderCard.test.tsx`

- [ ] **Step 1: Atualizar o tipo `OrderItem`**

Em `src/components/OrderCard.tsx`, trocar:

```ts
export interface OrderItem {
  product_id: number,
  quantity: number,
}
```

por:

```ts
export interface OrderItem {
  product_id: number
  quantity: number
  name?: string
}
```

- [ ] **Step 2: Renderizar `name` com fallback**

Trocar o trecho:

```tsx
{item.quantity}x Produto #{item.product_id}
```

por:

```tsx
{item.quantity}x {item.name ?? `Produto #${item.product_id}`}
```

- [ ] **Step 3: Atualizar os testes do card**

Em `src/components/OrderCard.test.tsx`:

- no teste principal, usar:

```ts
items: [{ product_id: 1, quantity: 2, name: "Calabresa" }]
```

e esperar:

```ts
expect(screen.getByText("2x Calabresa")).toBeInTheDocument()
```

- adicionar um teste de fallback:

```ts
it("mostra fallback do produto quando o nome não é fornecido", () => {
  renderOrderCard({
    items: [{ product_id: 1, quantity: 2 }],
  })

  expect(screen.getByText("2x Produto #1")).toBeInTheDocument()
})
```

- [ ] **Step 4: Executar os testes do card**

Run: `pnpm vitest run src/components/OrderCard.test.tsx`

Expected: PASS.

---

### Task 2: Enriquecer itens em `Home`

**Files:**
- Modify: `src/Pages/Home.tsx`
- Test: `src/Pages/Home.test.tsx`

- [ ] **Step 5: Buscar produtos junto com pedidos**

Em `fetchOrders()`, trocar a chamada simples por:

```ts
const [ordersRes, productsRes] = await Promise.all([
  api.get("/orders/list_order/order_user"),
  api.get("/orders/list"),
])
```

- [ ] **Step 6: Montar mapa de nomes e enriquecer itens**

Adicionar a lógica:

```ts
type RawProduct = { product_id: number; name: string }
const productNames: Record<number, string> = {}

if (Array.isArray(productsRes.data)) {
  ;(productsRes.data as RawProduct[]).forEach((product) => {
    productNames[product.product_id] = product.name
  })
}
```

e mapear os itens assim:

```ts
items: (o.products ?? []).map((item: OrderItem) => ({
  ...item,
  name: productNames[item.product_id],
})),
```

- [ ] **Step 7: Ajustar os testes de `Home`**

Em `src/Pages/Home.test.tsx`, atualizar os mocks para duas respostas (`/orders/list_order/order_user` e `/orders/list`) e fazer o mock de `OrderCard` expor os nomes recebidos. Validar que um pedido com `product_id: 2` chega ao card com o nome correto, por exemplo `Frango`.

- [ ] **Step 8: Executar os testes de `Home`**

Run: `pnpm vitest run src/Pages/Home.test.tsx`

Expected: PASS.

---

### Task 3: Enriquecer itens em `ArchivedOrders`

**Files:**
- Modify: `src/Pages/ArchivedOrders.tsx`
- Test: `src/Pages/ArchivedOrders.test.tsx`

- [ ] **Step 9: Buscar produtos junto com pedidos arquivados**

Em `fetchArchivedOrders()`, usar:

```ts
const [ordersRes, productsRes] = await Promise.all([
  api.get("/orders/list_order/order_user"),
  api.get("/orders/list"),
])
```

- [ ] **Step 10: Enriquecer os itens antes de renderizar**

Aplicar a mesma estratégia de `Home`:

```ts
items: (o.products ?? []).map((item: OrderItem) => ({
  ...item,
  name: productNames[item.product_id],
})),
```

- [ ] **Step 11: Ajustar os testes de `ArchivedOrders`**

Em `src/Pages/ArchivedOrders.test.tsx`, atualizar os mocks para as duas respostas e validar que o `OrderCard` mock recebe o item enriquecido com nome.

- [ ] **Step 12: Executar os testes relevantes**

Run: `pnpm vitest run src/Pages/ArchivedOrders.test.tsx src/components/OrderCard.test.tsx src/Pages/Home.test.tsx`

Expected: PASS em todos os arquivos.

- [ ] **Step 13: Commit**

```bash
git add src/components/OrderCard.tsx src/components/OrderCard.test.tsx src/Pages/Home.tsx src/Pages/Home.test.tsx src/Pages/ArchivedOrders.tsx src/Pages/ArchivedOrders.test.tsx
git commit -m "feat: show product names in order cards"
```
