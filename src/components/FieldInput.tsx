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
export function FieldInput({username, setUsername, password, setPassword}: FieldInputProps) {
  return (
    <FieldSet className="w-full max-w-xs">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input id="username" type="text" placeholder="Max Leiter"
          value={username} onChange={(e) => setUsername(e.target.value)} />
          <FieldDescription>
            Choose a unique username for your account.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <FieldDescription>
            Must be at least 8 characters long.
          </FieldDescription>
          <Input id="password" type="password" placeholder="••••••••"  value={password} onChange={(e) => setPassword(e.target.value)}/>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
