import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'default' | 'destructive' | 'success' | 'info' | 'warning';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ToastVariant;
  onClose?: () => void;
  title?: string;
  description?: string;
  duration?: number;
  position?: ToastPosition;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ 
    className, 
    variant = 'default', 
    onClose, 
    title, 
    description, 
    children,
    ...props 
  }, ref) => {
    const variantStyles = {
      default: 'bg-white border-gray-200 text-gray-800',
      destructive: 'bg-red-50 border-red-200 text-red-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'max-w-md w-full shadow-lg rounded-lg pointer-events-auto overflow-hidden border',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-start p-4">
          <div className="flex-1">
            {title && (
              <h4 className="text-sm font-medium mb-1">{title}</h4>
            )}
            {description && (
              <p className="text-sm opacity-90">{description}</p>
            )}
            {children}
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="ml-4 flex-shrink-0 flex justify-center items-center h-5 w-5 rounded-full hover:bg-gray-200 transition"
              aria-label="Close"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

export const ToastViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { position?: ToastPosition }>(
  ({ className, position = 'bottom-right', ...props }, ref) => {
    const positionStyles = {
      'top-right': 'top-0 right-0',
      'top-left': 'top-0 left-0',
      'bottom-right': 'bottom-0 right-0',
      'bottom-left': 'bottom-0 left-0',
      'top-center': 'top-0 left-1/2 -translate-x-1/2',
      'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'fixed z-50 flex max-h-screen flex-col-reverse p-4 gap-2 sm:flex-col',
          positionStyles[position],
          className
        )}
        {...props}
      />
    );
  }
);

ToastViewport.displayName = 'ToastViewport';