import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error?.response?.data?.detail

    if (detail === "Invalid token") {
      // Notify the app shell to logout (no React hooks here).
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:invalid-token"))
      }
    }

    return Promise.reject(error)
  },
)

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)
