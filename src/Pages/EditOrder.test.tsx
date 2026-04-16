import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { Mock } from "vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/api"
import { toast } from "sonner"
import { EditOrder } from "./EditOrder"

const mockNavigate = vi.fn()
let mockSearchParams = new URLSearchParams("id=12")

vi.mock("@/api", () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
  Toaster: () => null,
}))

vi.mock("@/components/Select", () => ({
  Select: ({
    products,
    values,
    onValuesChange,
  }: {
    products: Array<{ id: number; name: string }>
    values?: string[]
    onValuesChange?: (values: string[] | null) => void
  }) => (
    <div>
      <div data-testid="select-values">{(values ?? []).join(",") || "Selecione os produtos"}</div>
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() =>
            onValuesChange?.(
              (values ?? []).includes(String(product.id))
                ? (values ?? []).filter((value) => value !== String(product.id))
                : [...(values ?? []), String(product.id)],
            )
          }
        >
          {product.name}
        </button>
      ))}
    </div>
  ),
}))

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  }
})

describe("EditOrder", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    vi.clearAllMocks()
    localStorage.clear()
    mockSearchParams = new URLSearchParams("id=12")
  })

  function renderEditOrder() {
    return render(<EditOrder />)
  }

  function getProductQuantityInputs() {
    return screen.getAllByRole("spinbutton") as HTMLInputElement[]
  }

  function getProductQuantityInput(index: number) {
    return getProductQuantityInputs()[index]
  }

  function mockProductsAndOrder(
    orderData: unknown,
    productData = [{ product_id: 1, name: "Calabresa", price: 45, size: "Grande" }],
  ) {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: productData })
      .mockResolvedValueOnce({ data: orderData })
  }

  it("carrega produtos disponíveis e preenche o pedido atual", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [
          { product_id: 1, name: "Calabresa", price: 45, size: "Grande" },
          { product_id: 2, name: "Portuguesa", price: 50, size: "Media" },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            order_id: 12,
            user_id: 7,
            status: "Pending",
            total_price: 90,
            products: [{ product_id: 1, quantity: 2 }],
            created_at: "2026-04-13T10:00:00Z",
            notes: null,
            payment_method: null,
          },
        ],
      })

    renderEditOrder()

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/orders/list")
      expect(api.get).toHaveBeenCalledWith("/orders/list_order/order_user")
    })

    expect(await screen.findByRole("button", { name: "Calabresa" })).toBeInTheDocument()
    expect(screen.queryByLabelText(/id do usuário/i)).not.toBeInTheDocument()
    expect(screen.getByTestId("select-values")).toHaveTextContent("1")

    expect(getProductQuantityInput(0).value).toBe("2")
  })

  it("valida seleção de produto antes de enviar", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [{ product_id: 1, name: "Calabresa", price: 45, size: "Grande" }],
      })
      .mockResolvedValueOnce({
        data: [
          {
            order_id: 12,
            user_id: 7,
            status: "Pending",
            total_price: 45,
            products: [],
            created_at: "2026-04-13T10:00:00Z",
            notes: null,
            payment_method: null,
          },
        ],
      })

    renderEditOrder()

    await screen.findByRole("button", { name: "Calabresa" })
    fireEvent.click(screen.getByRole("button", { name: /editar pedido/i }))

    expect(toast.error).toHaveBeenCalledWith("Selecione ao menos um produto")
    expect(api.put).not.toHaveBeenCalled()
  })

  it("valida quantidade inválida para qualquer produto antes de enviar", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [{ product_id: 1, name: "Calabresa", price: 45, size: "Grande" }],
      })
      .mockResolvedValueOnce({
        data: [
          {
            order_id: 12,
            user_id: 7,
            status: "Pending",
            total_price: 45,
            products: [{ product_id: 1, quantity: 1 }],
            created_at: "2026-04-13T10:00:00Z",
            notes: null,
            payment_method: null,
          },
        ],
      })

    renderEditOrder()

    await screen.findByText("Quantidade por produto")
    fireEvent.change(getProductQuantityInput(0), { target: { value: "0" } })
    fireEvent.click(screen.getByRole("button", { name: /editar pedido/i }))

    expect(toast.error).toHaveBeenCalledWith("Informe uma quantidade válida para todos os produtos")
    expect(api.put).not.toHaveBeenCalled()
  })

  it("envia a edição com id e quantidades por produto e navega para home", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [
          { product_id: 1, name: "Calabresa", price: 45, size: "Grande" },
          { product_id: 2, name: "Portuguesa", price: 50, size: "Media" },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            order_id: 12,
            user_id: 7,
            status: "Pending",
            total_price: 45,
            products: [{ product_id: 1, quantity: 2 }],
            created_at: "2026-04-13T10:00:00Z",
            notes: null,
            payment_method: null,
          },
        ],
      })
    vi.mocked(api.put).mockResolvedValueOnce({})

    renderEditOrder()

    await screen.findByRole("button", { name: "Calabresa" })
    vi.useFakeTimers()
    expect(screen.queryByLabelText(/id do usuário/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Portuguesa" }))

    expect(getProductQuantityInputs()).toHaveLength(2)
    fireEvent.change(getProductQuantityInput(0), { target: { value: "2" } })
    fireEvent.change(getProductQuantityInput(1), { target: { value: "3" } })
    fireEvent.click(screen.getByRole("button", { name: /editar pedido/i }))

    expect(api.put).toHaveBeenCalledWith("/orders/order/edit/12", {
      id: 12,
      user_id: 7,
      products: [
        { product_id: 1, quantity: 2 },
        { product_id: 2, quantity: 3 },
      ],
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(toast.success).toHaveBeenCalledWith("Pedido editado com sucesso")
    expect(mockNavigate).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(1999)
    })
    expect(mockNavigate).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(mockNavigate).toHaveBeenCalledWith("/home")
  })

  it("mostra erro quando a edição falha", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [{ product_id: 1, name: "Calabresa", price: 45, size: "Grande" }],
      })
      .mockResolvedValueOnce({
        data: [
          {
            order_id: 12,
            user_id: 7,
            status: "Pending",
            total_price: 45,
            products: [{ product_id: 1, quantity: 2 }],
            created_at: "2026-04-13T10:00:00Z",
            notes: null,
            payment_method: null,
          },
        ],
      })
    vi.mocked(api.put).mockRejectedValueOnce(new Error("boom"))

    renderEditOrder()

    await screen.findByRole("button", { name: "Calabresa" })
    expect(screen.queryByLabelText(/id do usuário/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /editar pedido/i }))

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/orders/order/edit/12", {
        id: 12,
        user_id: 7,
        products: [{ product_id: 1, quantity: 2 }],
      })
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(toast.error).toHaveBeenCalledWith("Erro ao editar pedido")
  })

  it("mantém o formulário bloqueado quando o pedido não é encontrado", async () => {
    mockProductsAndOrder([
      {
        order_id: 99,
        user_id: 8,
        status: "Pending",
        total_price: 45,
        products: [{ product_id: 1, quantity: 2 }],
        created_at: "2026-04-13T10:00:00Z",
        notes: null,
        payment_method: null,
      },
    ])

    renderEditOrder()

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/orders/list")
      expect(api.get).toHaveBeenCalledWith("/orders/list_order/order_user")
    })

    expect(screen.queryByLabelText(/id do usuário/i)).not.toBeInTheDocument()
    expect(screen.getByTestId("select-values")).toHaveTextContent("Selecione os produtos")
    expect(screen.queryByText("Quantidade por produto")).not.toBeInTheDocument()

    const calabresaBtn = await screen.findByRole("button", { name: "Calabresa" })
    fireEvent.click(calabresaBtn)
    expect(screen.getByTestId("select-values")).toHaveTextContent("Selecione os produtos")
    fireEvent.click(screen.getByRole("button", { name: /editar pedido/i }))

    expect(toast.error).toHaveBeenCalledWith("Pedido não encontrado")
    expect(api.put).not.toHaveBeenCalled()
  })

  it("trata pedido sem user_id válido como pedido indisponível", async () => {
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
    expect(screen.queryByLabelText(/id do usuário/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /editar pedido/i }))

    expect(toast.error).toHaveBeenCalledWith("Pedido não encontrado")
    expect(api.put).not.toHaveBeenCalled()
  })

  it("lida com falha ao carregar dados iniciais sem rejeição não tratada e mantém o submit bloqueado", async () => {
    const rejectedGet = api.get as Mock
    rejectedGet
      .mockRejectedValueOnce(new Error("list failed"))
      .mockRejectedValueOnce(new Error("order failed"))

    renderEditOrder()

    await waitFor(() => {
      expect(rejectedGet).toHaveBeenCalledWith("/orders/list")
      expect(rejectedGet).toHaveBeenCalledWith("/orders/list_order/order_user")
    })

    fireEvent.click(screen.getByRole("button", { name: /editar pedido/i }))

    expect(toast.error).toHaveBeenCalledWith("Pedido não encontrado")
    expect(api.put).not.toHaveBeenCalled()
  })

  it("valida id do pedido inválido", async () => {
    mockSearchParams = new URLSearchParams("")
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [{ product_id: 1, name: "Calabresa", price: 45, size: "Grande" }],
      })
      .mockResolvedValueOnce({
        data: [
          {
            order_id: 12,
            user_id: 7,
            status: "Pending",
            total_price: 45,
            products: [{ product_id: 1, quantity: 2 }],
            created_at: "2026-04-13T10:00:00Z",
            notes: null,
            payment_method: null,
          },
        ],
      })

    renderEditOrder()

    await screen.findByRole("button", { name: "Calabresa" })
    fireEvent.click(screen.getByRole("button", { name: "Calabresa" }))
    expect(screen.queryByLabelText(/id do usuário/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /editar pedido/i }))

    expect(toast.error).toHaveBeenCalledWith("ID do pedido inválido")
    expect(api.put).not.toHaveBeenCalled()
  })
})
