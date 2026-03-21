import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import pizzaImg from "@/assets/pizza.png"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Dialog } from "./Dialog"
import { api } from "@/api"
import { toast } from "sonner"
import {  useState } from "react"
import { formatDateTime } from "@/lib/datetime"

export interface OrderItem {
  name?: string,
  price: number,
  quantity: number,
  size: string

}

interface OrderCardProps {
    id: number,
    status: string,
    price: number,
    items: OrderItem[]
    created_at: string | null
}

interface Order {
  order: OrderCardProps
  onRefetch: () => void
}


export function OrderCard({order, onRefetch}: Order) {
  const getStatusColor = (status: string) => {
    return status === "Pending" ? "bg-yellow-500 text-black" :
            status === "Finished" ? "bg-green-500 text-black" : "bg-red-500 text-black"
  }
  const [open, setOpen] = useState(false)



  const token = localStorage.getItem("access_token")

  function handleFinalize() {
    api.post(`/orders/order/finished/${order.id}`, {
      order_id: order.id,
    },{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(() => {
      toast.success("Pedido finalizado com sucesso")
      setOpen(false)
      onRefetch()
    }).catch(() => {
      toast.error("Erro ao finalizar pedido")
    })
  }

  function handleCancel() {
    api.post(`/orders/order/cancel/${order.id}`, {
      order_id: order.id,
    },{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(() => {
      toast.success("Pedido cancelado com sucesso")
      setOpen(false)
      onRefetch()
    }).catch(() => {
      toast.error("Erro ao cancelar pedido")
    })
  }

  function translateStatus (orderStatus: string)  {
    switch(orderStatus){
      case "Pending":
        return "Pendente"
        case "Finished":
          return "Concluído"
          case "Cancelled":
          return "Cancelado"
          default: return "Pendente"
    }
  }
  return (
    <Card className="relative mx-auto w-full max-w-sm pt-0">
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      <img
        src={pizzaImg}
        alt="Event cover"
        className="relative z-20 aspect-video w-full object-cover"
      />
      <CardHeader>
        <CardAction>
          <Badge variant="secondary" className={getStatusColor(order.status)}>{translateStatus(order.status)}</Badge>
        </CardAction>
        <CardTitle>Pedido #{order.id}</CardTitle>
        <CardDescription>
          {order.items && order.items.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {order.items.map((item, index) => (
                <>
                <li key={index} className="text-sm">
                  {item.quantity}x {item.name} ({item.size})
                </li>
                </>
              ))}
            </ul>
          ) : (
            <span className="block mt-2">Nenhum item encontrado</span>
          )}
          <div className="mt-4 font-bold text-foreground">
            Total: R$ {order.price.toFixed(2)}
          </div>
          <div className="mt-4 font-bold text-foreground">
             {order.created_at === null ? "N/A" : formatDateTime(order.created_at)}
          </div>
        </CardDescription>
      </CardHeader>
      <CardFooter>
      <Button className="w-full" disabled={order.status === "Finished" || order.status === "Cancelled"} onClick={() => setOpen(true)}>{
          order.status === "Pending"  ? "Finalizar ou Cancelar" : order.status === "Finished" ? "Entregue" : "Cancelado"
          }</Button>
        <Dialog
          openModal={open}
          setOpenModal={setOpen}
          onFinalize={handleFinalize}
          onCancel={handleCancel}
      />

      </CardFooter>
    </Card>
  )
}
