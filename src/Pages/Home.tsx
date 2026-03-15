import { OrderCard, type OrderItem } from "@/components/OrderCard"
import { useEffect, useState } from "react"

interface Order {
  id: number,
  status: string,
  price: number,
  items: OrderItem[]
}

export function Home(){
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('access_token');
      try {
        const response = await fetch("http://127.0.0.1:8000/orders/list_order/order_user", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        
        if (Array.isArray(data)) {
          setOrders(data)
        } else {
          console.error("Expected an array of orders, received:", data)
          setOrders([]) // Fallback to empty array
        }
      } catch (error) {
        console.error("Error fetching orders:", error)
        setOrders([])
      }
    }
    fetchOrders()
  }, [])
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full h-full">
      {orders.length === 0 ? (
        <div className="col-span-full flex items-center justify-center p-8 text-muted-foreground">
          No orders found.
        </div>
      ) : (
        orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))
      )}
    </div>
  )
}
