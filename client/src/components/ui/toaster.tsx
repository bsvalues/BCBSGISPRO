import * as React from "react";
import {
  Toast,
  ToastViewport,
} from "./toast";
import { useToast } from "../../hooks/use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastViewport>
      {toasts.map((toast) => {
        return (
          <Toast
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            action={toast.action}
            onClose={() => dismiss(toast.id)}
            duration={toast.duration}
          />
        );
      })}
    </ToastViewport>
  );
}