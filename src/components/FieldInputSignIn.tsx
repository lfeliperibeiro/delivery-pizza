import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
interface   FieldInputProps {
  username: string
  setUsername: (username: string) => void
  password: string
  setPassword: (password: string) => void
}
export function FieldInputSignIn({username, setUsername, password, setPassword}: FieldInputProps) {
  return (
    <FieldSet className="w-full max-w-xs">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="username">Email</FieldLabel>
          <Input id="username" type="text" placeholder="email" required
          value={username} onChange={(e) => setUsername(e.target.value)} />
          <FieldDescription>
            Insira o email da sua conta
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <FieldDescription>
            Insira a senha da sua conta
          </FieldDescription>
          <Input id="password" type="password" placeholder="••••••••" required
           value={password} onChange={(e) => setPassword(e.target.value)}/>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
