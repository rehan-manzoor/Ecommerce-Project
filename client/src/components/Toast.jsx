import { createContext, useContext, useEffect, useState } from "react";

const ToastContext = createContext(() => {});
const TOAST_LIFETIME_MS = 3200;

export const notify = (message, type = "success") =>
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { message, type } }));

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (event) => {
      const id = Date.now() + Math.random();
      setToasts((items) => [...items, { id, ...event.detail }]);
      setTimeout(() => {
        setToasts((items) => items.filter((item) => item.id !== id));
      }, TOAST_LIFETIME_MS);
    };

    window.addEventListener("app-toast", handler);
    return () => window.removeEventListener("app-toast", handler);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div className={`toast ${toast.type}`} key={toast.id}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
