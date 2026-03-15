# Pizza Delivery App - Frontend 🍕

This is the frontend application for the **Pizza Delivery** system. It provides an intuitive interface for both customers and administrators to view the menu, manage orders, and handle their accounts.

## 🚀 Tech Stack

This project is built using modern web development tools:
- **React 19** - UI Library
- **Vite** - Fast Build Tool & Development Server
- **TypeScript** - Strongly Typed Programming Language
- **TailwindCSS 4** - Utility-first CSS Framework
- **shadcn/ui** - Unstyled, Accessible UI Components (powered by Radix UI)
- **React Router v7** - Declarative Routing

## ✨ Features

- **Authentication System**: Secure JWT-based login (communicating with a Python/FastAPI backend).
- **Protected Routes**: Main application routes (`/home`, `/home/create-product`) are guarded by Context API. Unauthenticated users are redirected cleanly to the sign-in page.
- **Dynamic Dashboard**: Custom Sidebar layout utilizing modern CSS techniques to organize the workspace.
- **Order Management**: Real-time rendering of active orders, fetching complex JSON schema relations directly from the API.

## 📦 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed on your machine.
You must also have the `fast-api` backend running locally on port `8000`.

### Installation

1. Clone the repository
2. Install the project dependencies:
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm run dev
   ```

### Default Credentials
*For development purposes, default test accounts map to the seeded database in the FastAPI backend.*

## 📂 Project Structure

- `src/assets`: Static assets, images, and SVGs used across the app (like `admin_icon.tsx`, `pizza.png`).
- `src/components`: Reusable UI components (buttons, badges, cards, dialogs, inputs) generated mostly by `shadcn/ui`.
  - `OrderCard.tsx`: The primary complex component visualizing incoming orders.
  - `Sidebar.tsx`: The main application navigation shell.
- `src/contexts`: Application-wide context providers (e.g., `AuthContext.tsx`).
- `src/Pages`: Top-level navigational route components (`Home.tsx`, `SignIn.tsx`, `CreateProduct.tsx`).
- `src/layout.tsx`: The root application layout wrapping all protected content.
- `src/routes.tsx`: Configuration for `react-router-dom` to map URLs to Pages.

## 🤝 How to Contribute

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---
*Developed with ❤️*
