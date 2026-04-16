import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/api"
import { toast } from "sonner"
import { AuthContext } from "@/contexts/AuthContext"
import { SignUp } from "./SignUp"

const mockNavigate = vi.fn()
const mockLogin = vi.fn()

vi.mock("@/api", () => ({
  api: {
    post: vi.fn(),
  },
}))

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
  Toaster: () => null,
}))

const authContextValue = {
  displayName: null,
  identityStatus: "anonymous" as const,
  login: mockLogin,
  logout: vi.fn(),
  isAuthenticated: false,
}

function renderSignUp() {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authContextValue}>
        <SignUp />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe("SignUp", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renderiza o formulário de cadastro", () => {
    renderSignUp()

    expect(screen.getByRole("heading", { name: /cadastro/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /cadastrar/i })).toBeInTheDocument()
    expect(screen.getByText(/voltar para o login/i)).toBeInTheDocument()
  })

  it("mantém o botão Cadastrar desabilitado quando faltam campos obrigatórios", () => {
    renderSignUp()

    expect(screen.getByRole("button", { name: /cadastrar/i })).toBeDisabled()
  })

  it("envia o payload esperado ao cadastrar", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { access_token: "novo-token", user: { name: "Maria" } },
    })

    renderSignUp()

    fireEvent.change(screen.getByPlaceholderText("email"), {
      target: { value: "maria@email.com" },
    })
    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[0], {
      target: { value: "senha123" },
    })
    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[1], {
      target: { value: "senha123" },
    })
    fireEvent.change(screen.getByPlaceholderText("nome"), {
      target: { value: "Maria" },
    })
    fireEvent.click(screen.getByRole("button", { name: /cadastrar/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/signup", {
        password: "senha123",
        confirm_password: "senha123",
        name: "Maria",
        email: "maria@email.com",
        active: false,
        admin: false,
      })
    })
  })

  it("chama login com token e payload e navega após sucesso", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { access_token: "novo-token", user: { name: "Maria" } },
    })

    renderSignUp()

    fireEvent.change(screen.getByPlaceholderText("email"), {
      target: { value: "maria@email.com" },
    })
    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[0], {
      target: { value: "senha123" },
    })
    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[1], {
      target: { value: "senha123" },
    })
    fireEvent.change(screen.getByPlaceholderText("nome"), {
      target: { value: "Maria" },
    })
    fireEvent.click(screen.getByRole("button", { name: /cadastrar/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        access_token: "novo-token",
        user: { name: "Maria" },
      })
    })

    expect(toast.success).toHaveBeenCalledWith(
      "Usuário cadastrado com sucesso",
      expect.objectContaining({
        description: "Você será redirecionado para a página inicial em 2 segundos",
      }),
    )
  })

  it("exibe toast de erro quando o cadastro falha", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("signup failed"))

    renderSignUp()

    fireEvent.change(screen.getByPlaceholderText("email"), {
      target: { value: "maria@email.com" },
    })
    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[0], {
      target: { value: "senha123" },
    })
    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[1], {
      target: { value: "senha123" },
    })
    fireEvent.change(screen.getByPlaceholderText("nome"), {
      target: { value: "Maria" },
    })
    fireEvent.click(screen.getByRole("button", { name: /cadastrar/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Erro ao cadastrar usuário",
        expect.any(Object),
      )
    })
  })

  it("volta para o login ao clicar no atalho superior", async () => {
    renderSignUp()

    fireEvent.click(screen.getByText(/voltar para o login/i))

    expect(mockNavigate).toHaveBeenCalledWith("/")
  })
})
