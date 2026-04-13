import { act } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/api"
import axios from "axios"
import { toast } from "sonner"
import { Users } from "./Users"

vi.mock("@/api", () => ({
  api: {
    get: vi.fn(),
  },
}))

vi.mock("axios", () => ({
  default: {
    isAxiosError: vi.fn(),
  },
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
  Toaster: () => null,
}))

vi.mock("@/components/Loading", () => ({
  Loading: () => <div>Carregando...</div>,
}))

vi.mock("@/components/UsersTable", () => ({
  UsersTable: ({ users }: { users: Array<{ id: number; name: string; email: string }> }) => (
    <div>
      <span data-testid="users-count">{users.length}</span>
      {users.map((user) => (
        <div key={user.id}>{`${user.name} - ${user.email}`}</div>
      ))}
      {users.length === 0 && <div>Nenhum usuário encontrado.</div>}
    </div>
  ),
}))

describe("Users", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  async function renderUsers() {
    await act(async () => {
      render(<Users />)
    })
  }

  it("carrega e normaliza usuários da resposta principal", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        users: [{ id: 1, full_name: "Maria Oliveira", email: "maria@email.com" }],
      },
    })

    await renderUsers()

    expect(await screen.findByText("Maria Oliveira - maria@email.com")).toBeInTheDocument()

    expect(screen.getByTestId("users-count")).toHaveTextContent("1")
    expect(api.get).toHaveBeenCalledWith("/users/users", {
      headers: { Authorization: "Bearer token" },
    })
  })

  it("faz fallback para /users quando /users/users retorna 404", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get)
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce({
        data: [{ user_id: 2, username: "Carlos", email: "carlos@email.com" }],
      })
    vi.mocked(axios.isAxiosError).mockReturnValue(true)

    await renderUsers()

    expect(await screen.findByText("Carlos - carlos@email.com")).toBeInTheDocument()

    expect(api.get).toHaveBeenNthCalledWith(1, "/users/users", {
      headers: { Authorization: "Bearer token" },
    })
    expect(api.get).toHaveBeenNthCalledWith(2, "/users", {
      headers: { Authorization: "Bearer token" },
    })
  })

  it("mostra erro e lista vazia quando não há token", async () => {
    await renderUsers()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Faça login para ver os usuários")
    })

    expect(await screen.findByText("Nenhum usuário encontrado.")).toBeInTheDocument()
  })

  it("mostra erro quando a busca falha fora do caso de fallback", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockRejectedValueOnce(new Error("boom"))
    vi.mocked(axios.isAxiosError).mockReturnValue(false)

    await renderUsers()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao buscar usuários")
    })

    expect(await screen.findByText("Nenhum usuário encontrado.")).toBeInTheDocument()
  })
})
