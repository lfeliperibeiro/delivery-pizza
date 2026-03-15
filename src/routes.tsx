import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./layout";
import { Home } from "./Pages/Home";
import { CreateProduct } from "./Pages/CreateProduct";
import { SignIn } from "./Pages/SignIn";

export const router = createBrowserRouter([
      {
        path: "/",
        element: <SignIn />,
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
            path: "/home/create-product",
            element: <CreateProduct />,
          }
        ],
      },
    ])