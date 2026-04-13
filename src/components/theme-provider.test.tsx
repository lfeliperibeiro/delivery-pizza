import { act, fireEvent, render, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ThemeProvider, useTheme } from "./theme-provider"

function mockMatchMedia(matches: boolean) {
  const state = { matches }
  const listeners: Array<(e: MediaQueryListEvent) => void> = []
  const mq = {
    get matches() {
      return state.matches
    },
    addEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.push(cb)
    }),
    removeEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
      const idx = listeners.indexOf(cb)
      if (idx > -1) listeners.splice(idx, 1)
    }),
    trigger: (newMatches: boolean) => {
      state.matches = newMatches
      listeners.forEach((cb) => cb({ matches: newMatches } as MediaQueryListEvent))
    },
  }
  vi.spyOn(window, "matchMedia").mockReturnValue(mq as unknown as MediaQueryList)
  return mq
}

function setupDefaultMatchMedia() {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList)
}

describe("ThemeProvider - renderização", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("dark", "light")
    setupDefaultMatchMedia()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renderiza os filhos", () => {
    const { getByText } = render(
      <ThemeProvider>
        <span>conteúdo filho</span>
      </ThemeProvider>,
    )

    expect(getByText("conteúdo filho")).toBeInTheDocument()
  })
})

describe("ThemeProvider - inicialização do tema", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("dark", "light")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("usa defaultTheme 'system' quando localStorage está vazio e sistema é light", () => {
    mockMatchMedia(false)

    render(<ThemeProvider><div /></ThemeProvider>)

    expect(document.documentElement.classList.contains("light")).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("usa defaultTheme 'system' quando localStorage está vazio e sistema é dark", () => {
    mockMatchMedia(true)

    render(<ThemeProvider><div /></ThemeProvider>)

    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.classList.contains("light")).toBe(false)
  })

  it("usa o tema salvo no localStorage ao iniciar", () => {
    setupDefaultMatchMedia()
    localStorage.setItem("theme", "dark")

    render(<ThemeProvider><div /></ThemeProvider>)

    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("ignora valor inválido no localStorage e usa defaultTheme", () => {
    mockMatchMedia(false)
    localStorage.setItem("theme", "invalido")

    render(<ThemeProvider defaultTheme="system"><div /></ThemeProvider>)

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("respeita defaultTheme 'dark' explícito", () => {
    setupDefaultMatchMedia()

    render(<ThemeProvider defaultTheme="dark"><div /></ThemeProvider>)

    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("respeita defaultTheme 'light' explícito", () => {
    setupDefaultMatchMedia()

    render(<ThemeProvider defaultTheme="light"><div /></ThemeProvider>)

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("usa storageKey personalizado para ler o tema do localStorage", () => {
    setupDefaultMatchMedia()
    localStorage.setItem("minha-chave", "dark")

    render(<ThemeProvider storageKey="minha-chave"><div /></ThemeProvider>)

    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("não aplica tema de outra storageKey", () => {
    mockMatchMedia(false)
    localStorage.setItem("theme", "dark")

    render(<ThemeProvider storageKey="outra-chave" defaultTheme="light"><div /></ThemeProvider>)

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })
})

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("dark", "light")
    setupDefaultMatchMedia()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("lança erro quando usado fora do ThemeProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => renderHook(() => useTheme())).toThrow(
      "useTheme must be used within a ThemeProvider",
    )

    spy.mockRestore()
  })

  it("retorna theme atual e função setTheme", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
      ),
    })

    expect(result.current.theme).toBe("dark")
    expect(typeof result.current.setTheme).toBe("function")
  })

  it("setTheme atualiza o tema no estado e no localStorage", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      ),
    })

    act(() => {
      result.current.setTheme("dark")
    })

    expect(result.current.theme).toBe("dark")
    expect(localStorage.getItem("theme")).toBe("dark")
  })

  it("setTheme aplica a classe correta ao documentElement", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      ),
    })

    act(() => {
      result.current.setTheme("dark")
    })

    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.classList.contains("light")).toBe(false)
  })

  it("setTheme para 'system' aplica o tema do sistema operacional", () => {
    mockMatchMedia(true)

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      ),
    })

    act(() => {
      result.current.setTheme("system")
    })

    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("setTheme salva o valor com storageKey personalizado", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="light" storageKey="app-theme">{children}</ThemeProvider>
      ),
    })

    act(() => {
      result.current.setTheme("dark")
    })

    expect(localStorage.getItem("app-theme")).toBe("dark")
  })
})

