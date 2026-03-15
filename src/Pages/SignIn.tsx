import { FieldInput } from "@/components/FieldInput"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

export function SignIn(){
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSignIn = () => {
   fetch('http://127.0.0.1:8000/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: email,
        password: password,
      }),
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Login failed');
      }
      return response.json();
    })
    .then((data) => {
      login(data.access_token)
      navigate('/home')
    })
    .catch((error) => console.error(error));
  }

  return (
    <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col gap-4 w-full max-w-xs">
            <h1 className="text-2xl font-bold">SignIn</h1>
            <FieldInput username={email} setUsername={setEmail} password={password} setPassword={setPassword} />
            <Button onClick={handleSignIn}>SignIn</Button>
        </div>
    </div>
  )
}