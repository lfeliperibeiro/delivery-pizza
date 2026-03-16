import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./layout";
import { Home } from "./Pages/Home";
import { Orders } from "./Pages/Orders";
import { SignIn } from "./Pages/SignIn";
import { SignUp } from "./Pages/SignUp";

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
        path: "/home",
        element: <Layout />,

        children: [
          {
            index: true,
            element: <Home />,
          },
          {
            path: "/home/orders",
            element: <Orders />,
          }
        ],
      },
    ])