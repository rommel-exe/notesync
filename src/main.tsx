import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { runLaunchAutoUpdate } from "./features/updates/autoUpdate";
import "./index.css";

void runLaunchAutoUpdate();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
