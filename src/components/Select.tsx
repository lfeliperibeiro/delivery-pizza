import {
  Select as SelectUI,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface Product {
  id: number
  name: string
  price: number
  size: string
}

export function Select({
  products,
  multiple = false,
  value,
  values,
  onValueChange,
  onValuesChange,
}: {
  products: Product[]
  multiple?: boolean
  value?: string
  values?: string[]
  onValueChange?: (value: string | null) => void
  onValuesChange?: (values: string[] | null) => void
}) {
  const safeProducts = Array.isArray(products) ? products : []
  const selectedProductName =
    safeProducts.find((product) => String(product.id) === value)?.name || ""

  const selectedProductNames = safeProducts
    .filter((product) => (values ?? []).includes(String(product.id)))
    .map((product) => product.name)

  const triggerLabel = multiple
    ? selectedProductNames.length > 0
      ? selectedProductNames.join(", ")
      : "Selecione os produtos"
    : selectedProductName || "Selecione um produto"

  return (
    <SelectUI
      multiple={multiple}
      value={multiple ? values : value}
      onValueChange={(nextValue) => {
        if (multiple) {
          onValuesChange?.((nextValue as string[] | null) ?? null)
          return
        }
        onValueChange?.((nextValue as string | null) ?? null)
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue>{triggerLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Produtos</SelectLabel>
          {safeProducts.map((product) => (
            <SelectItem key={product.id} value={String(product.id)}>
              {product.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </SelectUI>
  )
}
