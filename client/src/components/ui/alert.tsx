import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export type AlertVariant = 'default' | 'destructive' | 'success' | 'warning';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-blue-50 border-blue-200 text-blue-800',
      destructive: 'bg-red-50 border-red-200 text-red-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    };

    const variantIcon = {
      default: <Info className="h-5 w-5 text-blue-500" />,
      destructive: <XCircle className="h-5 w-5 text-red-500" />,
      success: <CheckCircle className="h-5 w-5 text-green-500" />,
      warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative border rounded-md p-4 flex items-start gap-3',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <div className="self-start mt-0.5">{variantIcon[variant]}</div>
        <div className="flex-1">{children}</div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('font-medium mb-1 text-lg leading-none tracking-tight', className)}
      {...props}
    />
  )
);

AlertTitle.displayName = 'AlertTitle';

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AlertDescription = React.forwardRef<HTMLDivElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm leading-relaxed', className)}
      {...props}
    />
  )
);

AlertDescription.displayName = 'AlertDescription';