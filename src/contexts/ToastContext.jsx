// src/contexts/ToastContext.jsx
import React, { createContext, useContext, useState } from "react";
import ToastContainer from "../components/ui/ToastContainer.jsx";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toastWithId = {
      id,
      ...toast,
      duration: toast.duration || 5000,
    };

    setToasts((prev) => [...prev, toastWithId]);

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, toastWithId.duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const toast = {
    success: (message, options = {}) =>
      addToast({ type: "success", message, ...options }),
    error: (message, options = {}) =>
      addToast({ type: "error", message, ...options }),
    warning: (message, options = {}) =>
      addToast({ type: "warning", message, ...options }),
    info: (message, options = {}) =>
      addToast({ type: "info", message, ...options }),
    default: (message, options = {}) =>
      addToast({ type: "default", message, ...options }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};
