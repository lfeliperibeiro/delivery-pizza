import { Checkbox as CheckboxUI } from "@/components/ui/checkbox"
import {
  Field,
  FieldGroup,
} from "@/components/ui/field"
import { Label } from "@/components/ui/label"

interface CheckboxProps {
  id: string
  name: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Checkbox({ id, name, label, checked, onChange }: CheckboxProps) {
  return (
    <FieldGroup className="max-w-sm">
      <Field orientation="horizontal">
        <CheckboxUI
          id={id}
          name={name}
          checked={checked}
          onCheckedChange={(value) => onChange(Boolean(value))}
          className="data-checked:text-amber-50! data-checked:bg-orange-400! data-checked:border-orange-400!"
        />
        <Label htmlFor={id}>{label}</Label>
      </Field>
    </FieldGroup>
  )
}
