import { api } from "@/api"
import { Loading } from "@/components/Loading"
import { OrderCard, type OrderItem } from "@/components/OrderCard"
import { isOlderThanDays } from "@/lib/datetime"
import { use, useState, Suspense, useCallback } from "react"
import { Toaster } from "sonner"

interface Order {
  id: number
  status: string
  price: number
  items: OrderItem[]
  created_at: string | null
  notes: string | null
  payment_method: string | null
}

async function fetchArchivedOrders(): Promise<Order[]> {
  const token = localStorage.getItem("access_token")
  const response = await api.get("/orders/list_order/order_user", {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = response.data
  if (!Array.isArray(data)) return []

  const all: Order[] = data.map((o) => ({
    id: o.order_id,
    status: o.status,
    price: o.total_price,
    items: o.products ?? [],
    created_at: o.created_at,
    notes: o.notes,
    payment_method: o.payment_method,
  }))

  return all
    .filter((o) => isOlderThanDays(o.created_at, 7))
    .sort((a, b) => {
      if (!a.created_at) return 1
      if (!b.created_at) return -1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
}

function ArchivedOrderGrid({
  ordersPromise,
  onRefetch,
}: {
  ordersPromise: Promise<Order[]>
  onRefetch: () => void
}) {
  const orders = use(ordersPromise)

  if (orders.length === 0) {
    return (
      <div className="col-span-full flex items-center justify-center p-8 text-muted-foreground">
        Nenhum pedido arquivado encontrado.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full h-full">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} onRefetch={onRefetch} />
      ))}
    </div>
  )
}

function ArchivedOrdersContent() {
  const [ordersPromise, setOrdersPromise] = useState<Promise<Order[]>>(() =>
    fetchArchivedOrders(),
  )
  const [error, setError] = useState<boolean>(false)

  const refetch = useCallback(() => {
    setError(false)
    const promise = fetchArchivedOrders()
    promise.catch(() => setError(true))
    setOrdersPromise(promise)
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-muted-foreground">
        <p>Erro ao carregar pedidos arquivados.</p>
        <button
          onClick={refetch}
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center p-8 text-muted-foreground">
          <Loading />
        </div>
      }
    >
      <ArchivedOrderGrid ordersPromise={ordersPromise} onRefetch={refetch} />
    </Suspense>
  )
}

export function ArchivedOrders() {
  return (
    <>
      <ArchivedOrdersContent />
      <Toaster />
    </>
  )
}
