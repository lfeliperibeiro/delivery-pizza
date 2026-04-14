import { api } from "@/api"
import { Select, type Product } from "@/components/Select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast, Toaster } from "sonner"

interface ProductEntry {
  product_id: number
  quantity: number
}

interface OrderData {
  id: number | null
  user_id: number | null
  products: ProductEntry[]
}

type CurrentOrderStatus = "idle" | "found" | "not_found"

function extractNumericId(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input) && input > 0) {
    return input
  }

  if (typeof input === "string" && /^\d+$/.test(input.trim())) {
    const parsed = Number(input.trim())
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  return null
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split(".")

  if (!payload) {
    return null
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padding = (4 - (normalized.length % 4)) % 4
    const padded = normalized.padEnd(normalized.length + padding, "=")
    const decoded = atob(padded)
    const json = decodeURIComponent(
      Array.from(decoded)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    )

    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

function resolveUserIdFromToken(): number | null {
  const token = localStorage.getItem("access_token")
  if (!token) {
    return null
  }

  const jwtPayload = parseJwtPayload(token)
  if (!jwtPayload) {
    return null
  }

  return extractNumericId(jwtPayload.user_id ?? jwtPayload.id ?? jwtPayload.sub)
}

function resolveOrderUserId(order: Record<string, unknown>): number | null {
  const nestedUser =
    order.user && typeof order.user === "object"
      ? (order.user as Record<string, unknown>)
      : null

  return (
    extractNumericId(order.user_id) ??
    extractNumericId(order.id_user) ??
    extractNumericId(nestedUser?.user_id) ??
    extractNumericId(nestedUser?.id) ??
    resolveUserIdFromToken()
  )
}

export function EditOrder() {
  const [searchParams] = useSearchParams()
  const orderId = Number(searchParams.get("id"))
  const navigate = useNavigate()

  const [orderData, setOrderData] = useState<OrderData>({
    id: Number.isNaN(orderId) ? null : orderId,
    user_id: null,
    products: [],
  })
  const [products, setProducts] = useState<Product[]>([])
  const [currentOrderStatus, setCurrentOrderStatus] = useState<CurrentOrderStatus>("idle")

  useEffect(() => {
    api.get("/orders/list")
      .then((response) => {
        const data = response.data
        if (!Array.isArray(data)) {
          setProducts([])
          return
        }

        type RawProduct = { product_id: number; name: string; price: number; size: string }
        setProducts(
          (data as RawProduct[]).map((product) => ({
            id: product.product_id,
            name: product.name,
            price: product.price,
            size: product.size,
          })),
        )
      })
      .catch(() => {
        setProducts([])
      })
  }, [])

  useEffect(() => {
    if (!orderId || Number.isNaN(orderId)) {
      setCurrentOrderStatus("not_found")
      return
    }

    api.get("/orders/list_order/order_user")
      .then((response) => {
        const data = response.data
        if (!Array.isArray(data)) {
          setCurrentOrderStatus("not_found")
          return
        }

        const currentOrder = data.find(
          (order: { order_id: number }) => order.order_id === orderId,
        ) as Record<string, unknown> | undefined

        if (!currentOrder) {
          setCurrentOrderStatus("not_found")
          return
        }

        const resolvedUserId = resolveOrderUserId(currentOrder)
        if (!resolvedUserId) {
          setCurrentOrderStatus("not_found")
          return
        }

        setOrderData({
          id: extractNumericId(currentOrder.order_id),
          user_id: resolvedUserId,
          products: Array.isArray(currentOrder.products) ? currentOrder.products : [],
        })
        setCurrentOrderStatus("found")
      })
      .catch(() => {
        setCurrentOrderStatus("not_found")
      })
  }, [orderId])

  function handleProductSelect(values: string[] | null) {
    if (currentOrderStatus !== "found") {
      return
    }

    const ids = (values ?? []).map(Number)
    setOrderData((prev) => {
      const existing = new Map(prev.products.map((product) => [product.product_id, product]))
      return {
        ...prev,
        products: ids.map((id) => existing.get(id) ?? { product_id: id, quantity: 1 }),
      }
    })
  }

  function handleQuantityChange(product_id: number, quantity: number) {
    if (currentOrderStatus !== "found") {
      return
    }

    setOrderData((prev) => ({
      ...prev,
      products: prev.products.map((product) =>
        product.product_id === product_id ? { ...product, quantity } : product,
      ),
    }))
  }

  function handleCreateOrder(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!orderData.id) {
      toast.error("ID do pedido inválido")
      return
    }
    if (currentOrderStatus !== "found") {
      toast.error("Pedido não encontrado")
      return
    }
    if (orderData.products.length === 0) {
      toast.error("Selecione ao menos um produto")
      return
    }
    if (orderData.products.some((product) => product.quantity <= 0)) {
      toast.error("Informe uma quantidade válida para todos os produtos")
      return
    }

    api.put(`/orders/order/edit/${orderData.id}`, {
      id: orderData.id,
      user_id: orderData.user_id,
      products: orderData.products,
    })
      .then(() => {
        toast.success("Pedido editado com sucesso")
        setTimeout(() => navigate("/home"), 2000)
      })
      .catch(() => {
        toast.error("Erro ao editar pedido")
      })
  }

  const selectedIds = orderData.products.map((product) => String(product.product_id))

  return (
    <div className="flex h-full w-full flex-col items-center gap-4">
      <form className="flex w-full flex-col gap-4" onSubmit={handleCreateOrder} noValidate>
        <div className="flex w-full flex-col gap-2">
          <label>Produtos</label>
          <Select
            products={products}
            multiple
            values={selectedIds}
            onValuesChange={handleProductSelect}
          />
        </div>

        {orderData.products.length > 0 && (
          <div className="my-6 flex flex-col gap-2 rounded border p-4">
            <label className="text-lg">Quantidade por produto</label>
            {orderData.products.map((entry) => {
              const product = products.find((item) => item.id === entry.product_id)
              return (
                <div key={entry.product_id} className="flex items-center gap-3">
                  <span className="flex-1 text-sm">{product?.name ?? `#${entry.product_id}`}</span>
                  <Input
                    type="number"
                    className="w-24"
                    min={1}
                    value={entry.quantity}
                    onChange={(event) =>
                      handleQuantityChange(entry.product_id, Number(event.target.value))
                    }
                  />
                </div>
              )
            })}
          </div>
        )}

        <Button type="submit">Editar Pedido</Button>
      </form>
      <Toaster />
    </div>
  )
}
