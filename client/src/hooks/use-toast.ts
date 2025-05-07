import { useState, useEffect } from "react";
import { Toast, ToastProps } from "../components/ui/toast";

// Define a unique ID for each toast
let toastIdCounter = 0;

// Define the toast interface with an ID
export type ToastType = ToastProps & { id: string };

// Create a state manager for toasts (quasi-store pattern)
type ToastStore = {
  toasts: ToastType[];
  addToast: (toast: ToastProps) => void;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<ToastProps>) => void;
};

const toastStore: ToastStore = {
  toasts: [],
  addToast: (toast: ToastProps) => {
    const id = `toast-${toastIdCounter++}`;
    toastStore.toasts = [...toastStore.toasts, { ...toast, id }];
    notifyListeners();
    
    // Auto-dismiss the toast if duration is specified
    if (toast.duration !== undefined && toast.duration > 0) {
      setTimeout(() => {
        toastStore.removeToast(id);
      }, toast.duration);
    }
    
    return id;
  },
  removeToast: (id: string) => {
    toastStore.toasts = toastStore.toasts.filter((t) => t.id !== id);
    notifyListeners();
  },
  updateToast: (id: string, toast: Partial<ToastProps>) => {
    toastStore.toasts = toastStore.toasts.map((t) =>
      t.id === id ? { ...t, ...toast } : t
    );
    notifyListeners();
  },
};

// Listeners for store updates
const listeners: Array<() => void> = [];

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

// Hook to use the toast store
export function useToast() {
  const [toasts, setToasts] = useState<ToastType[]>(toastStore.toasts);

  useEffect(() => {
    // Subscribe to store updates
    const handleChange = () => {
      setToasts([...toastStore.toasts]);
    };
    
    listeners.push(handleChange);
    
    // Cleanup on unmount
    return () => {
      const index = listeners.indexOf(handleChange);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    toasts,
    toast: toastStore.addToast,
    dismiss: toastStore.removeToast,
    update: toastStore.updateToast,
  };
}