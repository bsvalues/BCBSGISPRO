import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline:
          "text-foreground border border-input hover:bg-accent hover:text-accent-foreground",
        success:
          "bg-green-100 text-green-800 hover:bg-green-200",
        warning:
          "bg-amber-100 text-amber-800 hover:bg-amber-200",
        danger:
          "bg-red-100 text-red-800 hover:bg-red-200",
        info:
          "bg-blue-100 text-blue-800 hover:bg-blue-200",
        implemented:
          "bg-green-100 text-green-800 hover:bg-green-200",
        missing:
          "bg-red-100 text-red-800 hover:bg-red-200",
        partial:
          "bg-amber-100 text-amber-800 hover:bg-amber-200",
        critical:
          "bg-red-100 text-red-800 hover:bg-red-200 border border-red-300",
        recommended:
          "bg-blue-100 text-blue-800 hover:bg-blue-200",
        optional:
          "bg-gray-100 text-gray-800 hover:bg-gray-200",
        information:
          "bg-violet-100 text-violet-800 hover:bg-violet-200",
        technical:
          "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
        legal:
          "bg-slate-100 text-slate-800 hover:bg-slate-200",
        design:
          "bg-pink-100 text-pink-800 hover:bg-pink-200",
        structure:
          "bg-cyan-100 text-cyan-800 hover:bg-cyan-200"
      },
      size: {
        default: "h-6 px-2.5 py-0.5 text-xs",
        sm: "h-5 px-2 py-0 text-xs",
        lg: "h-7 px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };