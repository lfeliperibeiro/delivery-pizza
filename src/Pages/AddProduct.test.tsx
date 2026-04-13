import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/api"
import { toast } from "sonner"
import { AddProduct } from "./AddProduct"

vi.mock("@/api", () => ({
  api: {
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

describe("AddProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  function renderAddProduct() {
    return render(<AddProduct />)
  }

  it("envia payload do produto e mostra sucesso", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({})

    renderAddProduct()

    fireEvent.change(screen.getByLabelText("Sabor da pizza"), {
      target: { value: "Calabresa" },
    })
    fireEvent.change(screen.getByLabelText("Preço"), {
      target: { value: "45" },
    })
    fireEvent.change(screen.getByLabelText("Tamanho"), {
      target: { value: "Grande" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Adicionar Produto" }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/orders/order/add_product",
        {
          name: "Calabresa",
          price: "45",
          size: "Grande",
        },
      )
    })

    expect(toast.success).toHaveBeenCalledWith("Produto adicionado com sucesso")
  })

  it("mostra erro quando o cadastro falha", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("boom"))

    renderAddProduct()

    fireEvent.change(screen.getByLabelText("Sabor da pizza"), {
      target: { value: "Portuguesa" },
    })
    fireEvent.change(screen.getByLabelText("Preço"), {
      target: { value: "50" },
    })
    fireEvent.change(screen.getByLabelText("Tamanho"), {
      target: { value: "Media" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Adicionar Produto" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao adicionar produto")
    })
  })
})
