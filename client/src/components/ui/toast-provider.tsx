import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Toast, toastVariants } from './toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';

// =============================
// Context and Types
// =============================

export interface ToastItem {
  id: string;
  variant?: React.ComponentProps<typeof Toast>['variant'];
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  duration?: number;
  onClose?: () => void;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<ToastItem>) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => '',
  removeToast: () => {},
  updateToast: () => {},
});

// =============================
// Toast Provider Component
// =============================

interface ToastProviderProps {
  children: React.ReactNode;
  /**
   * Default duration for toasts in milliseconds
   * @default 5000 (5 seconds)
   */
  defaultDuration?: number;
  /**
   * Maximum number of toasts to show at once
   * @default 5
   */
  maxToasts?: number;
}

export function ToastProvider({
  children,
  defaultDuration = 5000,
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = generateId();
    
    setToasts((prev) => {
      // If we've reached max toasts, remove the oldest one
      const filteredToasts = prev.length >= maxToasts
        ? prev.slice(1)
        : prev;
      
      // Add new toast with default duration if not specified
      return [...filteredToasts, {
        id,
        ...toast,
        duration: toast.duration ?? defaultDuration,
      }];
    });
    
    return id;
  }, [defaultDuration, maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const updateToast = useCallback((id: string, toast: Partial<ToastItem>) => {
    setToasts((prev) => 
      prev.map((t) => (t.id === id ? { ...t, ...toast } : t))
    );
  }, []);

  // Automatically remove toasts after their duration expires
  useEffect(() => {
    const timers = toasts.map((toast) => {
      if (toast.duration === Infinity) return undefined;
      
      const timer = setTimeout(() => {
        removeToast(toast.id);
      }, toast.duration);
      
      return timer;
    });
    
    return () => {
      timers.forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [toasts, removeToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        updateToast,
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// =============================
// Toast Container Component
// =============================

function ToastContainer() {
  const { toasts, removeToast } = useContext(ToastContext);
  
  return (
    <div
      className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col-reverse md:max-w-[420px]"
      aria-live="polite"
      role="region"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'group relative flex transform-gpu animate-in slide-in-from-right duration-300',
            'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]'
          )}
        >
          <Toast
            variant={toast.variant}
            className="w-full"
            onClose={() => {
              toast.onClose?.();
              removeToast(toast.id);
            }}
            title={toast.title}
            description={toast.description}
            action={toast.action}
            icon={toast.icon}
          />
        </div>
      ))}
    </div>
  );
}

// =============================
// Helper function to create different toast types
// =============================

export const createToast = {
  default: (props: Omit<ToastItem, 'id' | 'variant'>) => ({ variant: 'default', ...props }),
  success: (props: Omit<ToastItem, 'id' | 'variant'>) => ({ variant: 'success', ...props }),
  error: (props: Omit<ToastItem, 'id' | 'variant'>) => ({ variant: 'error', ...props }),
  warning: (props: Omit<ToastItem, 'id' | 'variant'>) => ({ variant: 'warning', ...props }),
  info: (props: Omit<ToastItem, 'id' | 'variant'>) => ({ variant: 'info', ...props }),
  loading: (props: Omit<ToastItem, 'id' | 'variant'>) => ({ variant: 'loading', ...props }),
};

// =============================
// Hook to use toast
// =============================

export function useToastContext() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  
  return context;
}