import React, { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Button variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';

/**
 * Button sizes
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button properties
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button content
   */
  children: ReactNode;
  
  /**
   * Button variant
   */
  variant?: ButtonVariant;
  
  /**
   * Button size
   */
  size?: ButtonSize;
  
  /**
   * Whether the button is in loading state
   */
  isLoading?: boolean;
  
  /**
   * Optional icon to display before the button text
   */
  leftIcon?: ReactNode;
  
  /**
   * Optional icon to display after the button text
   */
  rightIcon?: ReactNode;
  
  /**
   * Makes the button take the full width of its container
   */
  fullWidth?: boolean;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Button component for user actions
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    disabled,
    type = 'button',
    ...props
  }, ref) => {
    // Base classes
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none';
    
    // Variant-specific classes
    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400',
      outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
      link: 'bg-transparent text-primary-600 hover:underline focus:ring-0 p-0',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };
    
    // Size-specific classes
    const sizeClasses = {
      sm: 'text-xs py-1.5 px-3',
      md: 'text-sm py-2 px-4',
      lg: 'text-base py-2.5 px-5',
    };
    
    // Full width class
    const widthClass = fullWidth ? 'w-full' : '';
    
    // Loading state
    const isDisabled = disabled || isLoading;
    
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          widthClass,
          variant !== 'link' && 'shadow-sm',
          className
        )}
        {...props}
      >
        {isLoading && (
          <span className="mr-2 inline-block w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        )}
        
        {!isLoading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        
        {children}
        
        {!isLoading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';