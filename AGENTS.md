# Delivery Pizza — Arquitetura da Aplicação

## Visão Geral

SPA (Single Page Application) React para gerenciamento de pedidos de uma pizzaria delivery. Frontend puro em React 19 + TypeScript, consumindo uma API REST em `http://localhost:8000`.

---

## Stack Tecnológica

| Categoria | Tecnologia |
|-----------|-----------|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 7 |
| Roteamento | React Router v7 |
| Estilização | TailwindCSS 4 |
| Componentes UI | shadcn/ui (Radix UI) + Base UI React |
| HTTP Client | Axios 1.13 |
| Notificações | Sonner |
| Ícones | lucide-react |
| Gerenciador de pacotes | pnpm |

---

## Estrutura de Diretórios

```
src/
├── Pages/              # Componentes de página (1 por rota)
├── components/
│   ├── ui/             # Componentes shadcn/ui (primitivos)
│   └── *.tsx           # Componentes de negócio (OrderCard, Sidebar, etc.)
├── contexts/
│   └── AuthContext.tsx # Estado global de autenticação
├── hooks/
│   └── use-mobile.ts   # Hook de detecção responsiva
├── lib/
│   ├── utils.ts        # Utilitário cn() (clsx + tailwind-merge)
│   └── datetime.ts     # Formatação de datas (fuso Brasil)
├── api/
│   └── index.tsx       # Instância Axios com interceptors
├── assets/             # SVGs, imagens e logo
├── App.tsx             # Raiz: AuthProvider + RouterProvider + InvalidTokenListener
├── main.tsx            # Entry point: ThemeProvider > App
├── routes.tsx          # Definição das rotas (createBrowserRouter)
├── layout.tsx          # Layout protegido (guarda de autenticação)
└── index.css           # Estilos globais + diretivas Tailwind
```

---

## Rotas

```
/                          → SignIn (pública)
/register                  → SignUp (pública)

Rotas protegidas (Layout):
  /home                    → Home — grade com pedidos do usuário logado
  /orders                  → Orders — abas: criar pedido / gerenciar / produtos
  /orders/edit?id=...      → EditOrder
  /users                   → Users — tabela de usuários
  /users/edit/:id          → EditUser
  /analytics               → Analytics (stub)
```

O componente `Layout` verifica `isAuthenticated` e redireciona para `/` se não autenticado.

---

## Autenticação

- **Token**: JWT armazenado em `localStorage` como `access_token`
- **Header**: `Authorization: Bearer {token}` em todas as requisições via Axios
- **Interceptor** (`api/index.tsx`): detecta erro "Invalid token" → dispara evento `auth:invalid-token`
- **Listener** (`App.tsx`): escuta `auth:invalid-token` → chama `logout()` automaticamente
- **Contexto** (`AuthContext.tsx`): expõe `token`, `login()` e `logout()` via `useAuth()`

---

## Gerenciamento de Estado

Sem Redux ou Zustand — apenas padrões nativos do React:

| Escopo | Mecanismo |
|--------|-----------|
| Autenticação global | Context API (`AuthContext`) |
| Tema (dark/light) | Context API (`ThemeProvider`) + localStorage |
| Estado de formulários e UI | `useState` local em cada componente |
| Dados assíncronos | `Suspense` + hook `use()` do React 19 |

---

## Camada de API

**Base URL**: `VITE_API` (`.env` → `http://localhost:8000`)

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/auth/login` | POST | Login |
| `/auth/signup` | POST | Cadastro |
| `/orders/list_order/order_user` | GET | Pedidos do usuário |
| `/orders/list` | GET | Lista de produtos |
| `/orders/order` | POST | Criar pedido |
| `/orders/order/finished/:id` | POST | Finalizar pedido |
| `/orders/order/cancel/:id` | POST | Cancelar pedido |
| `/users/users` ou `/users` | GET | Listar usuários (com fallback) |
| `/users/user/:id` | GET / PUT | Buscar / atualizar usuário |

---

## Padrões de Implementação

### Fetch de dados (React 19)
```tsx
// Inicia fetch no render (não no effect)
const [promise] = useState(() => fetchOrders(token))

// No JSX, envolve com Suspense
<Suspense fallback={<Loading />}>
  <OrdersList promise={promise} />
</Suspense>

// Componente filho usa use() para aguardar
const data = use(promise)
```

### Recarregamento de dados
Componentes de página recebem callbacks `onRefetch` que recriam a promise:
```tsx
const [promise, setPromise] = useState(() => fetch())
const refetch = () => setPromise(fetch())
```

### Parsing defensivo de API
`Users.tsx` trata múltiplos formatos de resposta do backend com funções `extractUsersArray()` e `normalizeUser()`.

### SLA de pedidos (OrderCard)
- Calcula tempo decorrido desde a criação do pedido
- Indicadores visuais: verde (<1h), amarelo (1–2h), vermelho (>2h)
- Atualiza a cada minuto via `setInterval`

### Tema
- Tecla `d` alterna dark/light
- Persistido em localStorage
- Sincronizado entre abas via storage events

---

## Configurações

| Arquivo | Finalidade |
|---------|-----------|
| `vite.config.ts` | Plugins React + Tailwind; alias `@/` → `src/` |
| `tsconfig.app.json` | ES2022, strict, noUnusedLocals/Parameters |
| `components.json` | shadcn/ui: estilo, aliases, biblioteca de ícones |
| `.env` | `VITE_API=http://localhost:8000` |
| `.prettierrc` | Formatação de código |
| `eslint.config.js` | ESLint 9 flat config com regras React Hooks |

---

## Scripts

```bash
pnpm run dev        # Servidor de desenvolvimento Vite
pnpm run build      # Typecheck + build de produção
pnpm run lint       # ESLint
pnpm run format     # Prettier
pnpm run typecheck  # Verificação de tipos apenas
pnpm run preview    # Preview do build de produção
```

## Active Technologies
- TypeScript 5.9 + React 19 + React Router v7, Axios 1.13, Tailwind CSS 4, shadcn/ui sidebar primitives, Sonner (001-header-user-greeting)
- Browser `localStorage` for `access_token` plus minimal cached authenticated-user snapshot dedicated to header identity (001-header-user-greeting)
- TypeScript 5.9 + React 19 + React Router v7, Axios, Tailwind CSS 4, shadcn/ui, Sonner (002-archived-orders)
- Browser `localStorage` for `access_token`; backend-managed persistence outside this repo (002-archived-orders)

## Recent Changes
- 001-header-user-greeting: Added TypeScript 5.9 + React 19 + React Router v7, Axios 1.13, Tailwind CSS 4, shadcn/ui sidebar primitives, Sonner
