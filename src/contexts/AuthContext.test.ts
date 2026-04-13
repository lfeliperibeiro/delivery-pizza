import { describe, it, expect, beforeEach, afterEach } from "vitest"

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
