import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/api"
import { toast } from "sonner"
import { RemoveProduct } from "./RemoveProduct"

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

describe("RemoveProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  function renderRemoveProduct() {
    return render(<RemoveProduct />)
  }

  it("mostra erro sem token", () => {
    renderRemoveProduct()

    fireEvent.click(screen.getByRole("button", { name: "Remover Produto" }))

    expect(toast.error).toHaveBeenCalledWith("Faça login para remover um produto")
    expect(api.post).not.toHaveBeenCalled()
  })

  it("envia remoção de produto com sucesso", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.post).mockResolvedValueOnce({})

    renderRemoveProduct()

    fireEvent.change(screen.getByLabelText("ID do produto"), {
      target: { value: "8" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Remover Produto" }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "orders/order/remove_product/8",
        { product_id: 8 },
        {
          headers: {
            Authorization: "Bearer token",
          },
        },
      )
    })

    expect(toast.success).toHaveBeenCalledWith("Produto removido com sucesso")
  })

  it("mostra erro quando a remoção falha", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.post).mockRejectedValueOnce(new Error("boom"))

    renderRemoveProduct()

    fireEvent.change(screen.getByLabelText("ID do produto"), {
      target: { value: "8" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Remover Produto" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao remover produto")
    })
  })
})
