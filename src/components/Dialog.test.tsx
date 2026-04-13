import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Dialog } from "./Dialog"

vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({
    open,
    onOpenChange,
    children,
  }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
  }) => (
    <div data-open={String(open)}>
      <button type="button" onClick={() => onOpenChange(false)}>
        Fechar dialog
      </button>
      {children}
    </div>
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}))

describe("Dialog", () => {
  it("renderiza textos e executa callbacks de finalizar e cancelar", () => {
    const onFinalize = vi.fn()
    const onCancel = vi.fn()
    const setOpenModal = vi.fn()

    render(
      <Dialog
        openModal
        setOpenModal={setOpenModal}
        onFinalize={onFinalize}
        onCancel={onCancel}
      />,
    )

    expect(screen.getByText("Cancelar ou Finalizar Pedido?")).toBeInTheDocument()
    expect(screen.getByText(/Esta ação não pode ser desfeita/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Finalizar" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(onFinalize).toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalled()
  })

  it("repassa mudança de abertura do modal", () => {
    const setOpenModal = vi.fn()

    render(
      <Dialog
        openModal
        setOpenModal={setOpenModal}
        onFinalize={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Fechar dialog" }))

    expect(setOpenModal).toHaveBeenCalledWith(false)
  })
})
