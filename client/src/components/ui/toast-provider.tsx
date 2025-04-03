import React, { createContext, useState, useCallback } from 'react';
import { Toast, ToastProps, ToastViewport, ToastPosition } from '@/components/ui/toast';
import { generateId } from '@/lib/utils';

export interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastProps, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<ToastProps>) => void;
  removeAllToasts: () => void;
  position: ToastPosition;
  setPosition: (position: ToastPosition) => void;
}

export interface ToastItem extends ToastProps {
  id: string;
  createdAt: Date;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export interface ToastProviderProps {
  children: React.ReactNode;
  defaultPosition?: ToastPosition;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  defaultPosition = 'bottom-right',
  maxToasts = 5
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [position, setPosition] = useState<ToastPosition>(defaultPosition);

  const addToast = useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = generateId();

    setToasts((currentToasts) => {
      // If we have reached the max limit, remove the oldest toast
      const newToasts = currentToasts.length >= maxToasts 
        ? [...currentToasts.slice(1)] 
        : [...currentToasts];

      return [
        ...newToasts,
        {
          ...toast,
          id,
          createdAt: new Date(),
        },
      ];
    });

    // If toast has a duration, auto-dismiss it
    if (toast.duration !== Infinity && toast.duration !== undefined) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000); // Default to 5 seconds
    }

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts((currentToasts) => 
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);

  const updateToast = useCallback((id: string, updatedToast: Partial<ToastProps>) => {
    setToasts((currentToasts) => 
      currentToasts.map((toast) => 
        toast.id === id ? { ...toast, ...updatedToast } : toast
      )
    );
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Value to be provided through the context
  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    updateToast,
    removeAllToasts,
    position,
    setPosition,
  };

  // Sort toasts by creation time to ensure consistent ordering
  const sortedToasts = [...toasts].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastViewport position={position}>
        {sortedToasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            onClose={() => removeToast(toast.id)}
            className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
          >
            {toast.children}
          </Toast>
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  );
};