import { useContext, useCallback } from 'react';
import { ToastContext } from '@/components/ui/toast-provider';
import { ToastOptions, ToastProps } from '@/components/ui/toast';
import { generateId } from '@/lib/utils';

/**
 * Return value from the useToast hook
 */
interface UseToastReturn {
  /**
   * Show a toast notification
   */
  toast: (options: ToastOptions) => void;
  
  /**
   * Show an info toast notification
   */
  info: (options: Omit<ToastOptions, 'variant'>) => void;
  
  /**
   * Show a success toast notification
   */
  success: (options: Omit<ToastOptions, 'variant'>) => void;
  
  /**
   * Show a warning toast notification
   */
  warning: (options: Omit<ToastOptions, 'variant'>) => void;
  
  /**
   * Show an error toast notification
   */
  error: (options: Omit<ToastOptions, 'variant'>) => void;
  
  /**
   * Dismiss a toast notification by ID
   */
  dismiss: (id: string) => void;
  
  /**
   * Dismiss all toast notifications
   */
  dismissAll: () => void;
}

/**
 * Hook for showing toast notifications
 * 
 * Must be used within a ToastProvider component
 */
export const useToast = (): UseToastReturn => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  const { addToast, removeToast, removeAllToasts } = context;
  
  // Show a toast notification
  const toast = useCallback((options: ToastOptions) => {
    const id = generateId();
    addToast({ ...options, id } as ToastProps);
    return id;
  }, [addToast]);
  
  // Show an info toast notification
  const info = useCallback((options: Omit<ToastOptions, 'variant'>) => {
    return toast({ ...options, variant: 'info' });
  }, [toast]);
  
  // Show a success toast notification
  const success = useCallback((options: Omit<ToastOptions, 'variant'>) => {
    return toast({ ...options, variant: 'success' });
  }, [toast]);
  
  // Show a warning toast notification
  const warning = useCallback((options: Omit<ToastOptions, 'variant'>) => {
    return toast({ ...options, variant: 'warning' });
  }, [toast]);
  
  // Show an error toast notification
  const error = useCallback((options: Omit<ToastOptions, 'variant'>) => {
    return toast({ ...options, variant: 'error' });
  }, [toast]);
  
  return {
    toast,
    info,
    success,
    warning,
    error,
    dismiss: removeToast,
    dismissAll: removeAllToasts,
  };
};