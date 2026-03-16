import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "./ui/badge"

export interface OrderTableProps {
  id: number
  user: number
  price: number
  status: string
}

export function OrderTable({ orders }: { orders: OrderTableProps[] }) {
  const getStatusColor = (status: string) => {
    return status === "Pending"
      ? "bg-yellow-500 text-black"
      : status === "Finished"
        ? "bg-green-500 text-black"
        : "bg-red-500 text-black"
  }
  return (
    <Table>
      <TableCaption>Lista de pedidos.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">ID</TableHead>
          <TableHead>Usuário</TableHead>
          <TableHead>Preço</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center">
              Nenhum pedido encontrado.
            </TableCell>
          </TableRow>
        )}
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id}</TableCell>
            <TableCell>{order.user}</TableCell>
            <TableCell>
              {order.price.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </TableCell>
            <TableCell className="text-right">
              <Badge
                variant="secondary"
                className={getStatusColor(order.status)}
              >
                {order.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">
            {orders
              .reduce((acc, order) => acc + order.price, 0)
              .toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
