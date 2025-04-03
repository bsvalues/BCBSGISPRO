import { useCallback } from 'react';
import { useToastContext, createToast, ToastItem } from '@/components/ui/toast-provider';

/**
 * Hook that provides methods for displaying toast notifications
 * 
 * @returns Methods for displaying and managing toast notifications
 * 
 * @example
 * ```tsx
 * const { toast, dismiss } = useToast();
 * 
 * // Show a success toast
 * toast.success({
 *   title: 'Success!',
 *   description: 'Your action was completed successfully.'
 * });
 * 
 * // Show an error toast
 * toast.error({
 *   title: 'Error',
 *   description: 'Something went wrong. Please try again.'
 * });
 * ```
 */
export function useToast() {
  const { addToast, removeToast, updateToast } = useToastContext();

  // Create a toast with default variant
  const toast = useCallback(
    (props: Omit<ToastItem, 'id'>) => {
      return addToast(props);
    },
    [addToast]
  );

  // Dismiss a toast by ID
  const dismiss = useCallback(
    (toastId: string) => {
      removeToast(toastId);
    },
    [removeToast]
  );

  // Update a toast by ID
  const update = useCallback(
    (toastId: string, props: Partial<Omit<ToastItem, 'id'>>) => {
      updateToast(toastId, props);
    },
    [updateToast]
  );

  // Create helper methods for different toast variants
  return {
    toast: Object.assign(toast, {
      // Show a default toast
      default: (props: Omit<ToastItem, 'id' | 'variant'>) => 
        addToast(createToast.default(props)),
      
      // Show a success toast
      success: (props: Omit<ToastItem, 'id' | 'variant'>) => 
        addToast(createToast.success(props)),
      
      // Show an error toast
      error: (props: Omit<ToastItem, 'id' | 'variant'>) => 
        addToast(createToast.error(props)),
      
      // Show a warning toast
      warning: (props: Omit<ToastItem, 'id' | 'variant'>) => 
        addToast(createToast.warning(props)),
      
      // Show an info toast
      info: (props: Omit<ToastItem, 'id' | 'variant'>) => 
        addToast(createToast.info(props)),
      
      // Show a loading toast
      loading: (props: Omit<ToastItem, 'id' | 'variant'>) => 
        addToast(createToast.loading(props)),
    }),
    dismiss,
    update,
  };
}