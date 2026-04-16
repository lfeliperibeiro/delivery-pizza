import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { AuthContext } from "@/contexts/AuthContext"
import { Layout } from "./layout"

vi.mock("./components/Sidebar", () => ({
  Sidebar: () => <aside>Sidebar</aside>,
}))

vi.mock("./components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  SidebarTrigger: () => <button type="button">toggle</button>,
  SidebarInset: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}))

function renderLayoutWithAuth(
  authValue: React.ContextType<typeof AuthContext>,
  initialEntry = "/home",
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<div>Tela de login</div>} />
        <Route
          path="/home"
          element={
            <AuthContext.Provider value={authValue}>
              <Layout />
            </AuthContext.Provider>
          }
        >
          <Route index element={<div>Conteudo protegido</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe("Layout", () => {
  it("renderiza a saudação com o nome do usuário autenticado", () => {
    renderLayoutWithAuth({
      displayName: "Felipe",
      identityStatus: "resolved",
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
    })

    expect(screen.getByText("Ola,")).toBeInTheDocument()
    expect(screen.getByText("Felipe")).toBeInTheDocument()
    expect(screen.getByText("Conteudo protegido")).toBeInTheDocument()
  })

  it("usa fallback legível quando o nome não está disponível", () => {
    renderLayoutWithAuth({
      displayName: null,
      identityStatus: "fallback",
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
    })

    expect(screen.getByText("Usuario")).toBeInTheDocument()
  })

  it("redireciona para a rota pública quando não autenticado", () => {
    renderLayoutWithAuth({
      displayName: null,
      identityStatus: "anonymous",
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: false,
    })

    expect(screen.getByText("Tela de login")).toBeInTheDocument()
    expect(screen.queryByText("Conteudo protegido")).not.toBeInTheDocument()
  })
})
