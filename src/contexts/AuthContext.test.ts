import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { createElement, Fragment } from "react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { api } from "@/api"
import { AuthProvider, useAuth } from "./AuthContext"

vi.mock("@/api", () => ({
  api: {
    post: vi.fn(),
  },
}))

function AuthProbe() {
  const { displayName, identityStatus, isAuthenticated } = useAuth()
  return createElement(
    Fragment,
    null,
    createElement("span", { "data-testid": "display-name" }, displayName ?? "null"),
    createElement("span", { "data-testid": "identity-status" }, identityStatus),
    createElement("span", { "data-testid": "is-authenticated" }, String(isAuthenticated)),
  )
}

function AuthControls() {
  const { displayName, userId, identityStatus, isAuthenticated, login, logout } = useAuth()
  return createElement(
    Fragment,
    null,
    createElement("span", { "data-testid": "control-display-name" }, displayName ?? "null"),
    createElement("span", { "data-testid": "control-user-id" }, userId !== null ? String(userId) : "null"),
    createElement("span", { "data-testid": "control-identity-status" }, identityStatus),
    createElement("span", { "data-testid": "control-authenticated" }, String(isAuthenticated)),
    createElement(
      "button",
      { onClick: () => login({ user: { name: "Maria Oliveira", id: 42 } }) },
      "login-with-payload",
    ),
    createElement(
      "button",
      { onClick: () => login() },
      "login-no-payload",
    ),
    createElement("button", { onClick: logout }, "logout"),
  )
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("inicia como não autenticado", () => {
    render(createElement(AuthProvider, null, createElement(AuthProbe)))
    expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false")
    expect(screen.getByTestId("identity-status")).toHaveTextContent("anonymous")
    expect(screen.getByTestId("display-name")).toHaveTextContent("null")
  })

  it("faz login com payload e atualiza estado", () => {
    render(createElement(AuthProvider, null, createElement(AuthControls)))
    fireEvent.click(screen.getByRole("button", { name: "login-with-payload" }))
    expect(screen.getByTestId("control-display-name")).toHaveTextContent("Maria Oliveira")
    expect(screen.getByTestId("control-user-id")).toHaveTextContent("42")
    expect(screen.getByTestId("control-identity-status")).toHaveTextContent("resolved")
    expect(screen.getByTestId("control-authenticated")).toHaveTextContent("true")
  })

  it("faz login sem payload e usa nome padrão e userId null", () => {
    render(createElement(AuthProvider, null, createElement(AuthControls)))
    fireEvent.click(screen.getByRole("button", { name: "login-no-payload" }))
    expect(screen.getByTestId("control-display-name")).toHaveTextContent("Usuario")
    expect(screen.getByTestId("control-user-id")).toHaveTextContent("null")
    expect(screen.getByTestId("control-identity-status")).toHaveTextContent("fallback")
    expect(screen.getByTestId("control-authenticated")).toHaveTextContent("true")
  })

  it("faz logout chamando api.post e limpando estado", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({})
    render(createElement(AuthProvider, null, createElement(AuthControls)))

    fireEvent.click(screen.getByRole("button", { name: "login-with-payload" }))
    expect(screen.getByTestId("control-authenticated")).toHaveTextContent("true")

    fireEvent.click(screen.getByRole("button", { name: "logout" }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/logout")
    })

    await waitFor(() => {
      expect(screen.getByTestId("control-authenticated")).toHaveTextContent("false")
    })
    expect(screen.getByTestId("control-display-name")).toHaveTextContent("null")
    expect(screen.getByTestId("control-identity-status")).toHaveTextContent("anonymous")
  })

  it("limpa estado no logout mesmo quando api.post falha", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("Network error"))
    render(createElement(AuthProvider, null, createElement(AuthControls)))

    fireEvent.click(screen.getByRole("button", { name: "login-with-payload" }))
    fireEvent.click(screen.getByRole("button", { name: "logout" }))

    await waitFor(() => {
      expect(screen.getByTestId("control-authenticated")).toHaveTextContent("false")
    })
    expect(screen.getByTestId("control-display-name")).toHaveTextContent("null")
  })
})

describe("useAuth", () => {
  it("lança erro quando usado fora do provider", () => {
    expect(() => render(createElement(AuthProbe))).toThrow(
      "useAuth must be used within an AuthProvider",
    )
  })
})
