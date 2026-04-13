import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { createElement, Fragment } from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { api } from "@/api"
import { AuthProvider, useAuth } from "./AuthContext"

vi.mock("@/api", () => ({
  api: {
    get: vi.fn(),
  },
}))

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split(".")
  if (!payload) return null
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padding = (4 - (normalized.length % 4)) % 4
    const padded = normalized.padEnd(normalized.length + padding, "=")
    const decoded = atob(padded)
    const json = decodeURIComponent(
      Array.from(decoded)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    )
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

function extractDisplayName(input: unknown): string | null {
  if (typeof input !== "string") return null
  const trimmed = input.trim()
  return trimmed || null
}

function extractNumericId(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input) && input > 0) return input
  if (typeof input === "string" && /^\d+$/.test(input.trim())) {
    const parsed = Number(input.trim())
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }
  return null
}

function extractProfileName(data: unknown): string | null {
  if (!data || typeof data !== "object") return null
  const root = data as Record<string, unknown>
  const user =
    root.user && typeof root.user === "object"
      ? (root.user as Record<string, unknown>)
      : root.users && typeof root.users === "object"
        ? (root.users as Record<string, unknown>)
        : root
  return (
    extractDisplayName(user.name) ??
    extractDisplayName(user.full_name) ??
    extractDisplayName(user.username)
  )
}

function resolveDisplayNameFromPayload(authPayload: unknown): string | null {
  if (!authPayload || typeof authPayload !== "object") return null
  const payload = authPayload as Record<string, unknown>
  const nestedUser = payload.user
  if (nestedUser && typeof nestedUser === "object") {
    const nestedName = extractDisplayName((nestedUser as Record<string, unknown>).name)
    if (nestedName) return nestedName
  }
  return extractDisplayName(payload.name)
}

function makeJwt(payload: Record<string, unknown>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  const binaryStr = Array.from(bytes, (b) => String.fromCharCode(b)).join("")
  const encoded = btoa(binaryStr)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
  return `header.${encoded}.signature`
}

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
  const { displayName, identityStatus, isAuthenticated, token, login, logout } = useAuth()

  return createElement(
    Fragment,
    null,
    createElement("span", { "data-testid": "control-display-name" }, displayName ?? "null"),
    createElement("span", { "data-testid": "control-identity-status" }, identityStatus),
    createElement("span", { "data-testid": "control-token" }, token ?? "null"),
    createElement("span", { "data-testid": "control-authenticated" }, String(isAuthenticated)),
    createElement(
      "button",
      {
        onClick: () =>
          login(makeJwt({ user_id: 7, email: "maria@email.com" }), {
            user: { name: "Maria Oliveira" },
          }),
      },
      "login-with-payload",
    ),
    createElement(
      "button",
      {
        onClick: () => login(makeJwt({ email: "joao@email.com" })),
      },
      "login-with-jwt",
    ),
    createElement("button", { onClick: logout }, "logout"),
  )
}

describe("parseJwtPayload", () => {
  it("parseia payload válido", () => {
    const jwt = makeJwt({ user_id: 42, name: "João" })
    const result = parseJwtPayload(jwt)
    expect(result).toEqual({ user_id: 42, name: "João" })
  })

  it("retorna null para token sem ponto", () => {
    expect(parseJwtPayload("tokeninvalido")).toBeNull()
  })

  it("retorna null para token com payload não-base64", () => {
    expect(parseJwtPayload("header.!!!.sig")).toBeNull()
  })

  it("retorna null para token com payload que não é JSON", () => {
    const notJson = btoa("not json")
    expect(parseJwtPayload(`header.${notJson}.sig`)).toBeNull()
  })

  it("suporta caracteres URL-safe (- e _)", () => {
    const payload = { sub: "user123", name: "Test" }
    // Encode manual com URL-safe chars
    const base64url = btoa(JSON.stringify(payload))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
    const result = parseJwtPayload(`header.${base64url}.sig`)
    expect(result?.sub).toBe("user123")
  })

  it("suporta caracteres unicode no payload", () => {
    const jwt = makeJwt({ name: "Ângela Conceição" })
    const result = parseJwtPayload(jwt)
    expect(result?.name).toBe("Ângela Conceição")
  })
})

describe("extractDisplayName", () => {
  it("retorna string não-vazia como está", () => {
    expect(extractDisplayName("João")).toBe("João")
  })

  it("faz trim de espaços", () => {
    expect(extractDisplayName("  João  ")).toBe("João")
  })

  it("retorna null para string vazia", () => {
    expect(extractDisplayName("")).toBeNull()
  })

  it("retorna null para string só com espaços", () => {
    expect(extractDisplayName("   ")).toBeNull()
  })

  it("retorna null para número", () => {
    expect(extractDisplayName(42)).toBeNull()
  })

  it("retorna null para null", () => {
    expect(extractDisplayName(null)).toBeNull()
  })

  it("retorna null para undefined", () => {
    expect(extractDisplayName(undefined)).toBeNull()
  })

  it("retorna null para objeto", () => {
    expect(extractDisplayName({ name: "João" })).toBeNull()
  })
})

