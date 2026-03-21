import { api } from "@/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast, Toaster } from "sonner"

export function CreateOrder() {
  const [user_id, setUserId] = useState<number | undefined>(undefined)
  function handleCreateOrder(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = localStorage.getItem("access_token")

    if (!token) {
      toast.error("Faça login para criar um pedido")
      return
    }
    api
      .post(
        "/orders/order",
        {
          user_id: user_id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
    .then(() => {
      toast.success("Pedido criado com sucesso")
    })
    .catch(() => {
      toast.error("Erro ao criar pedido")
    })
  }
  return (
    <div  className="flex h-full w-full flex-col items-center gap-4">
      <form className="flex flex-col gap-4" onSubmit={handleCreateOrder}>
        <div className="flex flex-col gap-2">
          <label htmlFor="user_id">ID do usuário</label>
          <Input type="number" id="user_id" name="user_id" value={user_id} onChange={(event) => setUserId(Number(event.target.value))} />
        </div>
        <Button type="submit">Criar Pedido</Button>
      </form>
      <Toaster />
    </div>
  )
}