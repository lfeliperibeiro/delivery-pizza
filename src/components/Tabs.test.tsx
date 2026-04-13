import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Tabs } from "./Tabs"

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({
    children,
    defaultValue,
    className,
  }: {
    children: React.ReactNode
    defaultValue: string
    className?: string
  }) => (
    <div data-testid="tabs-root" data-default-value={defaultValue} data-classname={className}>
      {children}
    </div>
  ),
  TabsList: ({
    children,
    variant,
    className,
  }: {
    children: React.ReactNode
    variant?: string
    className?: string
  }) => (
    <div data-testid="tabs-list" data-variant={variant} data-classname={className}>
      {children}
    </div>
  ),
  TabsTrigger: ({
    children,
    value,
  }: {
    children: React.ReactNode
    value: string
  }) => <button data-value={value}>{children}</button>,
  TabsContent: ({
    children,
    value,
    className,
  }: {
    children: React.ReactNode
    value: string
    className?: string
  }) => (
    <div data-testid={`content-${value}`} data-classname={className}>
      {children}
    </div>
  ),
}))

describe("Tabs", () => {
  it("renderiza abas e conteúdos com o primeiro item como default", () => {
    render(
      <Tabs
        tabs={[
          { value: "first", label: "Primeira" },
          { value: "second", label: "Segunda" },
        ]}
        content={[
          { value: "first", content: <div>Conteúdo A</div> },
          { value: "second", content: <div>Conteúdo B</div> },
        ]}
      />,
    )

    expect(screen.getByTestId("tabs-root")).toHaveAttribute("data-default-value", "first")
    expect(screen.getByTestId("tabs-list")).toHaveAttribute("data-variant", "line")
    expect(screen.getByRole("button", { name: "Primeira" })).toHaveAttribute("data-value", "first")
    expect(screen.getByRole("button", { name: "Segunda" })).toHaveAttribute("data-value", "second")
    expect(screen.getByTestId("content-first")).toHaveTextContent("Conteúdo A")
    expect(screen.getByTestId("content-second")).toHaveTextContent("Conteúdo B")
  })
})
