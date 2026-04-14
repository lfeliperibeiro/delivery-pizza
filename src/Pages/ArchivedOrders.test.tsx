import { act } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/api"
import { ArchivedOrders } from "./ArchivedOrders"

vi.mock("@/api", () => ({
  api: {
    get: vi.fn(),
  },
}))

vi.mock("@/components/Loading", () => ({
  Loading: () => <div>Carregando arquivados...</div>,
}))

vi.mock("@/components/OrderCard", () => ({
  OrderCard: ({
    order,
    onRefetch,
    isArchived,
  }: {
    order: { id: number; status: string; created_at: string | null; items?: Array<{ name?: string; product_id: number }> }
    onRefetch?: () => void
    isArchived?: boolean
  }) => (
    <div data-testid="archived-order-card" data-is-archived={isArchived ? "true" : "false"}>
      <span>{order.id}</span>
      <span>{order.status}</span>
      <span>{order.created_at ?? "sem-data"}</span>
      <span>{order.items?.map((item) => item.name ?? `Produto #${item.product_id}`).join(",") ?? ""}</span>
      <button type="button" onClick={onRefetch}>
        retry-from-card
      </button>
    </div>
  ),
}))

describe("ArchivedOrders", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    localStorage.clear()
  })

  async function renderArchivedOrders() {
    await act(async () => {
      render(<ArchivedOrders />)
    })
  }

  it("mostra loading enquanto carrega pedidos arquivados", () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-12T15:00:00Z").getTime())
    vi.mocked(api.get).mockImplementation(() => new Promise(() => undefined))

    render(<ArchivedOrders />)

    expect(screen.getByText("Carregando arquivados...")).toBeInTheDocument()
  })

  it("filtra pedidos antigos e ordena do mais recente para o mais antigo", async () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-12T15:00:00Z").getTime())
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [
          {
            order_id: 1,
            status: "Finished",
            total_price: 40,
            products: [{ product_id: 1, quantity: 1 }],
            created_at: "2026-04-01T10:00:00Z",
            notes: null,
            payment_method: null,
          },
          {
            order_id: 2,
            status: "Cancelled",
            total_price: 30,
            products: [{ product_id: 2, quantity: 1 }],
            created_at: "2026-04-03T10:00:00Z",
            notes: null,
            payment_method: null,
          },
          {
            order_id: 3,
            status: "Pending",
            total_price: 20,
            products: [],
            created_at: "2026-04-10T10:00:00Z",
            notes: null,
            payment_method: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          { product_id: 1, name: "Calabresa" },
          { product_id: 2, name: "Frango" },
        ],
      })

    await renderArchivedOrders()

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/orders/list_order/order_user")
      expect(api.get).toHaveBeenCalledWith("/orders/list")
    })

    const cards = screen.getAllByTestId("archived-order-card")
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent("2")
    expect(cards[0]).toHaveTextContent("Frango")
    expect(cards[1]).toHaveTextContent("1")
    expect(cards[1]).toHaveTextContent("Calabresa")
  })

  it("mostra estado vazio quando não existem pedidos arquivados", async () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-12T15:00:00Z").getTime())
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [
          {
            order_id: 3,
            status: "Pending",
            total_price: 20,
            products: [],
            created_at: "2026-04-10T10:00:00Z",
            notes: null,
            payment_method: null,
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] })

    await renderArchivedOrders()

    expect(screen.getByText("Nenhum pedido arquivado encontrado.")).toBeInTheDocument()
  })

  it("mostra estado vazio quando a api retorna formato invalido", async () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-12T15:00:00Z").getTime())
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: { orders: [] },
      })
      .mockResolvedValueOnce({ data: [] })

    await renderArchivedOrders()

    expect(screen.getByText("Nenhum pedido arquivado encontrado.")).toBeInTheDocument()
  })

  it("mostra erro e permite tentar novamente quando o refetch falha", async () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-12T15:00:00Z").getTime())
    const getMock = vi.mocked(api.get)
    let callCount = 0
    getMock.mockImplementation(async (url: string) => {
      callCount += 1

      if (callCount === 1 && url === "/orders/list_order/order_user") {
        return {
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
        }
      }

      if (callCount === 2 && url === "/orders/list") {
        return { data: [{ product_id: 1, name: "Calabresa" }] }
      }

      if (callCount === 3 || callCount === 4) {
        throw new Error("boom")
      }

      if (callCount === 5 && url === "/orders/list_order/order_user") {
        return {
          data: [
            {
              order_id: 2,
              status: "Cancelled",
              total_price: 40,
              products: [],
              created_at: "2026-04-02T10:00:00Z",
              notes: null,
              payment_method: null,
            },
          ],
        }
      }

      if (callCount === 6 && url === "/orders/list") {
        return { data: [{ product_id: 2, name: "Frango" }] }
      }

      throw new Error(`Unexpected call ${callCount} for ${url}`)
    })

    await renderArchivedOrders()

    fireEvent.click(await screen.findByRole("button", { name: "retry-from-card" }))

    expect(await screen.findByText("Erro ao carregar pedidos arquivados.")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }))

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(6)
    })

    expect(await screen.findByText("2")).toBeInTheDocument()
  })

  it("passa isArchived como true para todos os OrderCards renderizados", async () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-12T15:00:00Z").getTime())
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [
          {
            order_id: 1,
            status: "Finished",
            total_price: 40,
            products: [{ product_id: 1, quantity: 1 }],
            created_at: "2026-04-01T10:00:00Z",
            notes: null,
            payment_method: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [{ product_id: 1, name: "Calabresa" }],
      })

    await renderArchivedOrders()

    await waitFor(() => {
      const cards = screen.getAllByTestId("archived-order-card")
      cards.forEach((card) => {
        expect(card).toHaveAttribute("data-is-archived", "true")
      })
    })
  })
})
