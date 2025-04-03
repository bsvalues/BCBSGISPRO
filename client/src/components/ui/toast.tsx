import React, { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

/**
 * Toast variants
 */
export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

/**
 * Toast position
 */
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

/**
 * Toast properties
 */
export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Unique ID for the toast
   */
  id: string;
  
  /**
   * Toast title
   */
  title?: string;
  
  /**
   * Toast description/message
   */
  description?: string;
  
  /**
   * Toast variant/type
   */
  variant?: ToastVariant;
  
  /**
   * Auto-hide duration in milliseconds
   * Set to 0 to prevent auto-hiding
   */
  duration?: number;
  
  /**
   * Action button element
   */
  action?: ReactNode;
  
  /**
   * Whether the toast is dismissible
   */
  isDismissible?: boolean;
  
  /**
   * Callback when the toast is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Toast component for temporary notifications
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  ({
    id,
    title,
    description,
    variant = 'info',
    action,
    isDismissible = true,
    onDismiss,
    className,
    ...props
  }, ref) => {
    // Variant-specific styles
    const variantStyles = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-amber-50 border-amber-200 text-amber-800',
      error: 'bg-red-50 border-red-200 text-red-800',
    };
    
    // Variant-specific icons
    const variantIcons = {
      info: <Info className="h-5 w-5 text-blue-500" />,
      success: <CheckCircle className="h-5 w-5 text-green-500" />,
      warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      error: <AlertCircle className="h-5 w-5 text-red-500" />,
    };
    
    return (
      <div
        ref={ref}
        id={`toast-${id}`}
        role="alert"
        aria-live="polite"
        className={cn(
          'flex items-start w-full max-w-sm overflow-hidden rounded-lg border p-4 shadow-md',
          'animate-in slide-in-from-right-full duration-300',
          variantStyles[variant],
          isDismissible && 'pr-10',
          className
        )}
        {...props}
      >
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5 mr-3">
          {variantIcons[variant]}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          {title && (
            <h4 className="font-medium mb-1 pr-6">
              {title}
            </h4>
          )}
          
          {/* Description */}
          {description && (
            <div className={cn('text-sm opacity-90', !title && 'pr-6')}>
              {description}
            </div>
          )}
          
          {/* Action button */}
          {action && (
            <div className="mt-2">
              {action}
            </div>
          )}
        </div>
        
        {/* Dismiss button */}
        {isDismissible && onDismiss && (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onDismiss}
            className={cn(
              'absolute top-2 right-2 rounded-full p-1',
              'text-gray-400 hover:text-gray-500 hover:bg-gray-100',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
              {
                'focus:ring-blue-400': variant === 'info',
                'focus:ring-green-400': variant === 'success',
                'focus:ring-amber-400': variant === 'warning',
                'focus:ring-red-400': variant === 'error',
              }
            )}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

Toast.displayName = 'Toast';

/**
 * Options for creating a toast notification
 */
export interface ToastOptions {
  /**
   * Toast title
   */
  title?: string;
  
  /**
   * Toast description/message
   */
  description?: string;
  
  /**
   * Toast variant/type
   */
  variant?: ToastVariant;
  
  /**
   * Auto-hide duration in milliseconds
   * Set to 0 to prevent auto-hiding
   */
  duration?: number;
  
  /**
   * Action button element
   */
  action?: ReactNode;
  
  /**
   * Whether the toast is dismissible
   */
  isDismissible?: boolean;
}