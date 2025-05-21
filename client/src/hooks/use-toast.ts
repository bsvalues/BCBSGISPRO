import { useCallback } from 'react';

// Toast variant types
export type ToastVariant = 'default' | 'destructive' | 'success';

// Toast props interface
export interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// This is a simplified version of a toast hook that will be expanded later
// with actual toast functionality. Currently it just logs to console.
export const useToast = () => {
  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 3000 }: ToastProps) => {
      console.log(`Toast: ${variant}`, { title, description, duration });
      
      // In a real implementation, this would show a toast notification
      // This will be expanded with toast UI components later
    },
    []
  );

  return { toast };
};