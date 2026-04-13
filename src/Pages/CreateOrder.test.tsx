import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/api"
import { toast } from "sonner"
import { CreateOrder } from "./CreateOrder"

vi.mock("@/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
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
      <div data-testid="select-label">{(values ?? []).join(",") || "Selecione os produtos"}</div>
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

describe("CreateOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  function renderCreateOrder() {
    return render(<CreateOrder />)
  }

  it("carrega os produtos disponíveis ao montar a tela", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [
        { product_id: 1, name: "Calabresa", price: 45, size: "Grande" },
        { product_id: 2, name: "Portuguesa", price: 50, size: "Media" },
      ],
    })

    renderCreateOrder()

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/orders/list")
    })

    expect(await screen.findByRole("button", { name: "Calabresa" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Portuguesa" })).toBeInTheDocument()
  })

  it("valida user_id obrigatório", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] })

    renderCreateOrder()

    fireEvent.click(screen.getByRole("button", { name: /criar pedido/i }))

    expect(toast.error).toHaveBeenCalledWith("Informe um usuário válido")
  })

  it("valida seleção de produto antes do submit", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [{ product_id: 1, name: "Calabresa", price: 45, size: "Grande" }],
    })

    renderCreateOrder()

    fireEvent.change(screen.getByLabelText(/id do usuário/i), {
      target: { value: "7" },
    })
    fireEvent.click(screen.getByRole("button", { name: /criar pedido/i }))

    expect(toast.error).toHaveBeenCalledWith("Selecione ao menos um produto")
  })

  it("atualiza a quantidade do produto selecionado antes do submit", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [{ product_id: 1, name: "Calabresa", price: 45, size: "Grande" }],
    })
    vi.mocked(api.post).mockResolvedValueOnce({})

    renderCreateOrder()

    fireEvent.change(screen.getByLabelText(/id do usuário/i), {
      target: { value: "7" },
    })
    fireEvent.click(await screen.findByRole("button", { name: "Calabresa" }))

    const quantitySection = screen.getByText("Quantidade por produto").closest("div")
    const quantityInput = quantitySection?.querySelector('input[min="1"]') as HTMLInputElement | null
    expect(quantityInput).not.toBeNull()
    fireEvent.change(quantityInput, { target: { value: "3" } })
    await waitFor(() => {
      expect(quantityInput?.value).toBe("3")
    })
    fireEvent.click(screen.getByRole("button", { name: /criar pedido/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/orders/order",
        {
          user_id: 7,
          products: [{ product_id: 1, quantity: 3 }],
          notes: null,
          payment_method: null,
        },
      )
    })
  })

  it("envia o pedido com notes e payment_method nulos quando vazios", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [{ product_id: 1, name: "Calabresa", price: 45, size: "Grande" }],
    })
    vi.mocked(api.post).mockResolvedValueOnce({})

    renderCreateOrder()

    fireEvent.change(screen.getByLabelText(/id do usuário/i), {
      target: { value: "7" },
    })
    fireEvent.click(await screen.findByRole("button", { name: "Calabresa" }))
    fireEvent.click(screen.getByRole("button", { name: /criar pedido/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/orders/order",
        {
          user_id: 7,
          products: [{ product_id: 1, quantity: 1 }],
          notes: null,
          payment_method: null,
        },
      )
    })

    expect(toast.success).toHaveBeenCalledWith("Pedido criado com sucesso")
    expect(screen.getByTestId("select-label")).toHaveTextContent("Selecione os produtos")
  })

  it("mostra erro quando a criação do pedido falha", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [{ product_id: 1, name: "Calabresa", price: 45, size: "Grande" }],
    })
    vi.mocked(api.post).mockRejectedValueOnce(new Error("create failed"))

    renderCreateOrder()

    fireEvent.change(screen.getByLabelText(/id do usuário/i), {
      target: { value: "7" },
    })
    fireEvent.click(await screen.findByRole("button", { name: "Calabresa" }))
    fireEvent.change(screen.getByLabelText(/método de pagamento/i), {
      target: { value: "Pix" },
    })
    fireEvent.change(screen.getByLabelText(/observações/i), {
      target: { value: "Sem cebola" },
    })
    fireEvent.click(screen.getByRole("button", { name: /criar pedido/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao criar pedido")
    })
  })
})
