import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { App } from "./App"

const mockLogout = vi.fn()
const mockRouterProvider = vi.fn(() => <div>Router</div>)

vi.mock("./routes", () => ({
  router: { mock: true },
}))

vi.mock("react-router-dom", () => ({
  RouterProvider: (props: unknown) => mockRouterProvider(props),
}))

vi.mock("./contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    logout: mockLogout,
  }),
}))

describe("App", () => {
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "http://localhost/home" },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    })
  })

  it("renderiza o RouterProvider dentro do shell da aplicação", () => {
    const { getByText } = render(<App />)

    expect(getByText("Router")).toBeInTheDocument()
    expect(mockRouterProvider).toHaveBeenCalled()
  })

  it("executa logout e redireciona ao receber auth:invalid-token", () => {
    render(<App />)

    window.dispatchEvent(new Event("auth:invalid-token"))

    expect(mockLogout).toHaveBeenCalled()
    expect(window.location.href).toBe("/")
  })
})
