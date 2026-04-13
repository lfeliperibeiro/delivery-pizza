import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Loading } from "./Loading"

describe("Loading", () => {
  it("renderiza spinner e mensagem de carregamento", () => {
    render(<Loading />)

    expect(screen.getByText("Carregando...")).toBeInTheDocument()
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument()
  })
})
