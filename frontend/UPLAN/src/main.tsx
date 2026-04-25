
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { i18nReady } from "./i18n";
  import { applyDarkMode, getInitialDarkMode } from "./utils/theme";

  applyDarkMode(getInitialDarkMode());

  const hideRefreshLoader = () => {
    const loader = document.getElementById("app-refresh-loader");
    if (!loader) return;

    loader.classList.add("uplan-loader-hidden");
    window.setTimeout(() => loader.remove(), 260);
  };

  i18nReady.finally(() => {
    createRoot(document.getElementById("root")!).render(<App />);
    window.requestAnimationFrame(hideRefreshLoader);
  });
  
