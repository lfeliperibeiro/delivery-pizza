import { api } from "@/api"
import axios from "axios"
import { Loading } from "@/components/Loading"
import { UsersTable } from "@/components/UsersTable"
import { Suspense, use, useState } from "react"
import { toast, Toaster } from "sonner"

interface User {
  id: number
  name: string
  email: string
  active: boolean
  admin: boolean
}

/** API pode retornar lista ou um único usuário em objeto (ex.: `{ users: { id, name, ... } }`). */
function coerceToUserList(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>
    if (o.id !== undefined && o.id !== null) {
      return [value]
    }
  }
  return null
}

function extractUsersArray(data: unknown): unknown[] {
  const asList = coerceToUserList(data)
  if (asList) return asList

  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>
    for (const key of ["users", "user_list", "data", "results", "items"]) {
      const v = o[key]
      const fromKey = coerceToUserList(v)
      if (fromKey) return fromKey
    }
  }
  return []
}

function normalizeUser(raw: unknown): User | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const idVal = r.id ?? r.user_id
  const id = typeof idVal === "number" ? idVal : Number(idVal)
  if (Number.isNaN(id)) return null

  const name = String(r.name ?? r.username ?? r.full_name ?? "").trim()
  const email = String(r.email ?? "").trim()

  const activeRaw = r.active ?? r.is_active
  const adminRaw = r.admin ?? r.is_admin

  return {
    id,
    name: name || email || `Usuário #${id}`,
    email,
    active: activeRaw === undefined ? true : Boolean(activeRaw),
    admin: Boolean(adminRaw),
  }
}

async function fetchUsers(): Promise<User[]> {
  try {
    let data: unknown
    try {
      const response = await api.get("/users/users")
      data = response.data
    } catch (firstError) {
      if (axios.isAxiosError(firstError) && firstError.response?.status === 404) {
        const response = await api.get("/users")
        data = response.data
      } else {
        throw firstError
      }
    }

    const rawList = extractUsersArray(data)
    return rawList
      .map(normalizeUser)
      .filter((u): u is User => u !== null)
  } catch (error) {
    console.error("Error fetching users:", error)
    toast.error("Erro ao buscar usuários")
    return []
  }
}

function UsersContent({ usersPromise }: { usersPromise: Promise<User[]> }) {
  const users = use(usersPromise)
  return <UsersTable users={users} />
}

export function Users() {
  const [usersPromise] = useState<Promise<User[]>>(() => fetchUsers())

  return (
    <>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center p-8 text-muted-foreground">
            <Loading />
          </div>
        }
      >
        <UsersContent usersPromise={usersPromise} />
      </Suspense>
      <Toaster />
    </>
  )
}
