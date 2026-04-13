import { api } from "@/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast, Toaster } from "sonner"



export function RemoveProduct() {
  const [productId, setProductId] = useState<number | undefined>(undefined)

  function handleRemoveProduct(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()

    api.post(`orders/order/remove_product/${productId}`, {
      product_id: productId,
    }).then(() => {
      toast.success("Produto removido com sucesso")
    }).catch(() => {
      toast.error("Erro ao remover produto")
    })
  }
  return (
    <Card className="flex h-full w-full flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">Remover Produto</h1>
      <form className="flex flex-col gap-4 w-full max-w-xs" onSubmit={handleRemoveProduct}>
        <div className="flex flex-col gap-2 w-full">
        <label htmlFor="productId">ID do produto</label>
        <Input type="number" id="productId" name="productId" value={productId} onChange={(event) => setProductId(Number(event.target.value))} />
        </div>
        <Button type="submit">Remover Produto</Button>
      </form>
      <Toaster />
    </Card>
  )
}