describe("ThemeProvider - atalho de teclado 'd'", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("dark", "light")
    setupDefaultMatchMedia()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("alterna de light para dark ao pressionar 'd'", () => {
    localStorage.setItem("theme", "light")
    render(<ThemeProvider><div /></ThemeProvider>)

    act(() => {
      fireEvent.keyDown(window, { key: "d" })
    })

    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(localStorage.getItem("theme")).toBe("dark")
  })

  it("alterna de dark para light ao pressionar 'd'", () => {
    localStorage.setItem("theme", "dark")
    render(<ThemeProvider><div /></ThemeProvider>)

    act(() => {
      fireEvent.keyDown(window, { key: "d" })
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
    expect(localStorage.getItem("theme")).toBe("light")
  })

  it("tecla 'D' maiúscula também alterna o tema", () => {
    localStorage.setItem("theme", "light")
    render(<ThemeProvider><div /></ThemeProvider>)

    act(() => {
      fireEvent.keyDown(window, { key: "D" })
    })

    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("ignora tecla 'd' quando repeat é true", () => {
    localStorage.setItem("theme", "light")
    render(<ThemeProvider><div /></ThemeProvider>)

    act(() => {
      fireEvent.keyDown(window, { key: "d", repeat: true })
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("ignora tecla 'd' com metaKey pressionado", () => {
    localStorage.setItem("theme", "light")
    render(<ThemeProvider><div /></ThemeProvider>)

    act(() => {
      fireEvent.keyDown(window, { key: "d", metaKey: true })
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("ignora tecla 'd' com ctrlKey pressionado", () => {
    localStorage.setItem("theme", "light")
    render(<ThemeProvider><div /></ThemeProvider>)

    act(() => {
      fireEvent.keyDown(window, { key: "d", ctrlKey: true })
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("ignora tecla 'd' com altKey pressionado", () => {
    localStorage.setItem("theme", "light")
    render(<ThemeProvider><div /></ThemeProvider>)

    act(() => {
      fireEvent.keyDown(window, { key: "d", altKey: true })
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("ignora tecla 'd' quando foco está em um input", () => {
    localStorage.setItem("theme", "light")
    const { getByTestId } = render(
      <ThemeProvider>
        <input data-testid="campo" />
      </ThemeProvider>,
    )

    act(() => {
      fireEvent.keyDown(getByTestId("campo"), { key: "d" })
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("ignora tecla 'd' quando foco está em um textarea", () => {
    localStorage.setItem("theme", "light")
    const { getByTestId } = render(
      <ThemeProvider>
        <textarea data-testid="area" />
      </ThemeProvider>,
    )

    act(() => {
      fireEvent.keyDown(getByTestId("area"), { key: "d" })
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("ignora tecla 'd' quando foco está em um select", () => {
    localStorage.setItem("theme", "light")
    const { getByTestId } = render(
      <ThemeProvider>
        <select data-testid="select">
          <option>A</option>
        </select>
      </ThemeProvider>,
    )

    act(() => {
      fireEvent.keyDown(getByTestId("select"), { key: "d" })
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("com tema 'system' e sistema light, alterna para dark", () => {
    mockMatchMedia(false)
    render(<ThemeProvider defaultTheme="system"><div /></ThemeProvider>)

    act(() => {
      fireEvent.keyDown(window, { key: "d" })
    })

    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("com tema 'system' e sistema dark, alterna para light", () => {
    mockMatchMedia(true)
    render(<ThemeProvider defaultTheme="system"><div /></ThemeProvider>)

    act(() => {
      fireEvent.keyDown(window, { key: "d" })
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })
})

describe("ThemeProvider - eventos de storage (multi-aba)", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("dark", "light")
    setupDefaultMatchMedia()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("atualiza o tema ao receber evento de storage de outra aba", () => {
    render(<ThemeProvider defaultTheme="light"><div /></ThemeProvider>)

    act(() => {
      fireEvent(
        window,
        new StorageEvent("storage", {
          storageArea: localStorage,
          key: "theme",
          newValue: "dark",
        }),
      )
    })

    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("reseta para defaultTheme quando storage event tem valor inválido", () => {
    localStorage.setItem("theme", "dark")
    render(<ThemeProvider defaultTheme="light"><div /></ThemeProvider>)

    act(() => {
      fireEvent(
        window,
        new StorageEvent("storage", {
          storageArea: localStorage,
          key: "theme",
          newValue: "invalido",
        }),
      )
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("ignora evento de storage com storageArea diferente do localStorage", () => {
    render(<ThemeProvider defaultTheme="light"><div /></ThemeProvider>)

    act(() => {
      fireEvent(
        window,
        new StorageEvent("storage", {
          storageArea: sessionStorage,
          key: "theme",
          newValue: "dark",
        }),
      )
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("ignora evento de storage com chave diferente da storageKey", () => {
    render(<ThemeProvider defaultTheme="light"><div /></ThemeProvider>)

    act(() => {
      fireEvent(
        window,
        new StorageEvent("storage", {
          storageArea: localStorage,
          key: "outra-chave",
          newValue: "dark",
        }),
      )
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("respeita storageKey personalizado nos eventos de storage", () => {
    render(<ThemeProvider defaultTheme="light" storageKey="app-theme"><div /></ThemeProvider>)

    act(() => {
      fireEvent(
        window,
        new StorageEvent("storage", {
          storageArea: localStorage,
          key: "app-theme",
          newValue: "dark",
        }),
      )
    })

    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })
})

describe("ThemeProvider - listener de mudança do sistema (media query)", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("dark", "light")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("atualiza o tema quando a preferência do sistema muda para dark", () => {
    const mq = mockMatchMedia(false)
    render(<ThemeProvider defaultTheme="system"><div /></ThemeProvider>)

    expect(document.documentElement.classList.contains("light")).toBe(true)

    act(() => {
      mq.trigger(true)
    })

    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("atualiza o tema quando a preferência do sistema muda para light", () => {
    const mq = mockMatchMedia(true)
    render(<ThemeProvider defaultTheme="system"><div /></ThemeProvider>)

    expect(document.documentElement.classList.contains("dark")).toBe(true)

    act(() => {
      mq.trigger(false)
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("não adiciona listener de media query quando tema é 'dark' fixo", () => {
    const mq = mockMatchMedia(false)

    render(<ThemeProvider defaultTheme="dark"><div /></ThemeProvider>)

    expect(mq.addEventListener).not.toHaveBeenCalled()
  })

  it("não adiciona listener de media query quando tema é 'light' fixo", () => {
    const mq = mockMatchMedia(false)

    render(<ThemeProvider defaultTheme="light"><div /></ThemeProvider>)

    expect(mq.addEventListener).not.toHaveBeenCalled()
  })

  it("remove o listener ao trocar de 'system' para outro tema", () => {
    const mq = mockMatchMedia(false)

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
      ),
    })

    expect(mq.addEventListener).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.setTheme("dark")
    })

    expect(mq.removeEventListener).toHaveBeenCalledTimes(1)
  })
})
