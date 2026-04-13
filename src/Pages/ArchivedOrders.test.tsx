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
  }: {
    order: { id: number; status: string; created_at: string | null }
    onRefetch?: () => void
  }) => (
    <div data-testid="archived-order-card">
      <span>{order.id}</span>
      <span>{order.status}</span>
      <span>{order.created_at ?? "sem-data"}</span>
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
    localStorage.setItem("access_token", "token")
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
        {
          order_id: 2,
          status: "Cancelled",
          total_price: 30,
          products: [],
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

    await renderArchivedOrders()

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/orders/list_order/order_user", {
        headers: { Authorization: "Bearer token" },
      })
    })

    const cards = screen.getAllByTestId("archived-order-card")
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent("2")
    expect(cards[1]).toHaveTextContent("1")
  })

  it("mostra estado vazio quando não existem pedidos arquivados", async () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-12T15:00:00Z").getTime())
    vi.mocked(api.get).mockResolvedValue({
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

    await renderArchivedOrders()

    expect(screen.getByText("Nenhum pedido arquivado encontrado.")).toBeInTheDocument()
  })

  it("mostra estado vazio quando a api retorna formato invalido", async () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-12T15:00:00Z").getTime())
    vi.mocked(api.get).mockResolvedValue({
      data: { orders: [] },
    })

    await renderArchivedOrders()

    expect(screen.getByText("Nenhum pedido arquivado encontrado.")).toBeInTheDocument()
  })

  it("mostra erro e permite tentar novamente quando o refetch falha", async () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-12T15:00:00Z").getTime())
    vi.mocked(api.get)
      .mockResolvedValueOnce({
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
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({
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
      })

    await renderArchivedOrders()

    fireEvent.click(await screen.findByRole("button", { name: "retry-from-card" }))

    expect(await screen.findByText("Erro ao carregar pedidos arquivados.")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }))

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(3)
    })

    expect(await screen.findByText("2")).toBeInTheDocument()
  })
})
