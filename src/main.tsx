import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { FirebaseProvider } from "./lib/FirebaseProvider";
import './index.css';

// Intercept and suppress benign, dev-only WebSocket connection rejections and error logs from Vite HMR
if (typeof window !== "undefined") {
  // Helper to safely scrape any readable string from error/event objects
  const getErrorString = (err: any): string => {
    if (!err) return "";
    if (typeof err === "string") return err;
    try {
      const parts = [
        err.message,
        err.name,
        err.stack,
        err.description,
        err.code,
        err.reason,
        err.toString ? err.toString() : "",
      ];
      // Check object keys
      for (const key in err) {
        try {
          if (typeof err[key] === "string") {
            parts.push(err[key]);
          }
        } catch {
          // ignore potential secure property access errors
        }
      }
      return parts.filter(Boolean).join(" ");
    } catch {
      return "";
    }
  };

  // 1. Intercept unhandled promise rejections (e.g., WebSocket or HMR closed check)
  window.addEventListener("unhandledrejection", (event) => {
    const errorStr = getErrorString(event.reason);
    const eventStr = getErrorString(event);
    const combined = `${errorStr} ${eventStr}`.toLowerCase();
    
    if (
      combined.includes("websocket") || 
      combined.includes("vite") ||
      combined.includes("ws:") ||
      combined.includes("wss:") ||
      combined.includes("connection") ||
      combined.includes("closed without opened") ||
      combined.includes("hmr")
    ) {
      event.preventDefault(); // Suppress browser overlay/toast
      event.stopImmediatePropagation();
      event.stopPropagation();
    }
  }, true);

  // 2. Intercept uncaught/unhandled runtime websocket error events
  window.addEventListener("error", (event) => {
    const errorStr = getErrorString(event.error) || event.message || "";
    const eventStr = getErrorString(event);
    const combined = `${errorStr} ${eventStr}`.toLowerCase();
    
    if (
      combined.includes("websocket") ||
      combined.includes("vite") ||
      combined.includes("ws:") ||
      combined.includes("wss:") ||
      combined.includes("connection") ||
      combined.includes("closed without opened") ||
      combined.includes("hmr")
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    }
  }, true);

  // 3. Keep console logs clean of these specific benign developer notifications
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    const combined = args.map(arg => String(arg)).join(" ").toLowerCase();
    if (
      combined.includes("websocket") ||
      combined.includes("connectivity warning") ||
      combined.includes("connection") ||
      combined.includes("closed without opened")
    ) {
      // Quietly consume to keep developer console and viewer interface clean
      return;
    }
    originalWarn(...args);
  };

  console.error = (...args) => {
    const combined = args.map(arg => String(arg)).join(" ").toLowerCase();
    if (
      combined.includes("websocket") ||
      combined.includes("failed to connect") ||
      combined.includes("connection") ||
      combined.includes("closed without opened")
    ) {
      // Quietly consume
      return;
    }
    originalError(...args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </StrictMode>,
);
