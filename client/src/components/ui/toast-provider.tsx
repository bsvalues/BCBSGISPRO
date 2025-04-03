import React, { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Toast, ToastOptions, ToastPosition, ToastProps } from './toast';
import { generateId } from '@/lib/utils';

/**
 * The default duration for toast notifications in milliseconds
 */
const DEFAULT_TOAST_DURATION = 5000;

/**
 * Interface for the ToastContext
 */
interface ToastContextType {
  /**
   * Add a new toast notification
   */
  addToast: (toast: ToastProps) => void;
  
  /**
   * Remove a toast by ID
   */
  removeToast: (id: string) => void;
  
  /**
   * Remove all toast notifications
   */
  removeAllToasts: () => void;
}

/**
 * Create the ToastContext
 */
export const ToastContext = createContext<ToastContextType | null>(null);

/**
 * Properties for the ToastProvider component
 */
interface ToastProviderProps {
  /**
   * Child components
   */
  children: ReactNode;
  
  /**
   * Position for toast notifications
   */
  position?: ToastPosition;
  
  /**
   * Default duration for toast notifications in milliseconds
   */
  defaultDuration?: number;
}

/**
 * ToastProvider component for managing toast notifications
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  defaultDuration = DEFAULT_TOAST_DURATION,
}) => {
  // State to store all active toast notifications
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  
  // Add a new toast notification
  const addToast = useCallback((toast: ToastProps) => {
    const id = toast.id || generateId();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);
  
  // Remove a toast by ID
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  
  // Remove all toast notifications
  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);
  
  // Auto-dismiss toasts based on their duration
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    toasts.forEach((toast) => {
      if (toast.duration !== 0) {
        const timer = setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration || defaultDuration);
        
        timers.push(timer);
      }
    });
    
    // Clean up timers on unmount or when toasts change
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, defaultDuration, removeToast]);
  
  // Position-based CSS classes
  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'top-center': 'top-0 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
  };
  
  // Create portal for toast container
  const toastContainer = typeof document !== 'undefined' && document.body
    ? createPortal(
        <div
          aria-live="polite"
          aria-atomic="true"
          className={`fixed z-50 flex flex-col gap-2 p-4 max-h-screen overflow-hidden ${positionClasses[position]}`}
        >
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              {...toast}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </div>,
        document.body
      )
    : null;
  
  return (
    <ToastContext.Provider value={{ addToast, removeToast, removeAllToasts }}>
      {children}
      {toastContainer}
    </ToastContext.Provider>
  );
};