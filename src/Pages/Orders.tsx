import { Tabs } from "@/components/Tabs"
import { OrderList } from "./OrderList"

export function Orders() {
  const tabs = [
    { value: "pedidos", label: "Pedidos" },
    { value: "criar_pedido", label: "Criar Pedido" },
  ]
  const content = [
    { value: "pedidos", content: <OrderList /> },
    { value: "criar_pedido", content: <p>Criar Pedido</p> },
  ]
  return (
    <div className="flex h-full w-full flex-col items-center gap-4">
      <Tabs tabs={tabs} content={content} />
    </div>
  )
}
