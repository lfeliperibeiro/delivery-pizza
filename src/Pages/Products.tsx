import { api } from "@/api"
import { Loading } from "@/components/Loading"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Suspense, use, useState } from "react"
import { toast, Toaster } from "sonner"

export interface Product {
  id: number,
  name: string,
  price: number,
  size: string
}

async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await api.get("/orders/list")

    const data = response.data
    if (!Array.isArray(data)) return []

    type RawProduct = { product_id: number; name: string; price: number; size: string }
    return (data as RawProduct[]).map((p) => ({ id: p.product_id, name: p.name, price: p.price, size: p.size }))
  } catch {
    toast.error("Erro ao buscar produtos")
    return []
  }
}

function ProductsTable({ productsPromise }: { productsPromise: Promise<Product[]> }) {
  const products = use(productsPromise)

  return (
    <Table>
      <TableCaption>Lista de produtos.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">ID</TableHead>
          <TableHead>Sabor</TableHead>
          <TableHead>Preço</TableHead>
          <TableHead className="text-right">Tamanho</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              Nenhum produto encontrado.
            </TableCell>
          </TableRow>
        )}
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.id}</TableCell>
            <TableCell>{product.name}</TableCell>
            <TableCell>
              {product.price.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </TableCell>
            <TableCell className="text-right">{product.size}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function Products() {
  const [productsPromise] = useState<Promise<Product[]>>(() =>
    fetchProducts(),
  )

  return (
    <>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center p-8 text-muted-foreground">
            <Loading />
          </div>
        }
      >
        <ProductsTable productsPromise={productsPromise} />
      </Suspense>
      <Toaster />
    </>
  )
}
