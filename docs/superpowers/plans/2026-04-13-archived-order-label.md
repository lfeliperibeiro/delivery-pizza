# Archived Order Label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a neutral "Arquivado" badge on `OrderCard` when displayed on the archived orders page.

**Architecture:** Add an optional `isArchived?: boolean` prop directly to the `OrderCard` component interface. When `true`, render a second `<Badge>` with an `Archive` icon inside `CardAction`, alongside the existing status badge. `ArchivedOrders.tsx` passes `isArchived={true}` to every card; `Home.tsx` is untouched.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, lucide-react, Vitest + Testing Library

---

## Files

| File | Change |
|------|--------|
| `src/components/OrderCard.tsx` | Add `isArchived?: boolean` to `Order` interface; import `Archive` from lucide-react; render badge conditionally |
| `src/Pages/ArchivedOrders.tsx` | Pass `isArchived={true}` to each `<OrderCard>` in `ArchivedOrderGrid` |
| `src/components/OrderCard.test.tsx` | Add `isArchived` param to `renderOrderCard` helper; add 2 tests |
| `src/Pages/ArchivedOrders.test.tsx` | Update `OrderCard` mock to capture `isArchived`; add 1 test |

---

## Task 1: Add `isArchived` badge to `OrderCard`

**Files:**
- Modify: `src/components/OrderCard.tsx`
- Test: `src/components/OrderCard.test.tsx`

- [ ] **Step 1: Write the failing tests**

In `src/components/OrderCard.test.tsx`, update `renderOrderCard` to accept `isArchived` and add two new tests at the end of the `describe` block:

```tsx
// Update the helper signature (lines 100-119 currently):
function renderOrderCard(
  overrides: Partial<Parameters<typeof OrderCard>[0]["order"]> = {},
  onRefetch = vi.fn(),
  isArchived?: boolean,
) {
  const order = {
    id: 12,
    status: "Pending",
    price: 50,
    items: [{ product_id: 1, quantity: 2 }],
    created_at: "2026-04-12T14:30:00Z",
    notes: "Sem cebola",
    payment_method: "Pix",
    ...overrides,
  }

  return {
    ...render(<OrderCard order={order} onRefetch={onRefetch} isArchived={isArchived} />),
    onRefetch,
  }
}

// Add these two tests inside the existing describe("OrderCard", ...) block:
it("mostra badge Arquivado quando isArchived é true", () => {
  renderOrderCard({}, vi.fn(), true)
  expect(screen.getByText("Arquivado")).toBeInTheDocument()
})

it("não mostra badge Arquivado quando isArchived não é passado", () => {
  renderOrderCard()
  expect(screen.queryByText("Arquivado")).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm test src/components/OrderCard.test.tsx --run
```

Expected: the two new tests FAIL with something like `Unable to find an element with the text: Arquivado` / `isArchived` prop type error.

- [ ] **Step 3: Implement the change in `OrderCard.tsx`**

Add `Archive` to the lucide-react import (line 1 area — currently imports `PersonStanding` etc from Sidebar; in `OrderCard.tsx` there are no lucide imports yet, so add a new import):

```tsx
import { Archive } from "lucide-react"
```

Update the `Order` interface (the component props — around line 34-37) to add `isArchived`:

```tsx
interface Order {
  order: OrderCardProps
  onRefetch: () => void
  isArchived?: boolean
}
```

Update the component signature to destructure `isArchived` (line 40):

```tsx
export function OrderCard({order, onRefetch, isArchived}: Order) {
```

Inside the JSX, in `CardAction` (currently renders only the `slaBadge` badge, around line 149-153), add the conditional badge immediately after the existing one:

```tsx
<CardAction>
  <Badge variant="secondary" className={slaBadge.className}>
    {slaBadge.label}
  </Badge>
  {isArchived && (
    <Badge variant="secondary" className="bg-slate-500 text-white flex items-center gap-1">
      <Archive className="h-3 w-3" />
      Arquivado
    </Badge>
  )}
</CardAction>
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test src/components/OrderCard.test.tsx --run
```

Expected: all tests PASS.

- [ ] **Step 5: Typecheck**

```bash
pnpm typecheck
```

Expected: zero errors.

---

## Task 2: Pass `isArchived={true}` from `ArchivedOrders`

**Files:**
- Modify: `src/Pages/ArchivedOrders.tsx`
- Test: `src/Pages/ArchivedOrders.test.tsx`

- [ ] **Step 1: Write the failing test**

In `src/Pages/ArchivedOrders.test.tsx`, update the `OrderCard` mock (lines 17-34) to capture and expose `isArchived`, then add one new test:

```tsx
// Replace the existing OrderCard mock with:
vi.mock("@/components/OrderCard", () => ({
  OrderCard: ({
    order,
    onRefetch,
    isArchived,
  }: {
    order: { id: number; status: string; created_at: string | null }
    onRefetch?: () => void
    isArchived?: boolean
  }) => (
    <div data-testid="archived-order-card" data-is-archived={isArchived ? "true" : "false"}>
      <span>{order.id}</span>
      <span>{order.status}</span>
      <span>{order.created_at ?? "sem-data"}</span>
      <button type="button" onClick={onRefetch}>
        retry-from-card
      </button>
    </div>
  ),
}))

// Add this test inside the describe("ArchivedOrders", ...) block:
it("passa isArchived como true para todos os OrderCards renderizados", async () => {
  vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-12T15:00:00Z").getTime())
  vi.mocked(api.get).mockResolvedValue({
    data: [
      {
        order_id: 1,
        status: "Finished",
        total_price: 40,
        products: [],
        created_at: "2026-04-01T10:00:00Z",
        notes: null,
        payment_method: null,
      },
    ],
  })

  await renderArchivedOrders()

  await waitFor(() => {
    const cards = screen.getAllByTestId("archived-order-card")
    cards.forEach((card) => {
      expect(card).toHaveAttribute("data-is-archived", "true")
    })
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm test src/Pages/ArchivedOrders.test.tsx --run
```

Expected: the new test FAILS — `data-is-archived` is `"false"` since `isArchived` is not passed yet.

- [ ] **Step 3: Pass `isArchived={true}` in `ArchivedOrders.tsx`**

In `src/Pages/ArchivedOrders.tsx`, find the `<OrderCard>` render in `ArchivedOrderGrid` (line 63):

```tsx
// Before:
<OrderCard key={order.id} order={order} onRefetch={onRefetch} />

// After:
<OrderCard key={order.id} order={order} onRefetch={onRefetch} isArchived={true} />
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test src/Pages/ArchivedOrders.test.tsx --run
```

Expected: all tests PASS.

- [ ] **Step 5: Run full test suite**

```bash
pnpm test --run
```

Expected: all tests PASS, zero failures.

- [ ] **Step 6: Typecheck and build**

```bash
pnpm typecheck && pnpm build
```

Expected: zero errors, successful build.

---

## Task 3: Commit

- [ ] **Step 1: Commit**

```bash
git add src/components/OrderCard.tsx src/components/OrderCard.test.tsx src/Pages/ArchivedOrders.tsx src/Pages/ArchivedOrders.test.tsx
git commit -m "feat: show Arquivado badge on archived order cards"
```
