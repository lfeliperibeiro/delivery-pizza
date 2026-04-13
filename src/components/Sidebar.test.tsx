import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { AuthContext } from "@/contexts/AuthContext"
import { Sidebar } from "./Sidebar"

const mockNavigate = vi.fn()
const mockLogout = vi.fn()

vi.mock("@/assets/logo", () => ({
  LogoImg: () => <div>Logo</div>,
}))

vi.mock("./ui/sidebar", () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <aside>{children}</aside>,
  SidebarHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  SidebarMenuButton: ({
    children,
    isActive,
    onClick,
  }: {
    children: React.ReactNode
    isActive?: boolean
    onClick?: () => void
  }) => (
    <div data-active={String(Boolean(isActive))} onClick={onClick}>
      {children}
    </div>
  ),
}))

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderSidebar(initialEntry = "/home") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthContext.Provider
        value={{
          token: "token",
          displayName: "Maria",
          identityStatus: "resolved",
          login: vi.fn(),
          logout: mockLogout,
          isAuthenticated: true,
        }}
      >
        <Sidebar />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe("Sidebar", () => {
  it("renderiza os links principais da navegação", () => {
    renderSidebar()

    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Pedidos")).toBeInTheDocument()
    expect(screen.getByText("Analytics")).toBeInTheDocument()
    expect(screen.getByText("Arquivados")).toBeInTheDocument()
    expect(screen.getByText("Usuários")).toBeInTheDocument()
  })

  it("marca Usuários como ativo em rota filha de usuários", () => {
    renderSidebar("/users/edit/42")

    expect(screen.getByText("Usuários").closest("div")).toHaveAttribute("data-active", "true")
  })

  it("executa logout e navega para a raiz ao clicar em logout", () => {
    renderSidebar()

    fireEvent.click(screen.getByText("logout"))

    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith("/")
  })
})
