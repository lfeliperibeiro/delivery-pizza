import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { parseBackendDateTime, isOlderThanDays, formatDateTime, BR_TIMEZONE } from "./datetime"

describe("BR_TIMEZONE", () => {
  it("deve ser America/Sao_Paulo", () => {
    expect(BR_TIMEZONE).toBe("America/Sao_Paulo")
  })
})

describe("parseBackendDateTime", () => {
  it("retorna NaN para string vazia", () => {
    const result = parseBackendDateTime("  ")
    expect(Number.isNaN(result.getTime())).toBe(true)
  })

  it("parseia ISO com Z corretamente", () => {
    const result = parseBackendDateTime("2024-06-15T12:30:00Z")
    expect(result).toBeInstanceOf(Date)
    expect(result.getTime()).toBe(new Date("2024-06-15T12:30:00Z").getTime())
  })

  it("parseia ISO com offset positivo (+03:00)", () => {
    const result = parseBackendDateTime("2024-06-15T12:30:00+03:00")
    expect(result).toBeInstanceOf(Date)
    expect(Number.isNaN(result.getTime())).toBe(false)
  })

  it("parseia ISO com offset negativo (-03:00)", () => {
    const result = parseBackendDateTime("2024-06-15T12:30:00-03:00")
    expect(result).toBeInstanceOf(Date)
    expect(Number.isNaN(result.getTime())).toBe(false)
  })

  it("trata ISO sem timezone como UTC", () => {
    const result = parseBackendDateTime("2024-06-15T12:30:00")
    expect(result).toBeInstanceOf(Date)
    // Deve interpretar como UTC (appends Z)
    expect(result.getTime()).toBe(new Date("2024-06-15T12:30:00Z").getTime())
  })

  it("parseia ISO com offset no formato numérico (+0300)", () => {
    const result = parseBackendDateTime("2024-06-15T12:30:00+0300")
    expect(Number.isNaN(result.getTime())).toBe(false)
  })

  it("retorna NaN para string completamente inválida", () => {
    const result = parseBackendDateTime("nao-e-uma-data")
    expect(Number.isNaN(result.getTime())).toBe(true)
  })

  it("faz trim da string de entrada", () => {
    const result = parseBackendDateTime("  2024-06-15T12:30:00Z  ")
    expect(Number.isNaN(result.getTime())).toBe(false)
  })
})

describe("isOlderThanDays", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("retorna false para null", () => {
    expect(isOlderThanDays(null, 7)).toBe(false)
  })

  it("retorna false para string inválida", () => {
    expect(isOlderThanDays("data-invalida", 7)).toBe(false)
  })

  it("retorna true para data com mais de 7 dias atrás", () => {
    const oldDate = "2024-06-07T12:00:00Z" // exatamente 8 dias atrás
    expect(isOlderThanDays(oldDate, 7)).toBe(true)
  })

  it("retorna false para data com exatamente 7 dias (não estritamente maior)", () => {
    const exactDate = "2024-06-08T12:00:00Z" // exatamente 7 dias
    expect(isOlderThanDays(exactDate, 7)).toBe(false)
  })

  it("retorna false para data recente (1 dia atrás)", () => {
    const recentDate = "2024-06-14T12:00:00Z"
    expect(isOlderThanDays(recentDate, 7)).toBe(false)
  })

  it("retorna true para data com mais de 1 dia quando days=1", () => {
    const twoDaysAgo = "2024-06-13T11:59:59Z"
    expect(isOlderThanDays(twoDaysAgo, 1)).toBe(true)
  })

  it("retorna false para data futura", () => {
    const futureDate = "2024-06-20T12:00:00Z"
    expect(isOlderThanDays(futureDate, 7)).toBe(false)
  })
})

describe("formatDateTime", () => {
  it("formata um objeto Date corretamente em pt-BR", () => {
    const date = new Date("2024-06-15T15:30:45Z")
    const result = formatDateTime(date)
    // Verifica que contém elementos de data (dia, mês, ano) e hora
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/)
  })

  it("formata uma string ISO corretamente", () => {
    const result = formatDateTime("2024-06-15T15:30:45Z")
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/)
  })

  it("usa timezone de São Paulo (GMT-3 no horário de inverno)", () => {
    // 2024-06-15T15:00:00Z = 12:00 no horário de Brasília (UTC-3)
    const result = formatDateTime("2024-06-15T15:00:00Z")
    expect(result).toContain("12:00:00")
    expect(result).toContain("15/06/2024")
  })
})
