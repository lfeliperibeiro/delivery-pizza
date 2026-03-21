import { api } from "@/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast, Toaster } from "sonner"

interface ProductData {
  "name": string
  "price": string | null,
  "size": string
}

export function AddProduct() {
  const [productData, setProductData] = useState<ProductData>({
    name: "",
    price: null,
    size: "",
  })

  function handleAddProduct(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = localStorage.getItem("access_token")
    if (!token) {
      toast.error("Faça login para adicionar um produto")
      return
    }

    api.post(`/orders/order/add_product`, {
      name: productData.name,
      price: productData.price,
      size: productData.size,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    ).then(() => {
      toast.success("Produto adicionado com sucesso")
    }).catch(() => {
      toast.error("Erro ao adicionar produto")
    })
  }
  return (
    <Card className="flex h-full w-full flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">Adicionar Produto</h1>
      <form className="flex flex-col gap-4 w-full max-w-xs" onSubmit={handleAddProduct}>
        <div className="flex flex-col gap-2 w-full">
          <label htmlFor="name">Sabor da pizza</label>
          <Input type="text" id="name" name="name" value={productData.name} onChange={(event) => setProductData({ ...productData, name: event.target.value })} />
          <label htmlFor="price">Preço</label>
          <Input type="text" id="price" name="price" value={productData.price ?? ""} onChange={(event) => setProductData({ ...productData, price: event.target.value })} />
          <label htmlFor="size">Tamanho</label>
          <Input type="text" id="size" name="size" placeholder="Pequena, Média, Grande" value={productData.size} onChange={(event) => setProductData({ ...productData, size: event.target.value })} />
        </div>
        <Button type="submit">Adicionar Produto</Button>
      </form>
      <Toaster />
    </Card>
  )
}