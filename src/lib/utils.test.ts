import { describe, it, expect } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
  it("combina classes simples", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("ignora valores falsy", () => {
    expect(cn("foo", undefined, null, false, "bar")).toBe("foo bar")
  })

  it("resolve conflitos de classes Tailwind (última vence)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("resolve conflito de text-color Tailwind", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
  })

  it("aceita objetos condicionais", () => {
    expect(cn({ "font-bold": true, "font-thin": false })).toBe("font-bold")
  })

  it("aceita arrays", () => {
    expect(cn(["bg-white", "p-4"])).toBe("bg-white p-4")
  })

  it("retorna string vazia quando não recebe argumentos", () => {
    expect(cn()).toBe("")
  })

  it("mantém classes não conflitantes", () => {
    expect(cn("flex", "items-center", "gap-2")).toBe("flex items-center gap-2")
  })
})
