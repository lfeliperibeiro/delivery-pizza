import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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
      <div data-testid="select-values">{(values ?? []).join(",")}</div>
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => onValuesChange?.([String(product.id)])}
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

  it("carrega produtos quando a tela monta", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [{ id: 1, name: "Calabresa", price: 45, size: "Grande" }],
    })

    renderEditOrder()

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/orders/list", {
        headers: { Authorization: "Bearer token" },
      })
    })

    expect(await screen.findByRole("button", { name: "Calabresa" })).toBeInTheDocument()
  })

  it("aceita payload com data.products ao carregar produtos", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        products: [{ id: 2, name: "Portuguesa", price: 50, size: "Media" }],
      },
    })

    renderEditOrder()

    expect(await screen.findByRole("button", { name: "Portuguesa" })).toBeInTheDocument()
  })

  it("mostra erro sem token", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] })

    renderEditOrder()

    fireEvent.click(screen.getByRole("button", { name: /editar pedido/i }))

    expect(toast.error).toHaveBeenCalledWith("Faça login para criar um pedido")
  })

  it("valida seleção de produto, usuário e quantidade", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] })

    renderEditOrder()

    fireEvent.click(screen.getByRole("button", { name: /editar pedido/i }))
    expect(toast.error).toHaveBeenCalledWith("Selecione ao menos um produto")
  })

  it("valida quantidade obrigatória antes de enviar", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [{ id: 1, name: "Calabresa", price: 45, size: "Grande" }],
    })

    renderEditOrder()

    fireEvent.change(screen.getByLabelText(/id do usuário/i), {
      target: { value: "7" },
    })
    fireEvent.click(screen.getByRole("button", { name: /editar pedido/i }))

    expect(toast.error).toHaveBeenCalledWith("Selecione ao menos um produto")
  })

  it("envia a edição do pedido com sucesso e navega para home", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [{ id: 1, name: "Calabresa", price: 45, size: "Grande" }],
    })
    vi.mocked(api.put).mockResolvedValueOnce({})
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout")

    renderEditOrder()

    const productButton = await screen.findByRole("button", { name: "Calabresa" })

    fireEvent.change(screen.getByLabelText(/id do usuário/i), {
      target: { value: "7" },
    })
    fireEvent.click(productButton)
    fireEvent.change(screen.getByLabelText(/quantidade/i), {
      target: { value: "3" },
    })
    fireEvent.click(screen.getByRole("button", { name: /editar pedido/i }))

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "/orders/order/edit/12",
        {
          user_id: 7,
          products: [{ product_id: 1, quantity: 3 }],
        },
        {
          headers: { Authorization: "Bearer token" },
        },
      )
    })

    expect(toast.success).toHaveBeenCalledWith("Pedido editado com sucesso")
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000)
  })

  it("mostra erro quando a edição falha", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [{ id: 1, name: "Calabresa", price: 45, size: "Grande" }],
    })
    vi.mocked(api.put).mockRejectedValueOnce(new Error("boom"))

    renderEditOrder()

    const productButton = await screen.findByRole("button", { name: "Calabresa" })

    fireEvent.change(screen.getByLabelText(/id do usuário/i), {
      target: { value: "7" },
    })
    fireEvent.click(productButton)
    fireEvent.change(screen.getByLabelText(/quantidade/i), {
      target: { value: "2" },
    })
    fireEvent.click(screen.getByRole("button", { name: /editar pedido/i }))

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "/orders/order/edit/12",
        {
          user_id: 7,
          products: [{ product_id: 1, quantity: 2 }],
        },
        {
          headers: { Authorization: "Bearer token" },
        },
      )
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao editar pedido")
    })
  })

  it("valida id do pedido inválido", async () => {
    mockSearchParams = new URLSearchParams("")
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [{ id: 1, name: "Calabresa", price: 45, size: "Grande" }],
    })

    renderEditOrder()

    const productButton = await screen.findByRole("button", { name: "Calabresa" })

    fireEvent.change(screen.getByLabelText(/id do usuário/i), {
      target: { value: "7" },
    })
    fireEvent.click(productButton)
    fireEvent.change(screen.getByLabelText(/quantidade/i), {
      target: { value: "1" },
    })
    fireEvent.click(screen.getByRole("button", { name: /editar pedido/i }))

    expect(toast.error).toHaveBeenCalledWith("ID do pedido inválido")
  })
})