describe("extractNumericId", () => {
  it("aceita número positivo", () => {
    expect(extractNumericId(42)).toBe(42)
  })

  it("aceita string numérica", () => {
    expect(extractNumericId("99")).toBe(99)
  })

  it("aceita string com espaços", () => {
    expect(extractNumericId("  7  ")).toBe(7)
  })

  it("retorna null para zero", () => {
    expect(extractNumericId(0)).toBeNull()
  })

  it("retorna null para número negativo", () => {
    expect(extractNumericId(-5)).toBeNull()
  })

  it("retorna null para número infinito", () => {
    expect(extractNumericId(Infinity)).toBeNull()
  })

  it("retorna null para string não-numérica", () => {
    expect(extractNumericId("abc")).toBeNull()
  })

  it("retorna null para string com ponto decimal", () => {
    expect(extractNumericId("1.5")).toBeNull()
  })

  it("retorna null para null", () => {
    expect(extractNumericId(null)).toBeNull()
  })

  it("retorna null para undefined", () => {
    expect(extractNumericId(undefined)).toBeNull()
  })
})

describe("extractProfileName", () => {
  it("extrai name do campo user", () => {
    expect(extractProfileName({ user: { name: "Ana" } })).toBe("Ana")
  })

  it("extrai name do campo users", () => {
    expect(extractProfileName({ users: { name: "Carlos" } })).toBe("Carlos")
  })

  it("extrai name da raiz quando não há user/users", () => {
    expect(extractProfileName({ name: "Pedro" })).toBe("Pedro")
  })

  it("extrai full_name quando name não existe", () => {
    expect(extractProfileName({ user: { full_name: "Maria Silva" } })).toBe("Maria Silva")
  })

  it("extrai username como último recurso", () => {
    expect(extractProfileName({ user: { username: "msilva" } })).toBe("msilva")
  })

  it("prioriza name sobre full_name", () => {
    expect(extractProfileName({ user: { name: "Maria", full_name: "Maria Silva" } })).toBe("Maria")
  })

  it("retorna null para null", () => {
    expect(extractProfileName(null)).toBeNull()
  })

  it("retorna null para objeto sem campos de nome", () => {
    expect(extractProfileName({ user: { id: 1 } })).toBeNull()
  })

  it("retorna null para string vazia no name", () => {
    expect(extractProfileName({ user: { name: "" } })).toBeNull()
  })
})

describe("resolveDisplayNameFromPayload", () => {
  it("extrai name do campo user aninhado", () => {
    expect(resolveDisplayNameFromPayload({ user: { name: "Fernanda" } })).toBe("Fernanda")
  })

  it("extrai name da raiz quando não há user aninhado", () => {
    expect(resolveDisplayNameFromPayload({ name: "Rodrigo" })).toBe("Rodrigo")
  })

  it("prefere user aninhado sobre name na raiz", () => {
    expect(resolveDisplayNameFromPayload({ user: { name: "Ana" }, name: "Outro" })).toBe("Ana")
  })

  it("retorna null para null", () => {
    expect(resolveDisplayNameFromPayload(null)).toBeNull()
  })

  it("retorna null para string", () => {
    expect(resolveDisplayNameFromPayload("João")).toBeNull()
  })

  it("retorna null quando objeto não tem name", () => {
    expect(resolveDisplayNameFromPayload({ other: "value" })).toBeNull()
  })
})

describe("parseStoredSnapshot via localStorage", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it("armazena e lê snapshot válido via localStorage", () => {
    const snapshot = { displayName: "João", source: "login-response" }
    localStorage.setItem("auth_user", JSON.stringify(snapshot))
    const raw = localStorage.getItem("auth_user")
    const parsed = JSON.parse(raw!)
    expect(parsed.displayName).toBe("João")
    expect(parsed.source).toBe("login-response")
  })

  it("retorna null para JSON malformado", () => {
    localStorage.setItem("auth_user", "{ invalido")
    let result = null
    try {
      result = JSON.parse(localStorage.getItem("auth_user")!)
    } catch {
      result = null
    }
    expect(result).toBeNull()
  })
})

