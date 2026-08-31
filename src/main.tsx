import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/g/:shareCode", element: <GamePage /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="app">
      <RouterProvider router={router} />
    </div>
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // installability/offline fallback is a nice-to-have, not required for the app to work
    });
  });
}
