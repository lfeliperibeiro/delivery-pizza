import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "./components/ui/sidebar"
import { Sidebar } from "./components/Sidebar"

export function Layout() {
    const { isAuthenticated } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to="/" replace />
    }

    return (
       <SidebarProvider>
      <Sidebar/>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
    )
}