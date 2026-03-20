import { api } from "@/api"
import { Button } from "@/components/ui/button"
import { toast, Toaster } from "sonner"

export function CreateOrder() {

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
          user_id: 1,
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
        </div>
        <Button type="submit">Criar Pedido</Button>
      </form>
      <Toaster />
    </div>
  )
}