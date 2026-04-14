import { Archive } from "lucide-react"
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
import { useEffect, useState } from "react"
import { formatDateTime, parseBackendDateTime } from "@/lib/datetime"
import { useNavigate } from "react-router-dom"

export interface OrderItem {
  product_id: number
  quantity: number
  name?: string
}

interface OrderCardProps {
  id: number,
  status: string,
  price: number,
  items: OrderItem[],
  created_at: string | null,
  notes: string | null,
  payment_method: string | null,
}

interface Order {
  order: OrderCardProps
  onRefetch: () => void
  isArchived?: boolean
}


export function OrderCard({order, onRefetch, isArchived}: Order) {
  const getStatusColor = (status: string) => {
    return status === "Pending" ? "bg-yellow-500 text-black" :
            status === "Finished" ? "bg-green-500 text-black" : "bg-red-500 text-black"
  }
  const [open, setOpen] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const navigate = useNavigate()
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now())
    }, 60_000)

    return () => clearInterval(interval)
  }, [])



  function handleFinalize() {
    api.post(`/orders/order/finished/${order.id}`, {
      order_id: order.id,
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

  const getElapsedMs = () => {
    if (!order.created_at) return null
    const createdAt = parseBackendDateTime(order.created_at)
    const createdAtMs = createdAt.getTime()
    if (Number.isNaN(createdAtMs)) return null
    return nowMs - createdAtMs
  }

  const getOrderAgeClass = () => {
    if (order.status !== "Pending") return ""
    const elapsedMs = getElapsedMs()
    if (elapsedMs === null) return ""
    const oneHourMs = 60 * 60 * 1000
    const twoHoursMs = 2 * 60 * 60 * 1000

    if (elapsedMs >= twoHoursMs) return "border-red-500"
    if (elapsedMs >= oneHourMs) return "border-orange-400"
    return ""
  }

  const getSlaBadge = () => {
    if (order.status !== "Pending") {
      return {
        label: translateStatus(order.status),
        className: getStatusColor(order.status),
      }
    }

    const elapsedMs = getElapsedMs()
    if (elapsedMs === null) {
      return { label: "Pedido dentro do prazo", className: "bg-green-500 text-black" }
    }

    const oneHourMs = 60 * 60 * 1000
    const twoHoursMs = 2 * 60 * 60 * 1000

    if (elapsedMs > twoHoursMs) {
      return { label: "Pedido muito atrasado", className: "bg-red-500 text-black" }
    }
    if (elapsedMs > oneHourMs) {
      return { label: "Pedido atrasado", className: "bg-yellow-500 text-black" }
    }
    return { label: "Pedido dentro do prazo", className: "bg-green-500 text-black" }
  }

  const slaBadge = getSlaBadge()
  return (
    <Card className={`relative mx-auto w-full max-w-sm border-2 pt-0 ${getOrderAgeClass()}`}>
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      <img
        src={pizzaImg}
        alt="Event cover"
        className="relative z-20 aspect-video w-full object-cover"
      />
      <CardHeader>
        <CardAction>
          {isArchived && (
            <Badge variant="secondary" className="bg-slate-500 text-white flex items-center gap-1 mb-3">
              <Archive className="h-3 w-3" />
              Arquivado
            </Badge>
          )}
          <Badge variant="secondary" className={slaBadge.className}>
            {slaBadge.label}
          </Badge>

        </CardAction>
        <CardTitle>Pedido #{order.id}</CardTitle>
        <CardDescription>
          {order.items && order.items.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {order.items.map((item, index) => (
                <>
                <li key={index} className="text-sm">
                  {item.quantity}x {item.name ?? `Produto #${item.product_id}`}
                </li>
                </>
              ))}
            </ul>
          ) : (
            <span className="block mt-2">Nenhum item encontrado</span>
          )}
          <div className="mt-4 font-bold text-foreground">
            Total: R$ {(order.price ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {order.created_at === null ? "N/A" : formatDateTime(order.created_at)}
          </div>
          {order.payment_method && (
            <div className="mt-1 text-sm text-muted-foreground">Pagamento: {order.payment_method}</div>
          )}
          {order.notes && (
            <div className="mt-1 text-sm text-muted-foreground">Obs: {order.notes}</div>
          )}
        </CardDescription>
      </CardHeader>
      <CardFooter>
     <div className="flex flex-col gap-2 w-full">
     <Button className="w-full" disabled={order.status === "Finished" || order.status === "Cancelled"} onClick={() => setOpen(true)}>{
          order.status === "Pending"  ? "Finalizar ou Cancelar" : order.status === "Finished" ? "Entregue" : "Cancelado"
          }</Button>
          <Button disabled={order.status === "Finished" || order.status === "Cancelled"} onClick={() => navigate(`/orders/edit?id=${order.id}`)}>Editar Pedido</Button>
     </div>
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
