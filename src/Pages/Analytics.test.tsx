import { act } from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/api"
import { Analytics } from "./Analytics"

vi.mock("@/api", () => ({
  api: {
    get: vi.fn(),
  },
}))

vi.mock("@/components/Loading", () => ({
  Loading: () => <div>Carregando...</div>,
}))

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ data, children }: { data?: unknown; children: React.ReactNode }) => (
    <div>
      <div data-testid="bar-chart-data">{JSON.stringify(data)}</div>
      {children}
    </div>
  ),
  Bar: () => <div>Bar</div>,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ data }: { data?: unknown }) => (
    <div data-testid="pie-chart-data">{JSON.stringify(data)}</div>
  ),
  Legend: () => null,
}))

describe("Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem("access_token", "token")
  })

  async function renderAnalytics() {
    await act(async () => {
      render(<Analytics />)
    })
  }

  it("renderiza loading enquanto os dados não resolvem", () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => undefined))

    render(<Analytics />)

    expect(screen.getByText("Carregando...")).toBeInTheDocument()
  })

  it("calcula cards e dados de gráficos a partir dos pedidos e produtos", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [
          {
            order_id: 1,
            status: "Finished",
            total_price: 50,
            products: [
              { product_id: 10, quantity: 2 },
              { product_id: 11, quantity: 1 },
            ],
            created_at: "2026-01-01T10:00:00",
          },
          {
            order_id: 2,
            status: "Pending",
            total_price: 30,
            products: [{ product_id: 10, quantity: 1 }],
            created_at: "2026-01-02T10:00:00",
          },
          {
            order_id: 3,
            status: "Cancelled",
            total_price: 15,
            products: [],
            created_at: "2026-01-03T10:00:00",
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          { product_id: 10, name: "Calabresa" },
          { product_id: 11, name: "Portuguesa" },
        ],
      })

    await renderAnalytics()

    expect(screen.getByRole("heading", { name: "Analytics" })).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText(/50,00/)).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()

    expect(screen.getByTestId("bar-chart-data")).toHaveTextContent("Pendente")
    expect(screen.getByTestId("bar-chart-data")).toHaveTextContent("Concluído")
    expect(screen.getByTestId("bar-chart-data")).toHaveTextContent("Cancelado")

    expect(screen.getByTestId("pie-chart-data")).toHaveTextContent("Calabresa")
    expect(screen.getByTestId("pie-chart-data")).toHaveTextContent("Portuguesa")
  })

  it("mostra estado vazio quando não existem dados para os gráficos", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })

    await renderAnalytics()

    expect(screen.getAllByText("Nenhum dado disponível")).toHaveLength(2)
  })
})
