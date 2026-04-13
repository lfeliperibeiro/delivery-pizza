/* eslint-disable react-refresh/only-export-components */
import { api } from "@/api"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type IdentityStatus = "resolved" | "fallback" | "anonymous"

type AuthSnapshotSource = "login-response" | "jwt-claim" | "profile" | "fallback"

interface AuthUserSnapshot {
  displayName: string
  source: AuthSnapshotSource
}

interface AuthContextType {
  token: string | null
  displayName: string | null
  identityStatus: IdentityStatus
  login: (newToken: string, authPayload?: unknown) => void
  logout: () => void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ACCESS_TOKEN_KEY = "access_token"
const AUTH_USER_KEY = "auth_user"
const DEFAULT_DISPLAY_NAME = "Usuario"

function parseStoredSnapshot(): AuthUserSnapshot | null {
  const rawSnapshot = localStorage.getItem(AUTH_USER_KEY)

  if (!rawSnapshot) {
    return null
  }

  try {
    const parsed = JSON.parse(rawSnapshot) as Partial<AuthUserSnapshot>

    if (typeof parsed.displayName !== "string" || typeof parsed.source !== "string") {
      return null
    }

    const displayName = parsed.displayName.trim()
    if (!displayName) {
      return null
    }

    if (!["login-response", "jwt-claim", "profile", "fallback"].includes(parsed.source)) {
      return null
    }

    return {
      displayName,
      source: parsed.source as AuthSnapshotSource,
    }
  } catch {
    return null
  }
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split(".")

  if (!payload) {
    return null
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padding = (4 - (normalized.length % 4)) % 4
    const padded = normalized.padEnd(normalized.length + padding, "=")
    const decoded = atob(padded)
    const json = decodeURIComponent(
      Array.from(decoded)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    )

    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

function extractDisplayName(input: unknown): string | null {
  if (typeof input !== "string") {
    return null
  }

  const trimmed = input.trim()
  return trimmed || null
}

function resolveDisplayNameFromPayload(authPayload: unknown): string | null {
  if (!authPayload || typeof authPayload !== "object") {
    return null
  }

  const payload = authPayload as Record<string, unknown>
  const nestedUser = payload.user

  if (nestedUser && typeof nestedUser === "object") {
    const nestedName = extractDisplayName((nestedUser as Record<string, unknown>).name)
    if (nestedName) {
      return nestedName
    }
  }

  return extractDisplayName(payload.name)
}

function extractNumericId(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input) && input > 0) {
    return input
  }

  if (typeof input === "string" && /^\d+$/.test(input.trim())) {
    const parsed = Number(input.trim())
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  return null
}

function resolveUserIdFromToken(token: string): number | null {
  const jwtPayload = parseJwtPayload(token)
  if (!jwtPayload) {
    return null
  }

  return extractNumericId(jwtPayload.user_id ?? jwtPayload.id ?? jwtPayload.sub)
}

function resolveLoginResult(token: string, authPayload?: unknown): { snapshot: AuthUserSnapshot } {
  const payloadDisplayName = resolveDisplayNameFromPayload(authPayload)
  if (payloadDisplayName) {
    return {
      snapshot: { displayName: payloadDisplayName, source: "login-response" },
    }
  }

  const jwtPayload = parseJwtPayload(token)
  if (jwtPayload) {
    for (const key of ["name", "username", "full_name", "email", "sub"]) {
      const value = extractDisplayName(jwtPayload[key])
      if (value) {
        return {
          snapshot: { displayName: value, source: "jwt-claim" },
        }
      }
    }
  }

  return {
    snapshot: { displayName: DEFAULT_DISPLAY_NAME, source: "fallback" },
  }
}

function extractProfileName(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null
  }

  const root = data as Record<string, unknown>
  const user =
    root.user && typeof root.user === "object"
      ? (root.user as Record<string, unknown>)
      : root.users && typeof root.users === "object"
        ? (root.users as Record<string, unknown>)
        : root

  return (
    extractDisplayName(user.name) ??
    extractDisplayName(user.full_name) ??
    extractDisplayName(user.username)
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(ACCESS_TOKEN_KEY))
  const [userSnapshot, setUserSnapshot] = useState<AuthUserSnapshot | null>(() => {
    const storedSnapshot = parseStoredSnapshot()
    if (storedSnapshot) {
      return storedSnapshot
    }

    const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!storedToken) {
      return null
    }

    return resolveLoginResult(storedToken).snapshot
  })

  const login = (newToken: string, authPayload?: unknown) => {
    const loginResult = resolveLoginResult(newToken, authPayload)

    localStorage.setItem(ACCESS_TOKEN_KEY, newToken)
    if (loginResult.snapshot) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(loginResult.snapshot))
    } else {
      localStorage.removeItem(AUTH_USER_KEY)
    }

    setToken(newToken)
    setUserSnapshot(loginResult.snapshot)
  }

  useEffect(() => {
    if (!token) {
      return
    }

    const userId = resolveUserIdFromToken(token)
    if (!userId) {
      return
    }

    if (userSnapshot?.source === "login-response" || userSnapshot?.source === "profile") {
      return
    }

    let cancelled = false

    async function hydrateUserNameFromProfile() {
      try {
        const response = await api.get(`/users/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const profileName = extractProfileName(response.data)
        if (!profileName || cancelled) {
          return
        }

        const nextSnapshot: AuthUserSnapshot = {
          displayName: profileName,
          source: "profile",
        }

        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextSnapshot))
        setUserSnapshot(nextSnapshot)
      } catch {
        // Keep the best available fallback when the profile endpoint is unavailable.
      }
    }

    void hydrateUserNameFromProfile()

    return () => {
      cancelled = true
    }
  }, [token, userSnapshot?.source])

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    setToken(null)
    setUserSnapshot(null)
  }

  const isAuthenticated = !!token
  const displayName = userSnapshot?.displayName ?? null
  const identityStatus: IdentityStatus = isAuthenticated
    ? userSnapshot?.source === "login-response"
      ? "resolved"
      : "fallback"
    : "anonymous"

  return (
    <AuthContext.Provider
      value={{ token, displayName, identityStatus, login, logout, isAuthenticated }}
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
