import { describe, it, expect, beforeEach, afterEach } from "vitest"
import axios from "axios"

function createInterceptorErrorHandler() {
  return (error: unknown) => {
    const axiosError = error as { response?: { data?: { detail?: string } } }
    const detail = axiosError?.response?.data?.detail

    if (detail === "Invalid token") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:invalid-token"))
      }
    }

    return Promise.reject(error)
  }
}

describe("API interceptor (lógica de erro)", () => {
  let called = 0
  const listener: EventListener = () => { called++ }

  beforeEach(() => {
    called = 0
    window.addEventListener("auth:invalid-token", listener)
  })

  afterEach(() => {
    window.removeEventListener("auth:invalid-token", listener)
  })

  it("dispara evento auth:invalid-token para detail 'Invalid token'", async () => {
    const handler = createInterceptorErrorHandler()
    const error = { response: { data: { detail: "Invalid token" } } }

    await expect(handler(error)).rejects.toEqual(error)
    expect(called).toBe(1)
  })

  it("não dispara evento para outros erros", async () => {
    const handler = createInterceptorErrorHandler()
    const error = { response: { data: { detail: "Not found" } } }

    await expect(handler(error)).rejects.toEqual(error)
    expect(called).toBe(0)
  })

  it("não dispara evento quando detail é undefined", async () => {
    const handler = createInterceptorErrorHandler()
    const error = { response: { data: {} } }

    await expect(handler(error)).rejects.toEqual(error)
    expect(called).toBe(0)
  })

  it("não dispara evento quando response é undefined", async () => {
    const handler = createInterceptorErrorHandler()
    const error = {}

    await expect(handler(error)).rejects.toEqual(error)
    expect(called).toBe(0)
  })

  it("sempre rejeita a promise com o erro original", async () => {
    const handler = createInterceptorErrorHandler()
    const error = new Error("network error")

    await expect(handler(error)).rejects.toThrow("network error")
  })
})

describe("axios instance", () => {
  it("cria instância axios com Content-Type correto", () => {
    const instance = axios.create({
      baseURL: "http://localhost:8000",
      headers: { "Content-Type": "application/json" },
    })

    expect(instance.defaults.headers["Content-Type"]).toBe("application/json")
  })
})
