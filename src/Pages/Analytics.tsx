import { api } from "@/api"
import { Loading } from "@/components/Loading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { use, useState, Suspense } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend
} from "recharts"

interface OrderItem {
  product_id: number
  quantity: number
}

interface Order {
  id: number
  status: string
  price: number
  items: OrderItem[]
  created_at: string | null
}

interface ProductMap {
  [id: number]: string
}

async function fetchData(): Promise<{ orders: Order[]; productNames: ProductMap }> {
  const token = localStorage.getItem("access_token")
  const headers = { Authorization: `Bearer ${token}` }

  const [ordersRes, productsRes] = await Promise.all([
    api.get("/orders/list_order/order_user", { headers }),
    api.get("/orders/list", { headers }),
  ])

  const orders: Order[] = Array.isArray(ordersRes.data)
    ? ordersRes.data.map((o: Record<string, unknown>) => ({
        id: o.order_id as number,
        status: o.status as string,
        price: (o.total_price as number) ?? 0,
        items: (o.products as OrderItem[]) ?? [],
        created_at: o.created_at as string | null,
      }))
    : []

  type RawProduct = { product_id: number; name: string }
  const productNames: ProductMap = {}
  if (Array.isArray(productsRes.data)) {
    ;(productsRes.data as RawProduct[]).forEach((p) => {
      productNames[p.product_id] = p.name
    })
  }

  return { orders, productNames }
}

const STATUS_COLORS: Record<string, string> = {
  Pendente: "#eab308",
  Concluído: "#22c55e",
  Cancelado: "#ef4444",
}

const FLAVOR_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#8b5cf6",
]

function translateStatus(status: string) {
  switch (status) {
    case "Pending":
      return "Pendente"
    case "Finished":
      return "Concluído"
    case "Cancelled":
      return "Cancelado"
    default:
      return status
  }
}

function computeAnalytics(orders: Order[], productNames: ProductMap) {
  const totalOrders = orders.length
  const totalRevenue = orders
    .filter((o) => o.status === "Finished")
    .reduce((sum, o) => sum + o.price, 0)
  const pendingOrders = orders.filter((o) => o.status === "Pending").length

  const statusCount: Record<string, number> = {}
  for (const order of orders) {
    const label = translateStatus(order.status)
    statusCount[label] = (statusCount[label] ?? 0) + 1
  }
  const statusData = Object.entries(statusCount).map(([name, total]) => ({
    name,
    total,
    fill: STATUS_COLORS[name] ?? "#6366f1",
  }))

  const productQty: Record<string, number> = {}
  for (const order of orders.filter((o) => o.status === "Finished")) {
    for (const item of order.items ?? []) {
      const key = productNames[item.product_id] ?? `Produto #${item.product_id}`
      productQty[key] = (productQty[key] ?? 0) + (item.quantity ?? 1)
    }
  }

  const flavorData = Object.entries(productQty)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8)
    .map((entry, index) => ({
      ...entry,
      fill: FLAVOR_COLORS[index % FLAVOR_COLORS.length],
    }))

  return { totalOrders, totalRevenue, pendingOrders, statusData, flavorData }
}

function AnalyticsContent({ promise }: { promise: Promise<{ orders: Order[]; productNames: ProductMap }> }) {
  const { orders, productNames } = use(promise)
  const { totalOrders, totalRevenue, pendingOrders, statusData, flavorData } =
    computeAnalytics(orders, productNames)

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Total de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{totalOrders}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">
              R${" "}
              {totalRevenue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Pedidos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-yellow-500">
              {pendingOrders}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum dado disponível
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statusData} barCategoryGap="35%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 13 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [value, "Pedidos"]}
                    cursor={{ fill: "hsl(var(--muted))" }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sabores Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {flavorData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum dado disponível
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={flavorData}
                    dataKey="quantity"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [value, "Unidades"]}
                  />
                  <Legend/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

export function Analytics() {
  const [promise] = useState<Promise<{ orders: Order[]; productNames: ProductMap }>>(() => fetchData())

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <Loading />
        </div>
      }
    >
      <AnalyticsContent promise={promise} />
    </Suspense>
  )
}
