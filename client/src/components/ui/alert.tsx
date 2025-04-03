import React, { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  X 
} from 'lucide-react';

/**
 * Alert variants
 */
export type AlertVariant = 'info' | 'warning' | 'error' | 'success';

/**
 * Alert properties
 */
export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Alert content
   */
  children: ReactNode;
  
  /**
   * Alert variant/type
   */
  variant?: AlertVariant;
  
  /**
   * Whether the alert is dismissible
   */
  isDismissible?: boolean;
  
  /**
   * Title to display in the alert
   */
  title?: string;
  
  /**
   * Callback when the alert is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Alert component for showing contextual feedback messages
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({
    children,
    variant = 'info',
    isDismissible = false,
    title,
    onDismiss,
    className,
    ...props
  }, ref) => {
    // Variant-specific styles
    const variantStyles = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-amber-50 border-amber-200 text-amber-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      success: 'bg-green-50 border-green-200 text-green-800',
    };
    
    // Variant-specific icons
    const variantIcons = {
      info: <Info className="h-5 w-5 text-blue-500" />,
      warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      error: <AlertCircle className="h-5 w-5 text-red-500" />,
      success: <CheckCircle className="h-5 w-5 text-green-500" />,
    };
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative rounded-lg border p-4 shadow-sm',
          variantStyles[variant],
          isDismissible && 'pr-10',
          className
        )}
        {...props}
      >
        <div className="flex gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {variantIcons[variant]}
          </div>
          
          {/* Content */}
          <div className="flex-1">
            {/* Title */}
            {title && (
              <h5 className="font-medium mb-1">
                {title}
              </h5>
            )}
            
            {/* Main content */}
            <div className={cn(title && 'text-sm opacity-90')}>
              {children}
            </div>
          </div>
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
                'focus:ring-amber-400': variant === 'warning',
                'focus:ring-red-400': variant === 'error',
                'focus:ring-green-400': variant === 'success',
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

Alert.displayName = 'Alert';