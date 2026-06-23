import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept cross-origin Script Errors and unhandled rejections caused by secure iframe sandboxing or blocked popup providers.
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (event.message === "Script error." || event.message?.includes("Script error") || !event.filename) {
      console.warn("Caught and suppressed cross-origin Script error in sandbox iframe context:", event);
      event.preventDefault();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (reason && (
      reason.message?.includes("Script error") || 
      reason.message?.includes("popup-closed-by-user") || 
      reason.message?.includes("operation-not-allowed") ||
      (typeof reason === "string" && reason.includes("Script error"))
    )) {
      console.warn("Caught and suppressed cross-origin rejection in sandbox iframe context:", event);
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

