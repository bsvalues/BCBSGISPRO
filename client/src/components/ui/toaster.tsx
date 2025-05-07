// Toaster.tsx
"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
} from "../ui/toast";
import { useToast } from "../../hooks/use-toast";
import { useEffect } from "react";

export function Toaster() {
  const { toasts, dismissToast } = useToast();

  // Handle auto-dismiss for toasts with duration
  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(toast.id);
        }, toast.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [toasts, dismissToast]);

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, duration, onClose, ...props }) => (
        <Toast
          key={id}
          variant={variant}
          title={title}
          description={description}
          action={action}
          onClose={() => {
            if (onClose) onClose();
            dismissToast(id);
          }}
          {...props}
        />
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}