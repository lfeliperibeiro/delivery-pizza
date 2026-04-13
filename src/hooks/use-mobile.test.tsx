import { renderHook } from "@testing-library/react"
import { act } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useIsMobile } from "./use-mobile"

type MatchMediaListener = () => void

describe("useIsMobile", () => {
  const originalInnerWidth = window.innerWidth
  const originalMatchMedia = window.matchMedia
  let changeListener: MatchMediaListener | undefined
  const addEventListener = vi.fn()
  const removeEventListener = vi.fn()

  beforeEach(() => {
    changeListener = undefined
    addEventListener.mockImplementation((_event: string, listener: MatchMediaListener) => {
      changeListener = listener
    })
    removeEventListener.mockImplementation((_event: string, listener: MatchMediaListener) => {
      if (changeListener === listener) changeListener = undefined
    })

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        addEventListener,
        removeEventListener,
      })),
    })
  })

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    })
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    })
  })

  it("retorna true quando a largura é mobile", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 767,
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)")
  })

  it("retorna false quando a largura é desktop", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it("atualiza ao disparar listener de change e remove listener no unmount", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    })

    const { result, unmount } = renderHook(() => useIsMobile())

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 500,
    })

    act(() => {
      changeListener?.()
    })

    expect(result.current).toBe(true)

    unmount()

    expect(removeEventListener).toHaveBeenCalled()
  })
})
