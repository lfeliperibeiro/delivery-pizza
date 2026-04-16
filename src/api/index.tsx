import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error?.response?.data?.detail

    if (detail === "Invalid token") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:invalid-token"))
      }
    }

    return Promise.reject(error)
  },
)
