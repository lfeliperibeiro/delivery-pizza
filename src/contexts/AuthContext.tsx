/* eslint-disable react-refresh/only-export-components */
import { api } from "@/api"
import { createContext, useContext, useState, type ReactNode } from "react"

type IdentityStatus = "resolved" | "fallback" | "anonymous"
type AuthSnapshotSource = "login-response" | "fallback"

interface AuthUserSnapshot {
  displayName: string
  source: AuthSnapshotSource
}

interface AuthContextType {
  displayName: string | null
  identityStatus: IdentityStatus
  login: (authPayload?: unknown) => void
  logout: () => void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEFAULT_DISPLAY_NAME = "Usuario"

function extractDisplayName(input: unknown): string | null {
  if (typeof input !== "string") return null
  const trimmed = input.trim()
  return trimmed || null
}

function resolveDisplayNameFromPayload(authPayload: unknown): string | null {
  if (!authPayload || typeof authPayload !== "object") return null
  const payload = authPayload as Record<string, unknown>
  const nestedUser = payload.user
  if (nestedUser && typeof nestedUser === "object") {
    const nestedName = extractDisplayName((nestedUser as Record<string, unknown>).name)
    if (nestedName) return nestedName
  }
  return extractDisplayName(payload.name)
}

function resolveLoginSnapshot(authPayload?: unknown): AuthUserSnapshot {
  const payloadDisplayName = resolveDisplayNameFromPayload(authPayload)
  if (payloadDisplayName) {
    return { displayName: payloadDisplayName, source: "login-response" }
  }
  return { displayName: DEFAULT_DISPLAY_NAME, source: "fallback" }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userSnapshot, setUserSnapshot] = useState<AuthUserSnapshot | null>(null)

  const login = (authPayload?: unknown) => {
    const snapshot = resolveLoginSnapshot(authPayload)
    setIsAuthenticated(true)
    setUserSnapshot(snapshot)
  }

  const logout = async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // clear local state regardless of API failure
    }
    setIsAuthenticated(false)
    setUserSnapshot(null)
  }

  const displayName = userSnapshot?.displayName ?? null
  const identityStatus: IdentityStatus = isAuthenticated
    ? userSnapshot?.source === "login-response"
      ? "resolved"
      : "fallback"
    : "anonymous"

  return (
    <AuthContext.Provider
      value={{ displayName, identityStatus, login, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
