import { useContext } from 'react';
import { ToastContext, ToastContextType } from '@/components/ui/toast-provider';

/**
 * Hook for accessing toast functionality throughout the application
 * 
 * @returns Toast context object with methods for managing toasts
 * @throws Error if used outside of a ToastProvider
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

/**
 * Helper function to create toast with consistent types across the app
 */
export type ToastTypes = {
  success: (options: { title: string; description?: string; duration?: number }) => string;
  error: (options: { title: string; description?: string; duration?: number }) => string;
  warning: (options: { title: string; description?: string; duration?: number }) => string;
  info: (options: { title: string; description?: string; duration?: number }) => string;
};

/**
 * Factory function to create typed toast functions
 * 
 * @returns Object with typed toast functions
 */
export const createToastTypes = (): ToastTypes => {
  const { addToast } = useToast();
  
  return {
    success: ({ title, description, duration = 5000 }) => {
      return addToast({
        variant: 'success',
        title,
        description,
        duration,
      });
    },
    
    error: ({ title, description, duration = 7000 }) => {
      return addToast({
        variant: 'destructive',
        title,
        description,
        duration,
      });
    },
    
    warning: ({ title, description, duration = 5000 }) => {
      return addToast({
        variant: 'warning',
        title,
        description,
        duration,
      });
    },
    
    info: ({ title, description, duration = 5000 }) => {
      return addToast({
        variant: 'info',
        title,
        description,
        duration,
      });
    },
  };
};