import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { UsersTable } from "./UsersTable"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe("UsersTable", () => {
  it("renderiza a mensagem de lista vazia quando não há usuários", () => {
    render(
      <MemoryRouter>
        <UsersTable users={[]} />
      </MemoryRouter>,
    )

    expect(screen.getByText("Nenhum usuário encontrado.")).toBeInTheDocument()
  })

  it("renderiza os dados dos usuários na tabela", () => {
    render(
      <MemoryRouter>
        <UsersTable
          users={[
            {
              id: 7,
              name: "Maria",
              email: "maria@email.com",
              active: true,
              admin: false,
            },
          ]}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText("Maria")).toBeInTheDocument()
    expect(screen.getByText("maria@email.com")).toBeInTheDocument()
    expect(screen.getByText("Sim")).toBeInTheDocument()
    expect(screen.getByText("Não")).toBeInTheDocument()
  })

  it("navega para a tela de edição ao clicar em Editar", () => {
    render(
      <MemoryRouter>
        <UsersTable
          users={[
            {
              id: 9,
              name: "Carlos",
              email: "carlos@email.com",
              active: true,
              admin: true,
            },
          ]}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole("button", { name: /editar/i }))

    expect(mockNavigate).toHaveBeenCalledWith("/users/edit/9")
  })
})
