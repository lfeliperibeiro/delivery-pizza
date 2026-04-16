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

  function renderValue(current: unknown) {
    if (Array.isArray(current) && current.length > 0) {
      const names = safeProducts
        .filter((p) => (current as string[]).includes(String(p.id)))
        .map((p) => p.name)
      return names.length > 0 ? names.join(", ") : "Selecione os produtos"
    }
    if (typeof current === "string" && current) {
      return safeProducts.find((p) => String(p.id) === current)?.name ?? "Selecione um produto"
    }
    return multiple ? "Selecione os produtos" : "Selecione um produto"
  }

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
        <SelectValue>{renderValue}</SelectValue>
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
