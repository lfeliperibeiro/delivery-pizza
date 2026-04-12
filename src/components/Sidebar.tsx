import {
  SidebarMenuItem, SidebarMenuButton,
  Sidebar as SidebarUI,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarMenu} from "./ui/sidebar"
import { LogoImg } from "@/assets/logo"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {PersonStanding, House, ShoppingCart, LogOut, ChartLine, Archive} from "lucide-react"

export function Sidebar(){
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
  <SidebarUI>
  <SidebarHeader>
    <SidebarMenu className="flex flex-col gap-2">
      <SidebarMenuItem>
              <div className="flex items-center gap-2">
                <LogoImg width={30} height={30}/>
                <span className="text-md font-bold">delivery pizza</span>
              </div>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarHeader>

  <SidebarContent>
    <SidebarMenu className="flex flex-col gap-2">
      <SidebarMenuItem>
            <SidebarMenuButton isActive={location.pathname === "/home"}>
              <Link to="/home" className="flex items-center gap-2">
                <House className="text-orange-400" />
                <span className="text-md font-bold">Home</span>
              </Link>
            </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
    <SidebarMenu className="flex flex-col gap-2">
      <SidebarMenuItem>
            <SidebarMenuButton isActive={location.pathname === "/orders"}>
              <Link to="/orders" className="flex items-center gap-2">
                <ShoppingCart className="text-orange-400"/>
                <span className="text-md font-bold">Pedidos</span>
              </Link>
            </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
            <SidebarMenuButton isActive={location.pathname === "/analytics"}>
              <Link to="/analytics" className="flex items-center gap-2">
                <ChartLine className="text-orange-400"/>
                <span className="text-md font-bold">Analytics</span>
              </Link>
            </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
            <SidebarMenuButton isActive={location.pathname === "/arquivados"}>
              <Link to="/arquivados" className="flex items-center gap-2">
                <Archive className="text-orange-400"/>
                <span className="text-md font-bold">Arquivados</span>
              </Link>
            </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
            <SidebarMenuButton
              isActive={
                location.pathname === "/users" ||
                location.pathname.startsWith("/users/")
              }
            >
              <Link to="/users" className="flex items-center gap-2">
               <PersonStanding className="text-orange-400"/>
                <span className="text-md font-bold">Usuários</span>
              </Link>
            </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarContent>

  <SidebarFooter>
    <SidebarMenu>
        <SidebarMenuItem>
            <SidebarMenuButton isActive={location.pathname === "/logout"}
              onClick={() => {
              logout()
              navigate("/")
            }}>
              <button className="flex items-center gap-2 cursor-pointer border-none bg-transparent w-full text-left">
                <LogOut className="text-orange-400"/>
                <span className="text-md font-bold">logout</span>
              </button>
            </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarFooter>
</SidebarUI>
  )
}