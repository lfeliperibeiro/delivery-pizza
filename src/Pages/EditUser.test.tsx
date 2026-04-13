import { act } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/api"
import { toast } from "sonner"
import { EditUser } from "./EditUser"

const mockNavigate = vi.fn()

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

vi.mock("@/components/Checkbox", () => ({
  Checkbox: ({
    id,
    label,
    checked,
    onChange,
  }: {
    id: string
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
  }) => (
    <label htmlFor={id}>
      {label}
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  ),
}))

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "7" }),
  }
})

describe("EditUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  async function renderEditUser() {
    await act(async () => {
      render(<EditUser />)
    })
  }

  it("carrega e normaliza os dados do usuário", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { user: { name: "Maria", email: "maria@email.com", is_active: true, is_admin: false } },
    })

    await renderEditUser()

    expect(await screen.findByDisplayValue("Maria")).toBeInTheDocument()
    expect(screen.getByDisplayValue("maria@email.com")).toBeInTheDocument()
    expect(screen.getByLabelText("Usuário Ativo")).toBeChecked()
    expect(screen.getByLabelText("Usuário Admin")).not.toBeChecked()
  })

  it("mostra erro ao carregar usuário quando a busca falha", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockRejectedValueOnce(new Error("load failed"))

    await renderEditUser()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao carregar usuário")
    })

    expect(await screen.findByRole("button", { name: /editar usuário/i })).toBeInTheDocument()
  })

  it("mostra erro ao salvar quando não há token", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { user: { name: "Maria", email: "maria@email.com", active: true, admin: false } },
    })

    await renderEditUser()

    fireEvent.click(await screen.findByRole("button", { name: /editar usuário/i }))

    expect(toast.error).toHaveBeenCalledWith("Faça login para editar usuário")
    expect(api.put).not.toHaveBeenCalled()
  })

  it("envia o payload editado e exibe sucesso", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { user: { name: "Maria", email: "maria@email.com", active: true, admin: false } },
    })
    vi.mocked(api.put).mockResolvedValueOnce({})

    await renderEditUser()

    fireEvent.change(await screen.findByDisplayValue("Maria"), {
      target: { value: "Maria Silva" },
    })
    fireEvent.change(screen.getByDisplayValue("maria@email.com"), {
      target: { value: "maria.silva@email.com" },
    })
    fireEvent.click(screen.getByLabelText("Usuário Admin"))
    fireEvent.click(screen.getByRole("button", { name: /editar usuário/i }))

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "/users/user/7",
        {
          name: "Maria Silva",
          email: "maria.silva@email.com",
          active: true,
          admin: true,
        },
        {
          headers: {
            Authorization: "Bearer token",
          },
        },
      )
    })

    expect(toast.success).toHaveBeenCalledWith("Usuário editado com sucesso")
  })

  it("mostra erro quando a edição falha", async () => {
    localStorage.setItem("access_token", "token")
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { user: { name: "Maria", email: "maria@email.com", active: true, admin: false } },
    })
    vi.mocked(api.put).mockRejectedValueOnce(new Error("save failed"))

    await renderEditUser()

    fireEvent.click(await screen.findByRole("button", { name: /editar usuário/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao editar usuário")
    })
  })
})
