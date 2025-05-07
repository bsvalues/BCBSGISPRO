// hooks/use-toast.ts
import { useState, useCallback, useMemo } from "react";
import type { ToastProps } from "../components/ui/toast";

type ToastWithId = ToastProps & { id: string };

// Toast context type
type ToastContextType = {
  toasts: ToastWithId[];
  toast: (props: ToastProps) => void;
  dismissToast: (id: string) => void;
  dismissAllToasts: () => void;
};

// Generate unique ID for toasts
const generateUniqueId = () => {
  return Math.random().toString(36).substring(2, 9);
};

// Create toast store
let toasts: ToastWithId[] = [];
let listeners: Array<(toasts: ToastWithId[]) => void> = [];

const emitChange = () => {
  listeners.forEach((listener) => {
    listener(toasts);
  });
};

const addToast = (props: ToastProps) => {
  const id = generateUniqueId();
  const newToast = { id, ...props };
  toasts = [...toasts, newToast];
  emitChange();
  return id;
};

const dismissToast = (id: string) => {
  toasts = toasts.filter((toast) => toast.id !== id);
  emitChange();
};

const dismissAllToasts = () => {
  toasts = [];
  emitChange();
};

// Custom hook to use toast
export function useToast(): ToastContextType {
  // Setup state to track toasts
  const [state, setState] = useState<ToastWithId[]>(toasts);

  // Setup listener
  useMemo(() => {
    const listener = (newToasts: ToastWithId[]) => {
      setState([...newToasts]);
    };
    
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  // Toast function
  const toast = useCallback((props: ToastProps) => {
    return addToast(props);
  }, []);

  // Return context
  return {
    toasts: state,
    toast,
    dismissToast,
    dismissAllToasts,
  };
}