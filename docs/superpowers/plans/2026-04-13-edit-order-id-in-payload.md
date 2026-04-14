# Edit Order With Automatic User ID Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer `EditOrder` carregar o pedido atual, remover o input de `user_id`, permitir editar apenas produtos e quantidades, e enviar `id` + `user_id` automaticamente no body da edição.

**Architecture:** `EditOrder` continuará lendo o `id` pela query string e carregando o pedido atual por `/orders/list_order/order_user`. O `user_id` continuará no estado interno e no payload, mas deixará de existir como campo visível no formulário; a UI ficará restrita ao select de produtos e às quantidades por produto.

**Tech Stack:** React 19, TypeScript, Axios, Vitest, Testing Library

---

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/Pages/EditOrder.tsx` | Remove o input de `user_id` e mantém esse valor apenas como dado carregado do pedido |
| `src/Pages/EditOrder.test.tsx` | Ajusta os testes para validar ausência do input e envio automático de `user_id` |

---

### Task 1: Ajustar os testes para `user_id` automático

**Files:**
- Modify: `src/Pages/EditOrder.test.tsx`

- [ ] **Step 1: Validar que o formulário não renderiza `ID do usuário`**

Adicionar esta asserção aos cenários principais depois do `renderEditOrder()`:

```ts
expect(screen.queryByLabelText(/id do usuário/i)).not.toBeInTheDocument()
```

- [ ] **Step 2: Remover interações com o antigo input**

Remover qualquer `fireEvent.change(...)` voltado a `/id do usuário/i`. Os testes devem passar a depender apenas do `user_id` carregado automaticamente pelo pedido mockado.

- [ ] **Step 3: Garantir que o payload ainda envia `user_id`**

No teste de sucesso, manter a expectativa:

```ts
expect(api.put).toHaveBeenCalledWith("/orders/order/edit/12", {
  id: 12,
  user_id: 7,
  products: [
    { product_id: 1, quantity: 2 },
    { product_id: 2, quantity: 3 },
  ],
})
```

- [ ] **Step 4: Cobrir pedido carregado sem `user_id` válido**

Adicionar este teste:

```ts
it("bloqueia o envio quando o pedido carregado não traz user_id válido", async () => {
  mockProductsAndOrder([
    {
      order_id: 12,
      user_id: null,
      status: "Pending",
      total_price: 45,
      products: [{ product_id: 1, quantity: 2 }],
      created_at: "2026-04-13T10:00:00Z",
      notes: null,
      payment_method: null,
    },
  ])

  renderEditOrder()

  await screen.findByRole("button", { name: "Calabresa" })
  fireEvent.click(screen.getByRole("button", { name: /editar pedido/i }))

  expect(toast.error).toHaveBeenCalledWith("Informe um usuário válido")
  expect(api.put).not.toHaveBeenCalled()
})
```

- [ ] **Step 5: Confirmar falha antes da implementação**

Run: `pnpm vitest run src/Pages/EditOrder.test.tsx`

Expected: FAIL, porque a implementação atual ainda renderiza o input `ID do usuário`.

---

### Task 2: Remover o input de `user_id` da tela

**Files:**
- Modify: `src/Pages/EditOrder.tsx`
- Test: `src/Pages/EditOrder.test.tsx`

- [ ] **Step 6: Remover o bloco visual de `ID do usuário`**

Excluir o bloco do JSX que renderiza o label e o `Input` de `user_id`. O formulário deve começar diretamente pela seção de produtos:

```tsx
<div className="flex w-full flex-col gap-2">
  <label>Produtos</label>
  <Select
    products={products}
    multiple
    values={selectedIds}
    onValuesChange={handleProductSelect}
  />
</div>
```

- [ ] **Step 7: Manter `user_id` apenas como dado carregado**

O `user_id` continua sendo preenchido somente aqui:

```ts
setOrderData({
  id: currentOrder.order_id,
  user_id: currentOrder.user_id,
  products: Array.isArray(currentOrder.products) ? currentOrder.products : [],
})
```

Não deve restar nenhum `onChange` ou atualização manual de `user_id`.

- [ ] **Step 8: Preservar validação e payload**

No submit, manter:

```ts
if (!orderData.user_id || orderData.user_id <= 0) {
  toast.error("Informe um usuário válido")
  return
}
```

e manter o payload:

```ts
{
  id: orderData.id,
  user_id: orderData.user_id,
  products: orderData.products,
}
```

- [ ] **Step 9: Executar os testes específicos**

Run: `pnpm vitest run src/Pages/EditOrder.test.tsx`

Expected: PASS em todos os testes do arquivo.

- [ ] **Step 10: Commit**

```bash
git add src/Pages/EditOrder.tsx src/Pages/EditOrder.test.tsx
git commit -m "refactor: remove user id input from edit order"
```
