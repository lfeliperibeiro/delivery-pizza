import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
interface FieldInputProps {
  name: string
  setName: (name: string) => void
  username: string
  setUsername: (username: string) => void
  password: string
  setPassword: (password: string) => void
  confirmPassword: string
  setConfirmPassword: (confirmPassword: string) => void
}
export function FieldInputSignUp({
  username,
  setUsername,
  name,
  setName,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
}: FieldInputProps) {
  return (
    <FieldSet className="w-full max-w-xs">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="username">Usuário</FieldLabel>
          <Input
            id="username"
            type="text"
            placeholder="nome do usuario"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <FieldDescription>
            Insira o nome do usuario da sua conta
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <FieldDescription>Insira a senha da sua conta</FieldDescription>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field data-invalid={password !== confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirmar Senha</FieldLabel>
          <FieldDescription>Confirme a senha da sua conta</FieldDescription>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={password !== confirmPassword}
          />
          {password !== confirmPassword && (
            <FieldDescription>As senhas não coincidem</FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <FieldDescription>
            Insira o nome do usuario da sua conta
          </FieldDescription>
          <Input
            id="name"
            type="text"
            placeholder="nome"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
