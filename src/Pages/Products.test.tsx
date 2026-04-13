import { act } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/api"
import { toast } from "sonner"
import { Products } from "./Products"

vi.mock("@/api", () => ({
  api: {
    get: vi.fn(),
  },
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
  Toaster: () => null,
}))

vi.mock("@/components/Loading", () => ({
  Loading: () => <div>Carregando produtos...</div>,
}))

vi.mock("@/components/ui/table", () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCaption: ({ children }: { children: React.ReactNode }) => <caption>{children}</caption>,
  TableCell: ({
    children,
    colSpan,
  }: {
    children: React.ReactNode
    colSpan?: number
  }) => <td colSpan={colSpan}>{children}</td>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
}))

describe("Products", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  async function renderProducts() {
    await act(async () => {
      render(<Products />)
    })
  }

  it("mostra loading enquanto busca produtos", () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => undefined))

    render(<Products />)

    expect(screen.getByText("Carregando produtos...")).toBeInTheDocument()
  })

  it("carrega e normaliza produtos da api", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        { product_id: 1, name: "Calabresa", price: 45, size: "Grande" },
        { product_id: 2, name: "Portuguesa", price: 50, size: "Media" },
      ],
    })

    await renderProducts()

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/orders/list")
    })

    expect(screen.getByText("Calabresa")).toBeInTheDocument()
    expect(screen.getByText("Portuguesa")).toBeInTheDocument()
    expect(screen.getByText("R$ 45,00")).toBeInTheDocument()
    expect(screen.getByText("Media")).toBeInTheDocument()
  })

  it("mostra estado vazio quando a resposta vem em formato invalido", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { products: [] },
    })

    await renderProducts()

    expect(screen.getByText("Nenhum produto encontrado.")).toBeInTheDocument()
  })

  it("mostra erro quando a busca falha", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("boom"))

    await renderProducts()

    expect(toast.error).toHaveBeenCalledWith("Erro ao buscar produtos")
    expect(screen.getByText("Nenhum produto encontrado.")).toBeInTheDocument()
  })
})
