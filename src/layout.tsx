import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "./components/ui/sidebar"
import { Sidebar } from "./components/Sidebar"

export function Layout() {
    const { displayName, identityStatus, isAuthenticated  } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to="/" replace />
    }

    const greetingName = displayName ?? "Usuario"
    const greetingTone =
      identityStatus === "resolved"
        ? "text-foreground"
        : "text-muted-foreground"

    return (
       <SidebarProvider>
      <Sidebar/>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-4 flex min-w-0 flex-col gap-1">
          <p className={`text-sm ${greetingTone}`}>Ola, <strong>{greetingName}</strong></p>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", weekday: "long" })}</p>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
    )
}
