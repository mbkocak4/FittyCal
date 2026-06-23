import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept cross-origin Script Errors and unhandled rejections caused by secure iframe sandboxing or blocked popup providers.
if (typeof window !== "undefined") {
  // Traditional window.onerror hook returning true will prevent browser from bubbling untracked Script errors
  const originalOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    const msgStr = String(message || "");
    if (msgStr.includes("Script error") || msgStr === "Script error." || !source) {
      console.warn("Captured cross-origin Script error via global onerror:", message, "from:", source);
      return true; // Silence and prevent reporting
    }
    if (originalOnError) {
      return originalOnError.apply(this, arguments as any);
    }
    return false;
  };

  window.addEventListener("error", (event) => {
    const msgStr = event.message || "";
    if (msgStr === "Script error." || msgStr.includes("Script error") || !event.filename) {
      console.warn("Caught and suppressed cross-origin Script error in sandbox iframe context:", event);
      event.preventDefault();
      event.stopPropagation();
    }
  }, { capture: true });

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
      event.stopPropagation();
    }
  }, { capture: true });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

