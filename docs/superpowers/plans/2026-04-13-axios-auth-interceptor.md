# Axios Auth Request Interceptor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralizar a injeção do token JWT no axios, eliminando os 16 `localStorage.getItem("access_token")` espalhados por páginas e componentes.

**Architecture:** Adicionar um request interceptor à instância `api` em `src/api/index.tsx`. O interceptor lê o token do `localStorage` e injeta o header `Authorization: Bearer <token>` em todas as requisições automaticamente. Todas as páginas e componentes param de manipular o token diretamente.

**Tech Stack:** Axios (interceptors), Vitest, React 19, TypeScript

---

## Arquivos modificados

| Arquivo | Ação |
|---------|------|
| `src/api/index.tsx` | Adiciona request interceptor |
| `src/api/index.test.ts` | Adiciona testes do request interceptor |
| `src/Pages/Home.tsx` | Remove token (linha 19) e header manual |
| `src/Pages/Analytics.tsx` | Remove token (linha 36) e headers manuais |
| `src/Pages/CreateOrder.tsx` | Remove token (linhas 31, 67) e headers manuais |
| `src/Pages/EditOrder.tsx` | Remove token (linhas 31, 55) e headers manuais |
| `src/Pages/EditUser.tsx` | Remove token (linhas 38, 65) e headers manuais |
| `src/Pages/Products.tsx` | Remove token (linha 23) e header manual |
| `src/Pages/ArchivedOrders.tsx` | Remove token (linha 19) e header manual |
| `src/Pages/AddProduct.tsx` | Remove token (linha 23) e header manual |
| `src/Pages/RemoveProduct.tsx` | Remove token (linha 15) e header manual |
| `src/Pages/Users.tsx` | Remove token (linha 66) e headers manuais |
| `src/components/OrderCard.tsx` | Remove token (linha 58) e headers manuais |

---

## Task 1: Testes para o request interceptor

**Files:**
- Modify: `src/api/index.test.ts`

- [ ] **Step 1: Adicionar os testes do request interceptor em `src/api/index.test.ts`**

Adicionar este bloco ao final do arquivo (depois do describe existente):

```ts
describe("api request interceptor", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it("injeta Authorization header quando token existe no localStorage", () => {
    localStorage.setItem("access_token", "test-token-123")

    const handler = (
      api.interceptors.request as unknown as {
        handlers: Array<{ fulfilled?: (config: Record<string, unknown>) => Record<string, unknown> }>
      }
    ).handlers[0]

    const config = { headers: {} as Record<string, string> }
    const result = handler.fulfilled?.(config)

    expect((result as typeof config).headers["Authorization"]).toBe("Bearer test-token-123")
  })

  it("não injeta Authorization header quando não há token", () => {
    const handler = (
      api.interceptors.request as unknown as {
        handlers: Array<{ fulfilled?: (config: Record<string, unknown>) => Record<string, unknown> }>
      }
    ).handlers[0]

    const config = { headers: {} as Record<string, string> }
    const result = handler.fulfilled?.(config)

    expect((result as typeof config).headers["Authorization"]).toBeUndefined()
  })

  it("retorna o config em ambos os casos", () => {
    const handler = (
      api.interceptors.request as unknown as {
        handlers: Array<{ fulfilled?: (config: Record<string, unknown>) => Record<string, unknown> }>
      }
    ).handlers[0]

    const config = { headers: {}, url: "/test" }
    const result = handler.fulfilled?.(config)

    expect(result).toEqual(expect.objectContaining({ url: "/test" }))
  })
})
```

- [ ] **Step 2: Confirmar que os testes falham (interceptor ainda não existe)**

```bash
pnpm test src/api/index.test.ts
```

Esperado: FAIL — `Cannot read properties of undefined (reading 'fulfilled')` ou similar, pois `handlers[0]` do request interceptor não existe ainda.

---

## Task 2: Adicionar o request interceptor

**Files:**
- Modify: `src/api/index.tsx`

- [ ] **Step 3: Adicionar o request interceptor em `src/api/index.tsx`**

O arquivo atual termina assim:

```ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error?.response?.data?.detail

    if (detail === "Invalid token") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:invalid-token"))
      }
    }

    return Promise.reject(error)
  },
)
```

Adicionar logo abaixo (antes do fim do arquivo):

```ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

O arquivo completo deve ficar:

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error?.response?.data?.detail

    if (detail === "Invalid token") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:invalid-token"))
      }
    }

    return Promise.reject(error)
  },
)

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

- [ ] **Step 4: Confirmar que os testes passam**

```bash
pnpm test src/api/index.test.ts
```

Esperado: PASS em todos os testes do arquivo (os existentes + os 3 novos).

- [ ] **Step 5: Commit**

```bash
git add src/api/index.tsx src/api/index.test.ts
git commit -m "feat: add axios request interceptor for auth token injection"
```

---

## Task 3: Remover token de `src/Pages/Home.tsx`

**Files:**
- Modify: `src/Pages/Home.tsx`

- [ ] **Step 6: Remover leitura do token em `Home.tsx`**

Localizar (linha ~18):
```ts
async function fetchOrders(): Promise<Order[]> {
  const token = localStorage.getItem('access_token');
  try {
    const response = await api.get("/orders/list_order/order_user", {
      headers: { Authorization: `Bearer ${token}` }
    })
```

Substituir por:
```ts
async function fetchOrders(): Promise<Order[]> {
  try {
    const response = await api.get("/orders/list_order/order_user")
```

- [ ] **Step 7: Rodar os testes de Home**

```bash
pnpm test src/Pages/Home.test.tsx
```

Esperado: PASS.

---

## Task 4: Remover token de `src/Pages/Analytics.tsx`

**Files:**
- Modify: `src/Pages/Analytics.tsx`

- [ ] **Step 8: Remover leitura do token em `Analytics.tsx`**

Localizar (linha ~35):
```ts
async function fetchData(): Promise<{ orders: Order[]; productNames: ProductMap }> {
  const token = localStorage.getItem("access_token")
  const headers = { Authorization: `Bearer ${token}` }

  const [ordersRes, productsRes] = await Promise.all([
    api.get("/orders/list_order/order_user", { headers }),
    api.get("/orders/list", { headers }),
  ])
```

Substituir por:
```ts
async function fetchData(): Promise<{ orders: Order[]; productNames: ProductMap }> {
  const [ordersRes, productsRes] = await Promise.all([
    api.get("/orders/list_order/order_user"),
    api.get("/orders/list"),
  ])
```

- [ ] **Step 9: Rodar os testes de Analytics**

```bash
pnpm test src/Pages/Analytics.test.tsx
```

Esperado: PASS.

---

## Task 5: Remover token de `src/Pages/CreateOrder.tsx`

**Files:**
- Modify: `src/Pages/CreateOrder.tsx`

- [ ] **Step 10: Remover token do `useEffect` em `CreateOrder.tsx`**

Localizar (linha ~30):
```ts
  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) return

    api.get("/orders/list", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
```

Substituir por:
```ts
  useEffect(() => {
    api.get("/orders/list").then((response) => {
```

- [ ] **Step 11: Remover token do `handleCreateOrder` em `CreateOrder.tsx`**

Localizar (linha ~65):
```ts
    const token = localStorage.getItem("access_token")

    if (!token) {
      toast.error("Faça login para criar um pedido")
      return
    }
    if (!orderData.user_id || orderData.user_id <= 0) {
```

Substituir por (remover as linhas do token e do guard de token; manter a validação de user_id):
```ts
    if (!orderData.user_id || orderData.user_id <= 0) {
```

Localizar o `api.post` logo abaixo:
```ts
    api.post(
      "/orders/order",
      {
        user_id: orderData.user_id,
        products: orderData.products,
        notes: orderData.notes || null,
        payment_method: orderData.payment_method || null,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )
```

Substituir por:
```ts
    api.post(
      "/orders/order",
      {
        user_id: orderData.user_id,
        products: orderData.products,
        notes: orderData.notes || null,
        payment_method: orderData.payment_method || null,
      },
    )
```

- [ ] **Step 12: Rodar os testes de CreateOrder**

```bash
pnpm test src/Pages/CreateOrder.test.tsx
```

Esperado: PASS.

---

## Task 6: Remover token de `src/Pages/EditOrder.tsx`

**Files:**
- Modify: `src/Pages/EditOrder.tsx`

- [ ] **Step 13: Remover token do `useEffect` em `EditOrder.tsx`**

Localizar (linha ~30):
```ts
  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      return
    }
    api.get("/orders/list", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
```

Substituir por:
```ts
  useEffect(() => {
    api.get("/orders/list")
```

- [ ] **Step 14: Remover token do `handleCreateOrder` em `EditOrder.tsx`**

Localizar (linha ~53):
```ts
    const token = localStorage.getItem("access_token")

    if (!token) {
      toast.error("Faça login para criar um pedido")
      return
    }
    if (orderData.product_ids.length === 0) {
```

Substituir por (remover as linhas do token e do guard de token):
```ts
    if (orderData.product_ids.length === 0) {
```

Localizar o `api.put` logo abaixo:
```ts
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
```

Remover o terceiro argumento do `api.put` inteiramente — o método ficará com dois argumentos (url e body).

- [ ] **Step 15: Rodar os testes de EditOrder**

```bash
pnpm test src/Pages/EditOrder.test.tsx
```

Esperado: PASS.

---

## Task 7: Remover token de `src/Pages/EditUser.tsx`

**Files:**
- Modify: `src/Pages/EditUser.tsx`

- [ ] **Step 16: Remover token de `fetchUserData` em `EditUser.tsx`**

Localizar (linha ~37):
```ts
async function fetchUserData(id: string): Promise<UserData> {
  const token = localStorage.getItem("access_token")
  if (!token) return EMPTY_USER

  try {
    const response = await api.get(`/users/user/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
```

Substituir por:
```ts
async function fetchUserData(id: string): Promise<UserData> {
  try {
    const response = await api.get(`/users/user/${id}`)
```

- [ ] **Step 17: Remover token do `handleEditUser` em `EditUser.tsx`**

Localizar (linha ~64):
```ts
    const token = localStorage.getItem("access_token")
    if (!token) {
      toast.error("Faça login para editar usuário")
      return
    }

    api.put(
      `/users/user/${id}`,
      {
        name: userData.name,
        email: userData.email,
        active: userData.active,
        admin: userData.admin,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
```

Substituir por:
```ts
    api.put(
      `/users/user/${id}`,
      {
        name: userData.name,
        email: userData.email,
        active: userData.active,
        admin: userData.admin,
      },
    )
```

- [ ] **Step 18: Rodar os testes de EditUser**

```bash
pnpm test src/Pages/EditUser.test.tsx
```

Esperado: PASS.

---

## Task 8: Remover token de `src/Pages/Products.tsx`

**Files:**
- Modify: `src/Pages/Products.tsx`

- [ ] **Step 19: Remover token de `fetchProducts` em `Products.tsx`**

Localizar (linha ~22):
```ts
async function fetchProducts(): Promise<Product[]> {
  const token = localStorage.getItem("access_token")
  if (!token) {
    toast.error("Faça login para ver os produtos")
    return []
  }

  try {
    const response = await api.get("/orders/list", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
```

Substituir por:
```ts
async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await api.get("/orders/list")
```

- [ ] **Step 20: Rodar os testes de Products**

```bash
pnpm test src/Pages/Products.test.tsx
```

Esperado: PASS.

---

## Task 9: Remover token de `src/Pages/ArchivedOrders.tsx`

**Files:**
- Modify: `src/Pages/ArchivedOrders.tsx`

- [ ] **Step 21: Remover token de `fetchArchivedOrders` em `ArchivedOrders.tsx`**

Localizar (linha ~18):
```ts
async function fetchArchivedOrders(): Promise<Order[]> {
  const token = localStorage.getItem("access_token")
  const response = await api.get("/orders/list_order/order_user", {
    headers: { Authorization: `Bearer ${token}` },
  })
```

Substituir por:
```ts
async function fetchArchivedOrders(): Promise<Order[]> {
  const response = await api.get("/orders/list_order/order_user")
```

- [ ] **Step 22: Rodar os testes de ArchivedOrders**

```bash
pnpm test src/Pages/ArchivedOrders.test.tsx
```

Esperado: PASS.

---

## Task 10: Remover token de `src/Pages/AddProduct.tsx` e `src/Pages/RemoveProduct.tsx`

**Files:**
- Modify: `src/Pages/AddProduct.tsx`
- Modify: `src/Pages/RemoveProduct.tsx`

- [ ] **Step 23: Remover token de `handleAddProduct` em `AddProduct.tsx`**

Localizar (linha ~22):
```ts
    const token = localStorage.getItem("access_token")
    if (!token) {
      toast.error("Faça login para adicionar um produto")
      return
    }

    api.post(`/orders/order/add_product`, {
      name: productData.name,
      price: productData.price,
      size: productData.size,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
```

Substituir por:
```ts
    api.post(`/orders/order/add_product`, {
      name: productData.name,
      price: productData.price,
      size: productData.size,
    })
```

- [ ] **Step 24: Remover token de `handleRemoveProduct` em `RemoveProduct.tsx`**

Localizar (linha ~14):
```ts
    const token = localStorage.getItem("access_token")
    if (!token) {
      toast.error("Faça login para remover um produto")
      return
    }

    api.post(`orders/order/remove_product/${productId}`, {
      product_id: productId,
    },{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
```

Substituir por:
```ts
    api.post(`orders/order/remove_product/${productId}`, {
      product_id: productId,
    })
```

- [ ] **Step 25: Rodar os testes de AddProduct e RemoveProduct**

```bash
pnpm test src/Pages/AddProduct.test.tsx src/Pages/RemoveProduct.test.tsx
```

Esperado: PASS.

---

## Task 11: Remover token de `src/Pages/Users.tsx`

**Files:**
- Modify: `src/Pages/Users.tsx`

- [ ] **Step 26: Remover token de `fetchUsers` em `Users.tsx`**

Localizar (linha ~65):
```ts
async function fetchUsers(): Promise<User[]> {
  const token = localStorage.getItem("access_token")
  if (!token) {
    toast.error("Faça login para ver os usuários")
    return []
  }

  const headers = { Authorization: `Bearer ${token}` }

  try {
    let data: unknown
    try {
      const response = await api.get("/users/users", { headers })
      data = response.data
    } catch (firstError) {
      if (axios.isAxiosError(firstError) && firstError.response?.status === 404) {
        const response = await api.get("/users", { headers })
        data = response.data
      } else {
        throw firstError
      }
    }
```

Substituir por:
```ts
async function fetchUsers(): Promise<User[]> {
  try {
    let data: unknown
    try {
      const response = await api.get("/users/users")
      data = response.data
    } catch (firstError) {
      if (axios.isAxiosError(firstError) && firstError.response?.status === 404) {
        const response = await api.get("/users")
        data = response.data
      } else {
        throw firstError
      }
    }
```

- [ ] **Step 27: Rodar os testes de Users**

```bash
pnpm test src/Pages/Users.test.tsx
```

Esperado: PASS.

---

## Task 12: Remover token de `src/components/OrderCard.tsx`

**Files:**
- Modify: `src/components/OrderCard.tsx`

- [ ] **Step 28: Remover token de `OrderCard.tsx`**

Localizar (linha ~58):
```ts
  const token = localStorage.getItem("access_token")

  function handleFinalize() {
    api.post(`/orders/order/finished/${order.id}`, {
      order_id: order.id,
    },{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
```

Substituir (remover `const token` e headers de `handleFinalize` e `handleCancel`):

```ts
  function handleFinalize() {
    api.post(`/orders/order/finished/${order.id}`, {
      order_id: order.id,
    })
```

Localizar `handleCancel`:
```ts
  function handleCancel() {
    api.post(`/orders/order/cancel/${order.id}`, {
      order_id: order.id,
    },{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
```

Substituir por:
```ts
  function handleCancel() {
    api.post(`/orders/order/cancel/${order.id}`, {
      order_id: order.id,
    })
```

- [ ] **Step 29: Rodar os testes de OrderCard**

```bash
pnpm test src/components/OrderCard.test.tsx
```

Esperado: PASS.

---

## Task 13: Verificação final e commit

- [ ] **Step 30: Confirmar que nenhuma ocorrência remanescente existe**

```bash
grep -r "localStorage.getItem.*access_token" src/ --include="*.tsx" --include="*.ts" -l
```

Esperado: apenas `src/api/index.tsx` e `src/contexts/AuthContext.tsx` (e os arquivos de teste do AuthContext).

- [ ] **Step 31: Rodar a suite completa de testes**

```bash
pnpm test
```

Esperado: PASS em todos os testes.

- [ ] **Step 32: Commit final**

```bash
git add src/Pages/Home.tsx src/Pages/Analytics.tsx src/Pages/CreateOrder.tsx \
        src/Pages/EditOrder.tsx src/Pages/EditUser.tsx src/Pages/Products.tsx \
        src/Pages/ArchivedOrders.tsx src/Pages/AddProduct.tsx src/Pages/RemoveProduct.tsx \
        src/Pages/Users.tsx src/components/OrderCard.tsx
git commit -m "refactor: remove manual token reads, rely on axios request interceptor"
```
