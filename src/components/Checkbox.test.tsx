import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Checkbox } from "./Checkbox"

vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({
    id,
    name,
    checked,
    onCheckedChange,
    className,
  }: {
    id: string
    name: string
    checked: boolean
    onCheckedChange?: (value: boolean | "indeterminate") => void
    className?: string
  }) => (
    <button
      type="button"
      data-testid="checkbox-ui"
      data-id={id}
      data-name={name}
      data-checked={String(checked)}
      data-classname={className}
      onClick={() => onCheckedChange?.(!checked)}
      onDoubleClick={() => onCheckedChange?.("indeterminate")}
    >
      checkbox
    </button>
  ),
}))

vi.mock("@/components/ui/field", () => ({
  FieldGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Field: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/ui/label", () => ({
  Label: ({
    children,
    htmlFor,
  }: {
    children: React.ReactNode
    htmlFor: string
  }) => <label htmlFor={htmlFor}>{children}</label>,
}))

describe("Checkbox", () => {
  it("renderiza label e repassa metadados para o checkbox base", () => {
    render(
      <Checkbox
        id="terms"
        name="terms"
        label="Aceito os termos"
        checked={false}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Aceito os termos")).toBeInTheDocument()
    expect(screen.getByTestId("checkbox-ui")).toHaveAttribute("data-id", "terms")
    expect(screen.getByTestId("checkbox-ui")).toHaveAttribute("data-name", "terms")
    expect(screen.getByTestId("checkbox-ui")).toHaveAttribute("data-checked", "false")
  })

  it("converte checked change para boolean", () => {
    const onChange = vi.fn()

    render(
      <Checkbox
        id="newsletter"
        name="newsletter"
        label="Receber novidades"
        checked={false}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByTestId("checkbox-ui"))

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it("converte valor indeterminate para boolean", () => {
    const onChange = vi.fn()

    render(
      <Checkbox
        id="marketing"
        name="marketing"
        label="Marketing"
        checked
        onChange={onChange}
      />,
    )

    fireEvent.doubleClick(screen.getByTestId("checkbox-ui"))

    expect(onChange).toHaveBeenCalledWith(true)
  })
})
