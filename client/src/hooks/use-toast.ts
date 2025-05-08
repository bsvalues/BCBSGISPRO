/**
 * Toast Hook
 * 
 * A hook for displaying toast notifications.
 */

import { 
  Toast,
  ToastActionElement, 
  ToastProps 
} from "../components/ui/toast";

import {
  useToast as useToastPrimitive
} from "../components/ui/use-toast";

export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

type ToastOptions = Partial<
  Pick<Toast, "id" | "duration" | "className"> & {
    variant: ToastVariant;
    action: ToastActionElement;
    description: React.ReactNode;
    title: React.ReactNode;
  }
>;

/**
 * A hook for displaying toast notifications
 * 
 * @returns The toast API
 */
export function useToast() {
  const toast = useToastPrimitive();

  return {
    ...toast,
    toast: (options: ToastOptions) => {
      const { variant, ...rest } = options;
      
      return toast.toast({
        ...rest,
        variant: variant as ToastProps['variant'],
      });
    }
  };
}