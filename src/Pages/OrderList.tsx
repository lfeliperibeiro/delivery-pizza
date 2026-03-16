import { api } from "@/api"
import { Loading } from "@/components/Loading"
import { OrderTable, type OrderTableProps } from "@/components/OrderTable"
import { Suspense, useState, use } from "react"

function OrderTableWrapper({
  ordersPromise,
}: {
  ordersPromise: Promise<OrderTableProps[]>
}) {
  const orders = use(ordersPromise)
  return <OrderTable orders={orders} />
}

export function OrderList() {
  async function fetchOrders(): Promise<OrderTableProps[]> {
    const token = localStorage.getItem("access_token")
    try {
      const response = await api.get("/orderslist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = response.data
      if (data && Array.isArray(data.orders)) {
        return data.orders
      } else if (Array.isArray(data)) {
        return data
      } else {
        console.error("Expected an array of orders, received:", data)
        return []
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      return []
    }
  }

  const [ordersPromise] = useState(() => fetchOrders())
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center p-8 text-muted-foreground">
          <Loading />
        </div>
      }
    >
      <OrderTableWrapper ordersPromise={ordersPromise} />
    </Suspense>
  )
}
