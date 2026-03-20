import { useEffect } from "react"
import { RouterProvider } from "react-router-dom"
import { router } from "./routes"
import { AuthProvider } from "./contexts/AuthContext"
import { useAuth } from "./contexts/AuthContext"

function InvalidTokenListener() {
  const { logout } = useAuth()

  useEffect(() => {
    const handler = () => {
      logout()
      window.location.href = "/"
    }

    window.addEventListener("auth:invalid-token", handler)
    return () => window.removeEventListener("auth:invalid-token", handler)
  }, [logout])

  return null
}

export function App() {
  return (
    <AuthProvider>
      <InvalidTokenListener />
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
