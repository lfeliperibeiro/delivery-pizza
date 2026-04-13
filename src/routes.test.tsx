import { render, screen } from "@testing-library/react"
import { RouterProvider } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { router } from "./routes"

vi.mock("./Pages/SignIn", () => ({ SignIn: () => <div>Pagina SignIn</div> }))
vi.mock("./Pages/SignUp", () => ({ SignUp: () => <div>Pagina SignUp</div> }))
vi.mock("./Pages/Home", () => ({ Home: () => <div>Pagina Home</div> }))
vi.mock("./Pages/Orders", () => ({ Orders: () => <div>Pagina Orders</div> }))
vi.mock("./Pages/EditOrder", () => ({ EditOrder: () => <div>Pagina EditOrder</div> }))
vi.mock("./Pages/Users", () => ({ Users: () => <div>Pagina Users</div> }))
vi.mock("./Pages/EditUser", () => ({ EditUser: () => <div>Pagina EditUser</div> }))
vi.mock("./Pages/Analytics", () => ({ Analytics: () => <div>Pagina Analytics</div> }))
vi.mock("./Pages/ArchivedOrders", () => ({
  ArchivedOrders: () => <div>Pagina ArchivedOrders</div>,
}))
vi.mock("./layout", async () => {
  const { Outlet } = await import("react-router-dom")
  return {
    Layout: () => (
      <div data-testid="layout">
        <Outlet />
      </div>
    ),
  }
})

async function renderAt(path: string) {
  await router.navigate(path)
  render(<RouterProvider router={router} />)
}

describe("router", () => {
  beforeEach(async () => {
    await router.navigate("/", { replace: true })
  })

  it("rota / renderiza SignIn", async () => {
    await renderAt("/")
    expect(await screen.findByText("Pagina SignIn")).toBeInTheDocument()
  })

  it("rota /register renderiza SignUp", async () => {
    await renderAt("/register")
    expect(await screen.findByText("Pagina SignUp")).toBeInTheDocument()
  })

  it("rota /home renderiza Home dentro do Layout", async () => {
    await renderAt("/home")
    expect(await screen.findByText("Pagina Home")).toBeInTheDocument()
    expect(screen.getByTestId("layout")).toBeInTheDocument()
  })

  it("rota /orders renderiza Orders dentro do Layout", async () => {
    await renderAt("/orders")
    expect(await screen.findByText("Pagina Orders")).toBeInTheDocument()
    expect(screen.getByTestId("layout")).toBeInTheDocument()
  })

  it("rota /orders/edit renderiza EditOrder dentro do Layout", async () => {
    await renderAt("/orders/edit")
    expect(await screen.findByText("Pagina EditOrder")).toBeInTheDocument()
    expect(screen.getByTestId("layout")).toBeInTheDocument()
  })

  it("rota /users renderiza Users dentro do Layout", async () => {
    await renderAt("/users")
    expect(await screen.findByText("Pagina Users")).toBeInTheDocument()
    expect(screen.getByTestId("layout")).toBeInTheDocument()
  })

  it("rota /users/edit/:id renderiza EditUser dentro do Layout", async () => {
    await renderAt("/users/edit/42")
    expect(await screen.findByText("Pagina EditUser")).toBeInTheDocument()
    expect(screen.getByTestId("layout")).toBeInTheDocument()
  })

  it("rota /analytics renderiza Analytics dentro do Layout", async () => {
    await renderAt("/analytics")
    expect(await screen.findByText("Pagina Analytics")).toBeInTheDocument()
    expect(screen.getByTestId("layout")).toBeInTheDocument()
  })

  it("rota /archived renderiza ArchivedOrders dentro do Layout", async () => {
    await renderAt("/archived")
    expect(await screen.findByText("Pagina ArchivedOrders")).toBeInTheDocument()
    expect(screen.getByTestId("layout")).toBeInTheDocument()
  })

  it("rotas publicas nao usam o Layout", async () => {
    await renderAt("/")
    expect(await screen.findByText("Pagina SignIn")).toBeInTheDocument()
    expect(screen.queryByTestId("layout")).not.toBeInTheDocument()
  })
})
