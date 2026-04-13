import { createBrowserRouter } from "react-router-dom"
import { Layout } from "./layout"
import { Home } from "./Pages/Home"
import { Orders } from "./Pages/Orders"
import { SignIn } from "./Pages/SignIn"
import { SignUp } from "./Pages/SignUp"
import { Users } from "./Pages/Users"
import { EditUser } from "./Pages/EditUser"
import { EditOrder } from "./Pages/EditOrder"
import { Analytics } from "./Pages/Analytics"
import { ArchivedOrders } from "./Pages/ArchivedOrders"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SignIn />,
  },
  {
    path: "/register",
    element: <SignUp />,
  },
  {
    element: <Layout />,
    children: [
      { path: "/home", element: <Home /> },
      { path: "/orders", element: <Orders /> },
      { path: "/orders/edit", element: <EditOrder /> },
      { path: "/users", element: <Users /> },
      { path: "/users/edit/:id", element: <EditUser /> },
      { path: "/analytics", element: <Analytics /> },
      { path: "/archived", element: <ArchivedOrders /> },
    ],
  },
])
