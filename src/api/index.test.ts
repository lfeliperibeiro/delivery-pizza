import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "./index"

describe("api instance", () => {
  let called = 0
  const listener: EventListener = () => {
    called += 1
  }

  beforeEach(() => {
    called = 0
    window.addEventListener("auth:invalid-token", listener)
  })

  afterEach(() => {
    window.removeEventListener("auth:invalid-token", listener)
  })

  it("configura o Content-Type padrão como application/json", () => {
    expect(api.defaults.headers["Content-Type"]).toBe("application/json")
  })

  it("mantém o baseURL alinhado com o VITE_API", () => {
    expect(api.defaults.baseURL).toBe(import.meta.env.VITE_API)
  })

  it("retorna a response original no interceptor de sucesso", async () => {
    const handler = (api.interceptors.response as unknown as { handlers: Array<{ fulfilled?: (value: unknown) => unknown }> }).handlers[0]
    const response = { data: { ok: true } }

    expect(handler.fulfilled?.(response)).toEqual(response)
  })

  it("dispara auth:invalid-token quando o detail é Invalid token", async () => {
    const handler = (api.interceptors.response as unknown as { handlers: Array<{ rejected?: (error: unknown) => Promise<unknown> }> }).handlers[0]
    const error = { response: { data: { detail: "Invalid token" } } }

    await expect(handler.rejected?.(error)).rejects.toEqual(error)
    expect(called).toBe(1)
  })

  it("não dispara auth:invalid-token para outros erros", async () => {
    const handler = (api.interceptors.response as unknown as { handlers: Array<{ rejected?: (error: unknown) => Promise<unknown> }> }).handlers[0]
    const error = { response: { data: { detail: "Unauthorized" } } }

    await expect(handler.rejected?.(error)).rejects.toEqual(error)
    expect(called).toBe(0)
  })
})

describe("api request interceptor", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it("injeta Authorization header quando token existe no localStorage", () => {
    localStorage.setItem("access_token", "test-token-123")

    const handler = (
      api.interceptors.request as unknown as {
        handlers: Array<{ fulfilled?: (config: Record<string, unknown>) => Record<string, unknown> }>
      }
    ).handlers[0]

    const config = { headers: {} as Record<string, string> }
    const result = handler.fulfilled?.(config)

    expect((result as typeof config).headers["Authorization"]).toBe("Bearer test-token-123")
  })

  it("não injeta Authorization header quando não há token", () => {
    const handler = (
      api.interceptors.request as unknown as {
        handlers: Array<{ fulfilled?: (config: Record<string, unknown>) => Record<string, unknown> }>
      }
    ).handlers[0]

    const config = { headers: {} as Record<string, string> }
    const result = handler.fulfilled?.(config)

    expect((result as typeof config).headers["Authorization"]).toBeUndefined()
  })

  it("retorna o config em ambos os casos", () => {
    const handler = (
      api.interceptors.request as unknown as {
        handlers: Array<{ fulfilled?: (config: Record<string, unknown>) => Record<string, unknown> }>
      }
    ).handlers[0]

    const config = { headers: {}, url: "/test" }
    const result = handler.fulfilled?.(config)

    expect(result).toEqual(expect.objectContaining({ url: "/test" }))
  })
})
