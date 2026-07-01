import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./App.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Signal to the inline loading overlay that the app has successfully started
try {
  (window as any).__APP_LOADED = true;
} catch (e) {
  // ignore in environments without window
}
