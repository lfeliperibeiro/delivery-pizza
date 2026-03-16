import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/api"
import { toast, Toaster } from "sonner"
import { FieldInputSignUp } from "@/components/FieldInputSignUp"

export function SignUp() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const navigate = useNavigate()
  const { login } = useAuth()

  function handleSignUp() {
    api
      .post("/auth/signup", {
        password: password,
        confirm_password: confirmPassword,
        name: name,
        email: username,
        active: false,
        admin: false,
      })
      .then((response) => {
        return response.data
      })
      .then((data) => {
        toast.success("Usuário cadastrado com sucesso", {
          description:
            "Você será redirecionado para a página inicial em 2 segundos",
        })
        login(data.access_token)
        setTimeout(() => navigate("/home"), 2000)
      })
      .catch(() => {
        toast.error("Erro ao cadastrar usuário", {
          action: {
            label: "Voltar",
            onClick: () => console.log("Voltar"),
          },
        })
      })
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex w-full max-w-xs flex-col gap-4">
        <h1 className="text-2xl font-bold">Cadastro</h1>
        <FieldInputSignUp
          username={username}
          setUsername={setUsername}
          name={name}
          setName={setName}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
        />
        <Button
          onClick={handleSignUp}
          disabled={!username || !password || !name}
        >
          Cadastrar
        </Button>
      </div>
      <Toaster />
    </div>
  )
}
