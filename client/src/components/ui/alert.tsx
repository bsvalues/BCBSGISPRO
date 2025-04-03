import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&>svg+div]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-white text-foreground',
        error: 'border-red-500/50 text-red-800 bg-red-50 [&>svg]:text-red-500',
        warning: 'border-yellow-500/50 text-yellow-800 bg-yellow-50 [&>svg]:text-yellow-500',
        success: 'border-green-500/50 text-green-800 bg-green-50 [&>svg]:text-green-500',
        info: 'border-blue-500/50 text-blue-800 bg-blue-50 [&>svg]:text-blue-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const AlertIcon = forwardRef<
  HTMLDivElement, 
  React.HTMLAttributes<HTMLDivElement> & { variant?: AlertProps['variant'] }
>(({ className, variant, ...props }, ref) => {
  const icons = {
    default: null,
    error: <XCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
  };

  if (!variant || !icons[variant]) {
    return null;
  }

  return (
    <div ref={ref} className={cn("mr-2", className)} {...props}>
      {icons[variant]}
    </div>
  );
});

AlertIcon.displayName = "AlertIcon";

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
);
Alert.displayName = 'Alert';

const AlertTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription, AlertIcon };