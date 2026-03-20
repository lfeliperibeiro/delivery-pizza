import { Tabs } from "@/components/Tabs"
import { OrderList } from "./OrderList"
import { CreateOrder } from "./CreateOrder"
import { AddProduct } from "./AddProduct"
import { RemoveProduct } from "./RemoveProduct"
import { Products } from "./Products"

export function Orders() {
  const tabs = [
    { value: "pedidos", label: "Pedidos" },
    { value: "criar_pedido", label: "Criar Pedido" },
    { value: "produtos", label: "Produtos" },
    { value: "adicionar_produto", label: "Adicionar Produto" },
    { value: "remover_produto", label: "Remover Produto" },
  ]
  const content = [
    { value: "pedidos", content: <OrderList /> },
    { value: "criar_pedido", content: <CreateOrder /> },
    { value: "produtos", content: <Products /> },
    { value: "adicionar_produto", content: <AddProduct /> },
    { value: "remover_produto", content: <RemoveProduct /> },
  ]
  return (
    <div className="flex h-full w-full flex-col items-center gap-4">
      <Tabs tabs={tabs} content={content} />
    </div>
  )
}
