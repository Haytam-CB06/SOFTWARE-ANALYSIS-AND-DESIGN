
  import { StrictMode } from "react";
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import Snowfall from "react-snowfall"

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
      <Snowfall color="#fff" snowflakeCount={200} />
    </StrictMode>
  );
  