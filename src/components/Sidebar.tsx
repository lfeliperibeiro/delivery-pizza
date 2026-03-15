import {
  SidebarMenuItem, SidebarMenuButton,
  Sidebar as SidebarUI,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarMenu} from "./ui/sidebar"
import { LogoImg } from "@/assets/logo"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { HomeImg } from "@/assets/home_img"
import { SignOutImg } from "@/assets/signout_img"
import { AdminIcon } from "@/assets/admin_icon"
import { useAuth } from "@/contexts/AuthContext"

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
                <HomeImg />
                <span className="text-md font-bold">Home</span>
              </Link>
            </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
    <SidebarMenu className="flex flex-col gap-2">
      <SidebarMenuItem>
            <SidebarMenuButton isActive={location.pathname === "/home/create-product"}>
              <Link to="/home/create-product" className="flex items-center gap-2">
                <AdminIcon />
                <span className="text-md font-bold">Adicionar Pizza</span>
              </Link>
            </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarContent>

  <SidebarFooter>
    <SidebarMenu>
        <SidebarMenuItem>
            <SidebarMenuButton isActive={location.pathname === "/logout"} onClick={() => {
              logout(),
              navigate("/")
              }}>
              <button className="flex items-center gap-2 cursor-pointer border-none bg-transparent w-full text-left">
                <SignOutImg />
                <span className="text-md font-bold">logout</span>
              </button>
            </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarFooter>
</SidebarUI>
  )
}