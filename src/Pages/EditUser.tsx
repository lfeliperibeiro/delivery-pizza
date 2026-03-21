import { api } from "@/api"
import { Checkbox } from "@/components/Checkbox"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Suspense, use, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast, Toaster } from "sonner"

interface UserData {
  name: string
  email: string
  active: boolean
  admin: boolean
}

function extractUserFromResponse(data: unknown): UserData | null {
  if (!data || typeof data !== "object") return null
  const o = data as Record<string, unknown>
  const user = (o.users ?? o.user ?? o) as Record<string, unknown>
  if (!user || typeof user !== "object") return null
  return {
    name: String(user.name ?? ""),
    email: String(user.email ?? ""),
    active: Boolean(user.active ?? user.is_active ?? false),
    admin: Boolean(user.admin ?? user.is_admin ?? false),
  }
}

const EMPTY_USER: UserData = {
  name: "",
  email: "",
  active: false,
  admin: false,
}

async function fetchUserData(id: string): Promise<UserData> {
  const token = localStorage.getItem("access_token")
  if (!token) return EMPTY_USER

  try {
    const response = await api.get(`/users/user/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return extractUserFromResponse(response.data) ?? EMPTY_USER
  } catch {
    toast.error("Erro ao carregar usuário")
    return EMPTY_USER
  }
}

function EditUserForm({
  id,
  userPromise,
}: {
  id: string
  userPromise: Promise<UserData>
}) {
  const navigate = useNavigate()
  const initialUserData = use(userPromise)
  const [userData, setUserData] = useState<UserData>(initialUserData)

  function handleEditUser(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = localStorage.getItem("access_token")
    if (!token) {
      toast.error("Faça login para editar usuário")
      return
    }

    api.put(
      `/users/user/${id}`,
      {
        name: userData.name,
        email: userData.email,
        active: userData.active,
        admin: userData.admin,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
      .then(() => {
        toast.success("Usuário editado com sucesso")
        setTimeout(() => navigate("/users"), 2000)
      })
      .catch(() => {
        toast.error("Erro ao editar usuário")
      })
  }

  return (
    <Card className="flex h-full w-full flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">Editar Usuário</h1>
      <form className="flex flex-col gap-4 w-full max-w-xs" onSubmit={handleEditUser}>
        <div className="flex flex-col gap-2 w-full">
        <label htmlFor="name">Nome do usuário</label>
        <Input type="text" id="name" name="name" value={userData.name} onChange={(event) => setUserData({ ...userData, name: event.target.value })} />
        <label htmlFor="email">Email do usuário</label>
        <Input type="email" id="email" name="email" value={userData.email} onChange={(event) => setUserData({ ...userData, email: event.target.value })} />
        </div>
        <div className="flex flex-col gap-4 w-full">
          <Checkbox id="active" name="active" label="Usuário Ativo" checked={userData.active} onChange={(checked) => setUserData({ ...userData, active: checked })} />
          <Checkbox  id="admin" name="admin" label="Usuário Admin" checked={userData.admin} onChange={(checked) => setUserData({ ...userData, admin: checked })} />
        </div>
        <Button type="submit">Editar Usuário</Button>
      </form>
      <Toaster />
    </Card>
  )
}

export function EditUser() {
  const { id } = useParams<{ id: string }>()
  const [userPromise] = useState<Promise<UserData>>(() =>
    fetchUserData(id ?? ""),
  )

  if (!id) {
    return (
      <Card className="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">Usuário inválido.</p>
      </Card>
    )
  }

  return (
    <Suspense
      fallback={
        <Card className="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
          <p className="text-muted-foreground">Carregando usuário...</p>
        </Card>
      }
    >
      <EditUserForm id={id} userPromise={userPromise} />
    </Suspense>
  )
}