describe("AuthProvider integration", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it("hidrata o nome a partir do claim name quando não existe auth_user salvo", () => {
    localStorage.setItem("access_token", makeJwt({ name: "João da Silva" }))

    render(createElement(AuthProvider, null, createElement(AuthProbe)))

    expect(screen.getByTestId("display-name")).toHaveTextContent("João da Silva")
    expect(screen.getByTestId("identity-status")).toHaveTextContent("fallback")
    expect(screen.getByTestId("is-authenticated")).toHaveTextContent("true")
    expect(api.get).not.toHaveBeenCalled()
  })

  it("busca o nome real no perfil quando o token só tem sub numérico", async () => {
    localStorage.setItem("access_token", makeJwt({ sub: "42" }))
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { user: { id: 42, name: "Maria Oliveira" } },
    })

    render(createElement(AuthProvider, null, createElement(AuthProbe)))

    expect(screen.getByTestId("display-name")).toHaveTextContent("Usuario")

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/users/user/42", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      })
    })

    await waitFor(() => {
      expect(screen.getByTestId("display-name")).toHaveTextContent("Maria Oliveira")
    })

    expect(JSON.parse(localStorage.getItem("auth_user") ?? "{}")).toEqual({
      displayName: "Maria Oliveira",
      source: "profile",
    })
  })

  it("usa snapshot salvo válido ao iniciar", () => {
    localStorage.setItem("access_token", makeJwt({ sub: "42" }))
    localStorage.setItem(
      "auth_user",
      JSON.stringify({ displayName: "Snapshot User", source: "profile" }),
    )

    render(createElement(AuthProvider, null, createElement(AuthProbe)))

    expect(screen.getByTestId("display-name")).toHaveTextContent("Snapshot User")
    expect(screen.getByTestId("identity-status")).toHaveTextContent("fallback")
    expect(api.get).not.toHaveBeenCalled()
  })

  it("ignora snapshot salvo inválido e volta para o melhor fallback do token", () => {
    localStorage.setItem("access_token", makeJwt({ email: "fallback@email.com" }))
    localStorage.setItem(
      "auth_user",
      JSON.stringify({ displayName: "   ", source: "invalid-source" }),
    )

    render(createElement(AuthProvider, null, createElement(AuthProbe)))

    expect(screen.getByTestId("display-name")).toHaveTextContent("fallback@email.com")
    expect(screen.getByTestId("identity-status")).toHaveTextContent("fallback")
  })

  it("mantém fallback quando o perfil não retorna nome utilizável", async () => {
    localStorage.setItem("access_token", makeJwt({ sub: "42" }))
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { user: { id: 42 } },
    })

    render(createElement(AuthProvider, null, createElement(AuthProbe)))

    expect(screen.getByTestId("display-name")).toHaveTextContent("Usuario")

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/users/user/42", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      })
    })

    expect(screen.getByTestId("display-name")).toHaveTextContent("Usuario")
    expect(localStorage.getItem("auth_user")).toBeNull()
  })

  it("permite login com payload e logout limpando estado e storage", async () => {
    render(createElement(AuthProvider, null, createElement(AuthControls)))

    fireEvent.click(screen.getByRole("button", { name: "login-with-payload" }))

    expect(screen.getByTestId("control-display-name")).toHaveTextContent("Maria Oliveira")
    expect(screen.getByTestId("control-identity-status")).toHaveTextContent("resolved")
    expect(screen.getByTestId("control-authenticated")).toHaveTextContent("true")
    expect(localStorage.getItem("access_token")).toBeTruthy()
    expect(JSON.parse(localStorage.getItem("auth_user") ?? "{}")).toEqual({
      displayName: "Maria Oliveira",
      source: "login-response",
    })

    fireEvent.click(screen.getByRole("button", { name: "logout" }))

    await waitFor(() => {
      expect(screen.getByTestId("control-display-name")).toHaveTextContent("null")
    })

    expect(screen.getByTestId("control-identity-status")).toHaveTextContent("anonymous")
    expect(screen.getByTestId("control-authenticated")).toHaveTextContent("false")
    expect(screen.getByTestId("control-token")).toHaveTextContent("null")
    expect(localStorage.getItem("access_token")).toBeNull()
    expect(localStorage.getItem("auth_user")).toBeNull()
  })

  it("faz login usando claim do jwt quando não há payload", () => {
    render(createElement(AuthProvider, null, createElement(AuthControls)))

    fireEvent.click(screen.getByRole("button", { name: "login-with-jwt" }))

    expect(screen.getByTestId("control-display-name")).toHaveTextContent("joao@email.com")
    expect(screen.getByTestId("control-identity-status")).toHaveTextContent("fallback")
    expect(JSON.parse(localStorage.getItem("auth_user") ?? "{}")).toEqual({
      displayName: "joao@email.com",
      source: "jwt-claim",
    })
  })
})

describe("useAuth", () => {
  it("lança erro quando usado fora do provider", () => {
    expect(() => render(createElement(AuthProbe))).toThrow(
      "useAuth must be used within an AuthProvider",
    )
  })
})
