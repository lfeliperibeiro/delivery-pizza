import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Orders } from "./Orders"

vi.mock("./CreateOrder", () => ({
  CreateOrder: () => <div>Criar pedido content</div>,
}))

vi.mock("./Products", () => ({
  Products: () => <div>Produtos content</div>,
}))

vi.mock("./AddProduct", () => ({
  AddProduct: () => <div>Adicionar produto content</div>,
}))

vi.mock("./RemoveProduct", () => ({
  RemoveProduct: () => <div>Remover produto content</div>,
}))

vi.mock("@/components/Tabs", () => ({
  Tabs: ({
    tabs,
    content,
  }: {
    tabs: Array<{ value: string; label: string }>
    content: Array<{ value: string; content: React.ReactNode }>
  }) => (
    <div>
      <div data-testid="tabs-labels">{tabs.map((tab) => tab.label).join(" | ")}</div>
      <div data-testid="tabs-values">{tabs.map((tab) => tab.value).join(" | ")}</div>
      <div data-testid="content-values">{content.map((item) => item.value).join(" | ")}</div>
      <div>{content.map((item) => <div key={item.value}>{item.content}</div>)}</div>
    </div>
  ),
}))

describe("Orders", () => {
  it("monta as abas e conteúdos esperados", () => {
    render(<Orders />)

    expect(screen.getByTestId("tabs-labels")).toHaveTextContent(
      "Criar Pedido | Produtos | Adicionar Produto | Remover Produto",
    )
    expect(screen.getByTestId("tabs-values")).toHaveTextContent(
      "criar_pedido | produtos | adicionar_produto | remover_produto",
    )
    expect(screen.getByTestId("content-values")).toHaveTextContent(
      "criar_pedido | produtos | adicionar_produto | remover_produto",
    )
    expect(screen.getByText("Criar pedido content")).toBeInTheDocument()
    expect(screen.getByText("Produtos content")).toBeInTheDocument()
    expect(screen.getByText("Adicionar produto content")).toBeInTheDocument()
    expect(screen.getByText("Remover produto content")).toBeInTheDocument()
  })
})
