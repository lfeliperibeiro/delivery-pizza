import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { SignIn } from "./SignIn"
import { api } from "@/api"
import { toast } from "sonner"
import { AuthContext } from "@/contexts/AuthContext"

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

// AuthContext mock value
const mockLogin = vi.fn()
const authContextValue = {
  token: null,
  displayName: null,
  identityStatus: "anonymous" as const,
  login: mockLogin,
  logout: vi.fn(),
  isAuthenticated: false,
}

function renderSignIn() {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authContextValue}>
        <SignIn />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe("SignIn", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renderiza o formulário de login", () => {
    renderSignIn()
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument()
  })

  it("botão Login fica desabilitado quando campos estão vazios", () => {
    renderSignIn()
    expect(screen.getByRole("button", { name: /login/i })).toBeDisabled()
  })

  it("exibe link para registro", () => {
    renderSignIn()
    const link = screen.getByRole("link", { name: /clique aqui/i })
    expect(link).toHaveAttribute("href", "/register")
  })

  it("chama api.post com email e password ao submeter", async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { access_token: "fake-token", name: "João" },
    })
    renderSignIn()

    const emailInput = screen.getByPlaceholderText("email")
    const passwordInput = screen.getByLabelText(/senha/i)

    await user.type(emailInput, "joao@email.com")
    await user.type(passwordInput, "senha123")

    expect(screen.getByRole("button", { name: /login/i })).not.toBeDisabled()

    await user.click(screen.getByRole("button", { name: /login/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        email: "joao@email.com",
        password: "senha123",
      })
    })
  })

  it("chama login do contexto com token após sucesso", async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { access_token: "meu-token", name: "João" },
    })
    renderSignIn()

    await user.type(screen.getByPlaceholderText("email"), "joao@email.com")
    await user.type(screen.getByLabelText(/senha/i), "senha123")
    await user.click(screen.getByRole("button", { name: /login/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("meu-token", {
        access_token: "meu-token",
        name: "João",
      })
    })
  })

  it("exibe toast de erro em falha de login", async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockRejectedValueOnce(new Error("Unauthorized"))
    renderSignIn()

    await user.type(screen.getByPlaceholderText("email"), "errado@email.com")
    await user.type(screen.getByLabelText(/senha/i), "errado")
    await user.click(screen.getByRole("button", { name: /login/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Usuário não encontrado ou senha inválida",
        expect.any(Object),
      )
    })
  })
})
