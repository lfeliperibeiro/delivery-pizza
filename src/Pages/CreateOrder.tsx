import { api } from "@/api"
import { Select, type Product } from "@/components/Select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { toast, Toaster } from "sonner"

interface ProductEntry {
  product_id: number
  quantity: number
}

interface OrderData {
  user_id: number | null
  products: ProductEntry[]
  notes: string
  payment_method: string
}

export function CreateOrder() {
  const [orderData, setOrderData] = useState<OrderData>({
    user_id: null,
    products: [],
    notes: "",
    payment_method: "",
  })

  const [availableProducts, setAvailableProducts] = useState<Product[]>([])

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) return

    api.get("/orders/list", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      const data = response.data
      if (!Array.isArray(data)) { setAvailableProducts([]); return }

      type RawProduct = { product_id: number; name: string; price: number; size: string }
      setAvailableProducts((data as RawProduct[]).map((p) => ({ id: p.product_id, name: p.name, price: p.price, size: p.size })))
    })
  }, [])

  function handleProductSelect(values: string[] | null) {
    const ids = (values ?? []).map(Number)
    setOrderData((prev) => {
      const existing = new Map(prev.products.map((p) => [p.product_id, p]))
      return {
        ...prev,
        products: ids.map((id) => existing.get(id) ?? { product_id: id, quantity: 1 }),
      }
    })
  }

  function handleQuantityChange(product_id: number, quantity: number) {
    setOrderData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.product_id === product_id ? { ...p, quantity } : p
      ),
    }))
  }

  function handleCreateOrder(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = localStorage.getItem("access_token")

    if (!token) {
      toast.error("Faça login para criar um pedido")
      return
    }
    if (!orderData.user_id || orderData.user_id <= 0) {
      toast.error("Informe um usuário válido")
      return
    }
    if (orderData.products.length === 0) {
      toast.error("Selecione ao menos um produto")
      return
    }
    if (orderData.products.some((p) => p.quantity <= 0)) {
      toast.error("Informe uma quantidade válida para todos os produtos")
      return
    }

    api.post(
      "/orders/order",
      {
        user_id: orderData.user_id,
        products: orderData.products,
        notes: orderData.notes || null,
        payment_method: orderData.payment_method || null,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )
      .then(() => {
        toast.success("Pedido criado com sucesso")
        setOrderData({ user_id: null, products: [], notes: "", payment_method: "" })
      })
      .catch(() => {
        toast.error("Erro ao criar pedido")
      })
  }

  const selectedIds = orderData.products.map((p) => String(p.product_id))

  return (
    <div className="flex h-full w-full flex-col items-center gap-4">
      <form className="flex flex-col gap-4 w-full" onSubmit={handleCreateOrder}>
        <div className="flex flex-col gap-2">
          <label htmlFor="user_id">ID do usuário</label>
          <Input
            type="number"
            id="user_id"
            value={orderData.user_id ?? ""}
            onChange={(e) => setOrderData({ ...orderData, user_id: Number(e.target.value) })}
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label>Produtos</label>
          <Select
            products={availableProducts}
            multiple
            values={selectedIds}
            onValuesChange={handleProductSelect}
          />
        </div>

        {orderData.products.length > 0 && (
          <div className="flex flex-col gap-2 my-6 border p-4 rounded">
            <label className="text-lg">Quantidade por produto</label>
            {orderData.products.map((entry) => {
              const product = availableProducts.find((p) => p.id === entry.product_id)
              return (
                <div key={entry.product_id} className="flex items-center gap-3">
                  <span className="flex-1 text-sm">{product?.name ?? `#${entry.product_id}`}</span>
                  <Input
                    type="number"
                    className="w-24"
                    min={1}
                    value={entry.quantity}
                    onChange={(e) => handleQuantityChange(entry.product_id, Number(e.target.value))}
                  />
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="payment_method">Método de pagamento</label>
          <Input
            id="payment_method"
            value={orderData.payment_method}
            onChange={(e) => setOrderData({ ...orderData, payment_method: e.target.value })}
            placeholder="Ex: Cartão, Pix, Dinheiro"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="notes">Observações</label>
          <Input
            id="notes"
            value={orderData.notes}
            onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
            placeholder="Ex: Sem cebola"
          />
        </div>

        <Button type="submit">Criar Pedido</Button>
      </form>
      <Toaster />
    </div>
  )
}
