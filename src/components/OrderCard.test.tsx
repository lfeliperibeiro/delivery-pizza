import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/api"
import { toast } from "sonner"
import { OrderCard } from "./OrderCard"

const mockNavigate = vi.fn()

vi.mock("@/api", () => ({
  api: {
    post: vi.fn(),
  },
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock("@/assets/pizza.png", () => ({
  default: "pizza.png",
}))

vi.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    className,
  }: {
    children: React.ReactNode
    className?: string
  }) => <span data-classname={className}>{children}</span>,
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    disabled,
    onClick,
    className,
  }: {
    children: React.ReactNode
    disabled?: boolean
    onClick?: () => void
    className?: string
  }) => (
    <button type="button" disabled={disabled} onClick={onClick} data-classname={className}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" data-classname={className}>
      {children}
    </div>
  ),
  CardAction: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}))

vi.mock("./Dialog", () => ({
  Dialog: ({
    openModal,
    onFinalize,
    onCancel,
  }: {
    openModal: boolean
    onFinalize: () => void
    onCancel: () => void
  }) =>
    openModal ? (
      <div>
        <button type="button" onClick={onFinalize}>
          Confirmar finalizar
        </button>
        <button type="button" onClick={onCancel}>
          Confirmar cancelar
        </button>
      </div>
    ) : null,
}))

describe("OrderCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem("access_token", "token")
  })

  function renderOrderCard(
    overrides: Partial<Parameters<typeof OrderCard>[0]["order"]> = {},
    onRefetch = vi.fn(),
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
      ...render(<OrderCard order={order} onRefetch={onRefetch} />),
      onRefetch,
    }
  }

  it("renderiza pedido pendente dentro do prazo com detalhes", () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-12T15:00:00Z").getTime())

    renderOrderCard()

    expect(screen.getByText("Pedido dentro do prazo")).toBeInTheDocument()
    expect(screen.getByText("Pedido #12")).toBeInTheDocument()
    expect(screen.getByText("2x Produto #1")).toBeInTheDocument()
    expect(screen.getByText("Pagamento: Pix")).toBeInTheDocument()
    expect(screen.getByText("Obs: Sem cebola")).toBeInTheDocument()
    expect(screen.getByText(/Total: R\$ 50,00/)).toBeInTheDocument()
  })

  it("marca pedido pendente atrasado com destaque visual", () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-12T15:00:00Z").getTime())

    renderOrderCard({
      created_at: "2026-04-12T13:30:00Z",
    })

    expect(screen.getByText("Pedido atrasado")).toBeInTheDocument()
    expect(screen.getByTestId("card")).toHaveAttribute("data-classname", expect.stringContaining("border-orange-400"))
  })

  it("mostra status concluído e bloqueia ações quando o pedido já foi finalizado", () => {
    renderOrderCard({
      status: "Finished",
    })

    expect(screen.getByText("Concluído")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Entregue" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Editar Pedido" })).toBeDisabled()
  })

  it("mostra fallback quando não há itens ou data de criação", () => {
    renderOrderCard({
      items: [],
      created_at: null,
      notes: null,
      payment_method: null,
    })

    expect(screen.getByText("Nenhum item encontrado")).toBeInTheDocument()
    expect(screen.getByText("N/A")).toBeInTheDocument()
  })

  it("navega para edição do pedido", () => {
    renderOrderCard()

    fireEvent.click(screen.getByRole("button", { name: "Editar Pedido" }))

    expect(mockNavigate).toHaveBeenCalledWith("/orders/edit?id=12")
  })

  it("finaliza pedido com sucesso e recarrega a lista", async () => {
    const { onRefetch } = renderOrderCard()
    vi.mocked(api.post).mockResolvedValueOnce({})

    fireEvent.click(screen.getByRole("button", { name: "Finalizar ou Cancelar" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirmar finalizar" }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/orders/order/finished/12",
        { order_id: 12 },
        { headers: { Authorization: "Bearer token" } },
      )
    })

    expect(toast.success).toHaveBeenCalledWith("Pedido finalizado com sucesso")
    expect(onRefetch).toHaveBeenCalled()
  })

  it("cancela pedido com erro quando a api falha", async () => {
    renderOrderCard()
    vi.mocked(api.post).mockRejectedValueOnce(new Error("boom"))

    fireEvent.click(screen.getByRole("button", { name: "Finalizar ou Cancelar" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cancelar" }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/orders/order/cancel/12",
        { order_id: 12 },
        { headers: { Authorization: "Bearer token" } },
      )
    })

    expect(toast.error).toHaveBeenCalledWith("Erro ao cancelar pedido")
  })
})
