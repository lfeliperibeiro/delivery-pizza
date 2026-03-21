import { api } from "@/api"
import { Select, type Product } from "@/components/Select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast, Toaster } from "sonner"

interface OrderData {
  id: number | null
  user_id: number | null
  product_ids: number[]
  quantity: number | null
}

export function EditOrder() {
  const [searchParams] = useSearchParams()
  const orderId = Number(searchParams.get("id"))
  const navigate = useNavigate()

  const [orderData, setOrderData] = useState<OrderData>({
    id: Number.isNaN(orderId) ? null : orderId,
    user_id: null,
    product_ids: [],
    quantity: null,
  })

  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      return
    }
    api.get("/orders/list", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        const data = response.data
        if (Array.isArray(data)) {
          setProducts(data)
          return
        }
        if (data && Array.isArray(data.products)) {
          setProducts(data.products)
          return
        }
        setProducts([])
      })
  }, [])
  function handleCreateOrder(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = localStorage.getItem("access_token")

    if (!token) {
      toast.error("Faça login para criar um pedido")
      return
    }
    if (orderData.product_ids.length === 0) {
      toast.error("Selecione ao menos um produto")
      return
    }
    if (!orderData.user_id || orderData.user_id <= 0) {
      toast.error("Informe um usuário válido")
      return
    }
    if (!orderData.quantity || orderData.quantity <= 0) {
      toast.error("Informe uma quantidade válida")
      return
    }
    if (!orderData.id) {
      toast.error("ID do pedido inválido")
      return
    }
    api
      .put(
        `/orders/order/edit/${orderData.id}`,
        {
          user_id: orderData.user_id,
          products: orderData.product_ids.map((productId) => ({
            product_id: productId,
            quantity: orderData.quantity!,
          })),
        },

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
    .then(() => {
      toast.success("Pedido editado com sucesso")
      setTimeout(() => navigate("/home"), 2000)
    })
    .catch(() => {
      toast.error("Erro ao editar pedido")
    })
  }
  return (
    <div  className="flex h-full w-full flex-col items-center gap-4">
      <form className="flex flex-col gap-4 w-full" onSubmit={handleCreateOrder}>
        <div className="flex flex-col gap-2">
          <label htmlFor="user_id">ID do usuário</label>
          <Input type="number" id="user_id" name="user_id" value={orderData.user_id ?? ""} onChange={(event) => setOrderData({ ...orderData, user_id: Number(event.target.value) })} />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label htmlFor="product_id">Produtos</label>
            <Select
              products={products}
              multiple
              values={orderData.product_ids.map(String)}
              onValuesChange={(values) =>
                setOrderData({
                  ...orderData,
                  product_ids: (values ?? []).map(Number),
                })
              }
            />
          </div>
        <div className="flex flex-col gap-2 w-full">
          <label htmlFor="quantity">Quantidade</label>
          <Input type="number" id="quantity" name="quantity" value={orderData.quantity ?? ""} onChange={(event) => setOrderData({ ...orderData, quantity: Number(event.target.value) })} />
        </div>
        <Button type="submit">Editar Pedido</Button>
      </form>
      <Toaster />
    </div>
  )
}