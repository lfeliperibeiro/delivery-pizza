import { api } from "@/api"
import { Loading } from "@/components/Loading";
import { OrderCard, type OrderItem } from "@/components/OrderCard"
import { isOlderThanDays } from "@/lib/datetime"
import { use, useState, Suspense, useMemo, useCallback } from "react"
import { Toaster } from "sonner";

interface Order {
  id: number,
  status: string,
  price: number,
  items: OrderItem[],
  created_at: string | null,
  notes: string | null,
  payment_method: string | null,
}

async function fetchOrders(): Promise<Order[]> {
  try {
    const response = await api.get("/orders/list_order/order_user")
    const data = response.data
    if (!Array.isArray(data)) return []

    return data
      .map((o) => ({
        id: o.order_id,
        status: o.status,
        price: o.total_price,
        items: o.products ?? [],
        created_at: o.created_at,
        notes: o.notes,
        payment_method: o.payment_method,
      }))
      .filter((o) => !isOlderThanDays(o.created_at, 7))
  } catch {
    return []
  }
}

function OrderGrid({
  ordersPromise,
  onRefetch,
}: {
  ordersPromise: Promise<Order[]>
  onRefetch: () => void
}) {
  const orders = use(ordersPromise)

  const sortedOrders = useMemo(() => {
    return orders.slice().sort((a, b) => {
      if (a.status === "Pending" && b.status !== "Pending") return -1;
      if (a.status !== "Pending" && b.status === "Pending") return 1;
      return 0;
    });
  }, [orders]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full h-full">
      {orders.length === 0 ? (
        <div className="col-span-full flex items-center justify-center p-8 text-muted-foreground">
          No orders found.
        </div>
      ) : (
        sortedOrders.map((order) => (
          <OrderCard key={order.id} order={order} onRefetch={onRefetch} />
        ))
      )}
    </div>
  )
}

export function Home() {
  const [ordersPromise, setOrdersPromise] = useState<Promise<Order[]>>(() =>
    fetchOrders(),
  )

  const refetchOrders = useCallback(() => {
    setOrdersPromise(fetchOrders())
  }, [])

  return (
    <>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center p-8 text-muted-foreground">
            <Loading />
          </div>
        }
      >
        <OrderGrid ordersPromise={ordersPromise} onRefetch={refetchOrders} />
      </Suspense>
      <Toaster />
    </>
  )
}
