import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Select } from "./Select"

vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode
    value?: string | string[]
    onValueChange?: (value: string | string[] | null) => void
  }) => (
    <div data-testid="select-root" data-value={Array.isArray(value) ? value.join(",") : value ?? ""}>
      <button type="button" onClick={() => onValueChange?.("2")}>
        trigger-single
      </button>
      <button type="button" onClick={() => onValueChange?.(["1", "2"])}>
        trigger-multiple
      </button>
      {children}
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`item-${value}`}>{children}</div>
  ),
  SelectLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe("Select", () => {
  const products = [
    { id: 1, name: "Calabresa", price: 45, size: "Grande" },
    { id: 2, name: "Portuguesa", price: 50, size: "Media" },
  ]

  it("mostra placeholder no modo simples quando não há valor", () => {
    render(<Select products={products} />)

    expect(screen.getByText("Selecione um produto")).toBeInTheDocument()
    expect(screen.getByTestId("item-1")).toHaveTextContent("Calabresa")
    expect(screen.getByTestId("item-2")).toHaveTextContent("Portuguesa")
  })

  it("mostra nome do produto selecionado no modo simples", () => {
    render(<Select products={products} value="2" />)

    expect(screen.getAllByText("Portuguesa")).toHaveLength(2)
    expect(screen.getByTestId("select-root")).toHaveAttribute("data-value", "2")
  })

  it("dispara onValueChange no modo simples", () => {
    const onValueChange = vi.fn()

    render(<Select products={products} value="1" onValueChange={onValueChange} />)

    fireEvent.click(screen.getByRole("button", { name: "trigger-single" }))

    expect(onValueChange).toHaveBeenCalledWith("2")
  })

  it("mostra placeholder no modo múltiplo quando não há seleção", () => {
    render(<Select products={products} multiple values={[]} />)

    expect(screen.getByText("Selecione os produtos")).toBeInTheDocument()
  })

  it("mostra nomes concatenados no modo múltiplo e dispara onValuesChange", () => {
    const onValuesChange = vi.fn()

    render(
      <Select
        products={products}
        multiple
        values={["1", "2"]}
        onValuesChange={onValuesChange}
      />,
    )

    expect(screen.getByText("Calabresa, Portuguesa")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "trigger-multiple" }))

    expect(onValuesChange).toHaveBeenCalledWith(["1", "2"])
  })

  it("trata lista inválida de produtos como vazia", () => {
    render(<Select products={null as never} value="1" />)

    expect(screen.getByText("Selecione um produto")).toBeInTheDocument()
  })
})
