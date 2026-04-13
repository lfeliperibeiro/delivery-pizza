import { act } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/api"
import { Home } from "./Home"

vi.mock("@/api", () => ({
  api: {
    get: vi.fn(),
  },
}))

vi.mock("@/components/Loading", () => ({
  Loading: () => <div>Carregando pedidos...</div>,
}))

vi.mock("@/components/OrderCard", () => ({
  OrderCard: ({
    order,
    onRefetch,
  }: {
    order: { id: number; status: string; items: Array<{ product_id: number; quantity: number }> }
    onRefetch?: () => void
  }) => (
    <div data-testid="order-card">
      <span>{order.id}</span>
      <span>{order.status}</span>
      <span>{order.items.length}</span>
      <button type="button" onClick={onRefetch}>
        refetch-{order.id}
      </button>
    </div>
  ),
}))

function getRecentDate() {
  return new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
}

function getOldDate() {
  return new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
}

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  async function renderHome() {
    await act(async () => {
      render(<Home />)
    })
  }

  it("mostra loading enquanto carrega os pedidos", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockImplementationOnce(
      () => new Promise(() => undefined),
    )

    await renderHome()

    expect(screen.getByText("Carregando pedidos...")).toBeInTheDocument()
  })

  it("carrega, normaliza e ordena pedidos pendentes primeiro", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          order_id: 2,
          status: "Finished",
          total_price: 60,
          products: [{ product_id: 2, quantity: 1 }],
          created_at: getRecentDate(),
          notes: "Sem cebola",
          payment_method: "Pix",
        },
        {
          order_id: 1,
          status: "Pending",
          total_price: 45,
          products: [{ product_id: 1, quantity: 2 }],
          created_at: getRecentDate(),
          notes: null,
          payment_method: "Cartao",
        },
      ],
    })

    await renderHome()

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/orders/list_order/order_user", {
        headers: { Authorization: "Bearer token" },
      })
    })

    const cards = await screen.findAllByTestId("order-card")
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent("1")
    expect(cards[0]).toHaveTextContent("Pending")
    expect(cards[1]).toHaveTextContent("2")
    expect(cards[1]).toHaveTextContent("Finished")
  })

  it("filtra pedidos com mais de sete dias", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          order_id: 1,
          status: "Pending",
          total_price: 45,
          products: [],
          created_at: getOldDate(),
          notes: null,
          payment_method: null,
        },
      ],
    })

    await renderHome()

    expect(await screen.findByText("No orders found.")).toBeInTheDocument()
    expect(screen.queryByTestId("order-card")).not.toBeInTheDocument()
  })

  it("mostra estado vazio quando a api retorna formato invalido", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockResolvedValue({
      data: { orders: [] },
    })

    await renderHome()

    expect(await screen.findByText("No orders found.")).toBeInTheDocument()
  })

  it("mostra estado vazio quando a busca falha", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockRejectedValue(new Error("boom"))

    render(<Home />)

    expect(await screen.findByText("No orders found.")).toBeInTheDocument()
  })

  it("refaz a busca quando um card dispara onRefetch", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [
          {
            order_id: 1,
            status: "Pending",
            total_price: 45,
            products: [{ product_id: 1, quantity: 1 }],
            created_at: getRecentDate(),
            notes: null,
            payment_method: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            order_id: 2,
            status: "Finished",
            total_price: 50,
            products: [{ product_id: 2, quantity: 1 }],
            created_at: getRecentDate(),
            notes: null,
            payment_method: null,
          },
        ],
      })

    await renderHome()

    fireEvent.click(await screen.findByRole("button", { name: "refetch-1" }))

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2)
    })

    expect(await screen.findByRole("button", { name: "refetch-2" })).toBeInTheDocument()
  })
})
