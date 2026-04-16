import { Button } from "@/components/ui/button"
import { FieldInputSignIn } from "@/components/FieldInputSignIn"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/api"
import  { toast, Toaster } from "sonner"

export function SignIn(){
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const { login } = useAuth()


  function handleSignIn(){
    api.post('/auth/login', {
      email: email,
      password: password,
    })
    .then((response) => response.data)
    .then(async (data) => {
      try {
        const usersRes = await api.get('/users/users')
        const users: Array<{ id: number; email: string }> = usersRes.data?.users ?? []
        const currentUser = users.find((u) => u.email === email)
        login({ ...data, user_id: currentUser?.id ?? null })
      } catch {
        login(data)
      }
      navigate('/home')
    })
    .catch(() => {
         toast.error("Usuário não encontrado ou senha inválida", {

          action: {
            label: "Voltar",
            onClick: () => console.log("Voltar"),
          },
      })
    })
  }

  return (
    <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col gap-4 w-full max-w-xs">
            <h1 className="text-2xl font-bold">Login</h1>
            <FieldInputSignIn username={email} setUsername={setEmail} password={password} setPassword={setPassword} />
            <Button onClick={handleSignIn} disabled={!email || !password}>Login</Button>
            <p className="text-center text-sm">você ainda não tem uma conta? <a href="/register" className="text-orange-500">Clique aqui</a></p>
        </div>
        <Toaster />
    </div>
  )
}
