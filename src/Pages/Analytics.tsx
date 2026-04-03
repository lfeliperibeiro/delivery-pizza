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
  Legend,
} from "recharts"

interface OrderItem {
  name?: string
  price: number
  quantity: number
  size: string
}

interface Order {
  id: number
  status: string
  price: number
  items: OrderItem[]
  created_at: string | null
}

async function fetchOrders(): Promise<Order[]> {
  const token = localStorage.getItem("access_token")
  try {
    const response = await api.get("/orders/list_order/order_user", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = response.data
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
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

function computeAnalytics(orders: Order[]) {
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

  const flavorQty: Record<string, number> = {}
  const flavorRevenue: Record<string, number> = {}
  for (const order of orders) {
    for (const item of order.items ?? []) {
      const name = item.name ?? "Desconhecido"
      flavorQty[name] = (flavorQty[name] ?? 0) + (item.quantity ?? 1)
      flavorRevenue[name] =
        (flavorRevenue[name] ?? 0) + item.price * (item.quantity ?? 1)
    }
  }

  const flavorData = Object.entries(flavorQty)
    .map(([name, quantity]) => ({
      name,
      quantity,
      receita: flavorRevenue[name] ?? 0,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8)
    .map((entry, index) => ({
      ...entry,
      fill: FLAVOR_COLORS[index % FLAVOR_COLORS.length],
    }))

  return { totalOrders, totalRevenue, pendingOrders, statusData, flavorData }
}

function AnalyticsContent({ promise }: { promise: Promise<Order[]> }) {
  const orders = use(promise)
  const { totalOrders, totalRevenue, pendingOrders, statusData, flavorData } =
    computeAnalytics(orders)

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receita por Sabor (Top 8)</CardTitle>
        </CardHeader>
        <CardContent>
          {flavorData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum dado disponível
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={flavorData.length * 52 + 32}>
              <BarChart
                data={flavorData}
                layout="vertical"
                margin={{ left: 16, right: 24 }}
                barCategoryGap="30%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) =>
                    `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
                  }
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 13 }}
                />
                <Tooltip
                  formatter={(value) => [
                    `R$ ${value?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                    "Receita",
                  ]}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Bar dataKey="receita" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function Analytics() {
  const [promise] = useState<Promise<Order[]>>(() => fetchOrders())

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
